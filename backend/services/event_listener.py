"""
services/event_listener.py
Listens to TokenPurchased events on the EnergyMarketplace contract.
When an event fires, builds a signed proof object and stores it in DB.
Falls back to polling pending trades when no contract is available.
"""
import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select

from config.db import AsyncSessionLocal
from config.settings import settings
from models.db_models import Listing, Proof, Trade, Wallet

logger = logging.getLogger(__name__)

_listener_task: Optional[asyncio.Task] = None
_stop_event = asyncio.Event()


def _build_proof_signature(trade: Trade, buyer_addr: str, seller_addr: str) -> str:
    """
    Deterministic signature: SHA-256 of key trade fields + oracle private key.
    In production use eth_account.sign_message for a proper EIP-712 sig.
    """
    payload = json.dumps({
        "trade_id":    trade.id,
        "buyer":       buyer_addr,
        "seller":      seller_addr,
        "kwh":         trade.kwh,
        "amount_inr":  trade.amount_inr,
        "tx_hash":     trade.tx_hash or "",
    }, sort_keys=True)
    secret = settings.private_key or settings.secret_key
    return hashlib.sha256((payload + secret).encode()).hexdigest()


async def _finalize_trade(db, trade: Trade):
    """Create proof and mark trade + listing as confirmed."""
    # Resolve wallet addresses
    buyer_w  = (await db.execute(select(Wallet).where(Wallet.user_id == trade.buyer_id))).scalar_one_or_none()
    seller_w = (await db.execute(select(Wallet).where(Wallet.user_id == trade.seller_id))).scalar_one_or_none()

    buyer_addr  = buyer_w.address  if buyer_w  else "0x" + "0" * 40
    seller_addr = seller_w.address if seller_w else "0x" + "0" * 40

    # Check proof doesn't already exist
    existing = (await db.execute(select(Proof).where(Proof.trade_id == trade.id))).scalar_one_or_none()
    if existing:
        return

    signature = _build_proof_signature(trade, buyer_addr, seller_addr)
    proof = Proof(
        trade_id=trade.id,
        buyer_address=buyer_addr,
        seller_address=seller_addr,
        kwh=trade.kwh,
        amount_inr=trade.amount_inr,
        tx_hash=trade.tx_hash or "0x" + "0" * 64,
        block_number=None,
        signature=signature,
    )
    db.add(proof)

    # Update trade
    trade.status      = "confirmed"
    trade.executed_at = datetime.now(timezone.utc)

    # Close out the listing
    listing = (await db.execute(select(Listing).where(Listing.id == trade.listing_id))).scalar_one_or_none()
    if listing:
        listing.status = "sold"

    await db.commit()
    logger.info(f"Proof created for trade {trade.id}")


async def _simulation_loop():
    """
    When no contract is configured: poll every 20 s for pending trades
    that have been pending > 30 s and auto-confirm them (demo mode).
    """
    from datetime import timedelta
    logger.info("Event listener running in SIMULATION mode (no contract configured).")

    while not _stop_event.is_set():
        try:
            async with AsyncSessionLocal() as db:
                cutoff = datetime.now(timezone.utc) - timedelta(seconds=30)
                result = await db.execute(
                    select(Trade).where(
                        Trade.status == "pending",
                        Trade.created_at < cutoff,
                    )
                )
                pending_trades = result.scalars().all()

                for trade in pending_trades:
                    trade.tx_hash = f"0x{'a' * 64}"
                    await _finalize_trade(db, trade)

        except Exception as exc:
            logger.error(f"Event listener loop error: {exc}")

        await asyncio.sleep(20)


async def _on_chain_loop():
    """Subscribe to TradeExecuted events via web3.py async filter."""
    from config.contracts import get_energy_marketplace
    from config.provider import w3

    contract = get_energy_marketplace()
    if contract is None:
        await _simulation_loop()
        return

    logger.info("Event listener: watching TokenPurchased on-chain events.")
    try:
        event_filter = await contract.events.TokenPurchased.create_filter(fromBlock="latest")
    except Exception:
        logger.warning("Could not create on-chain event filter — falling back to simulation.")
        await _simulation_loop()
        return

    while not _stop_event.is_set():
        try:
            events = await event_filter.get_new_entries()
            for evt in events:
                args = evt["args"]
                tx_hash = evt["transactionHash"].hex()

                async with AsyncSessionLocal() as db:
                    # Match trade by chain_listing_id
                    chain_listing_id = args.get("listingId")
                    
                    if chain_listing_id is not None:
                        # Find the Listing associated with this chain_listing_id
                        from models.db_models import Listing
                        lst_res = await db.execute(
                            select(Listing).where(Listing.chain_listing_id == chain_listing_id)
                        )
                        listing = lst_res.scalar_one_or_none()
                        
                        if listing:
                            # Find the pending Trade for this listing
                            result = await db.execute(
                                select(Trade).where(Trade.listing_id == listing.id, Trade.status == "pending")
                            )
                            trade = result.scalar_one_or_none()
                            if trade:
                                trade.tx_hash = tx_hash
                                await _finalize_trade(db, trade)
        except Exception as exc:
            logger.error(f"On-chain event error: {exc}")

        await asyncio.sleep(5)


async def start_event_listener():
    global _listener_task, _stop_event
    _stop_event.clear()
    _listener_task = asyncio.create_task(_on_chain_loop())
    logger.info("Event listener started.")


async def stop_event_listener():
    global _listener_task
    _stop_event.set()
    if _listener_task and not _listener_task.done():
        _listener_task.cancel()
        try:
            await _listener_task
        except asyncio.CancelledError:
            pass
    logger.info("Event listener stopped.")
