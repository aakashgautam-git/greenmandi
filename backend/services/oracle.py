"""
services/oracle.py
Polls for pending MintRequests every 15 s.
Calls confirmMint() on the EnergyToken contract via the oracle wallet.
Updates the MintRequest status + token_id in DB.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from config.db import AsyncSessionLocal
from config.provider import w3
from config.settings import settings
from models.db_models import MintRequest, Wallet

logger = logging.getLogger(__name__)

_oracle_scheduler: Optional[AsyncIOScheduler] = None


async def _process_pending_mints():
    """Find all pending mint requests and attempt on-chain confirmation."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(MintRequest).where(MintRequest.status == "pending")
        )
        pending = result.scalars().all()

        if not pending:
            return

        from config.contracts import get_energy_token
        contract = get_energy_token()

        for req in pending:
            try:
                if contract is None or not settings.private_key:
                    # No contract deployed yet — simulate confirmation
                    req.status = "confirmed"
                    req.token_id = f"sim-token-{req.id[:8]}"
                    req.tx_hash = f"0x{'0' * 64}"
                    logger.info(f"[SIM] Mint confirmed for request {req.id} ({req.kwh} kWh)")
                    await db.commit()
                    continue

                # --- Look up the producer's on-chain wallet address ---
                wallet_res = await db.execute(
                    select(Wallet).where(Wallet.user_id == req.user_id)
                )
                wallet = wallet_res.scalar_one_or_none()
                if not wallet:
                    logger.error(f"No wallet for user {req.user_id} — skipping mint {req.id}")
                    req.status = "failed"
                    await db.commit()
                    continue

                producer_address = w3.to_checksum_address(wallet.address)
                amount_wh = int(req.kwh * 1000)  # kWh → Wh (uint, no decimals)

                from eth_account import Account
                oracle_account = Account.from_key(settings.private_key)
                nonce = await w3.eth.get_transaction_count(oracle_account.address)
                gas_price = await w3.eth.gas_price

                tx = await contract.functions.confirmMint(
                    producer_address,
                    amount_wh,
                ).build_transaction({
                    "from":     oracle_account.address,
                    "nonce":    nonce,
                    "gasPrice": gas_price,
                    "gas":      250_000,
                })
                signed = oracle_account.sign_transaction(tx)
                # web3.py v6 uses .raw_transaction (not .rawTransaction)
                tx_hash = await w3.eth.send_raw_transaction(signed.raw_transaction)
                receipt = await w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

                req.tx_hash = tx_hash.hex()

                if receipt.status == 1:
                    # Parse the MintConfirmed event to get the actual on-chain tokenId
                    events = contract.events.MintConfirmed().process_receipt(receipt)
                    token_id = str(events[0]["args"]["tokenId"]) if events else ""
                    req.status = "confirmed"
                    req.token_id = token_id
                    logger.info(
                        f"✅ Mint confirmed — tx={tx_hash.hex()} tokenId={token_id} "
                        f"producer={producer_address} kWh={req.kwh}"
                    )
                else:
                    req.status = "failed"
                    logger.warning(f"❌ Mint tx reverted — {tx_hash.hex()}")

                await db.commit()

            except Exception as exc:
                logger.error(f"Oracle error for mint request {req.id}: {exc}", exc_info=True)
                req.status = "failed"
                await db.commit()


async def start_oracle():
    global _oracle_scheduler
    _oracle_scheduler = AsyncIOScheduler()
    _oracle_scheduler.add_job(_process_pending_mints, "interval", seconds=15, id="oracle_poll")
    _oracle_scheduler.start()
    logger.info("Oracle service started (15 s poll interval).")


async def stop_oracle():
    global _oracle_scheduler
    if _oracle_scheduler and _oracle_scheduler.running:
        _oracle_scheduler.shutdown(wait=False)
        logger.info("Oracle service stopped.")
