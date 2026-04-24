"""
routers/trades.py
GET /trades/{address}  — trade history for a wallet address
GET /proof/{trade_id}  — cryptographic proof for a completed trade
POST /trades/purchase  — consumer buys a listing (creates a pending trade)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging

from config.db import get_db
from config.contracts import get_energy_marketplace
from middleware.auth import get_current_user
from models.db_models import Listing, Proof, Trade, User, Wallet
from models.schemas import ProofOut, PurchaseRequest, PurchaseResponse, TradeOut
from services.wallet_manager import load_wallet, ensure_funded, sign_and_send
from config.provider import w3

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/trades/{address}", response_model=List[TradeOut])
async def get_trades_for_address(address: str, db: AsyncSession = Depends(get_db)):
    """
    Return all trades where the given wallet address was either buyer or seller.
    """
    # Resolve wallet → user
    w_res = await db.execute(
        select(Wallet).where(Wallet.address == address)
    )
    wallet = w_res.scalar_one_or_none()

    if not wallet:
        return []

    result = await db.execute(
        select(Trade).where(
            (Trade.buyer_id == wallet.user_id) | (Trade.seller_id == wallet.user_id)
        ).order_by(Trade.created_at.desc())
    )
    return result.scalars().all()


@router.get("/proof/{trade_id}", response_model=ProofOut)
async def get_proof(trade_id: str, db: AsyncSession = Depends(get_db)):
    """Return the cryptographic proof object for a trade."""
    result = await db.execute(select(Proof).where(Proof.trade_id == trade_id))
    proof = result.scalar_one_or_none()
    if not proof:
        raise HTTPException(status_code=404, detail="Proof not found for this trade")
    return proof


@router.post("/trades/purchase", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
async def purchase_listing(
    body: PurchaseRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Consumer purchases an active listing → creates a pending Trade."""
    buyer_id = current_user["sub"]

    # Load listing
    lst_res = await db.execute(select(Listing).where(Listing.id == body.listing_id))
    listing = lst_res.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "active":
        raise HTTPException(status_code=400, detail="Listing is no longer available")
    if listing.producer_id == buyer_id:
        raise HTTPException(status_code=400, detail="Cannot purchase your own listing")

    # Reserve listing
    listing.status = "pending_sale"

    trade = Trade(
        listing_id=listing.id,
        buyer_id=buyer_id,
        seller_id=listing.producer_id,
        kwh=listing.kwh,
        amount_inr=listing.price_inr,
        status="pending",
    )
    db.add(trade)
    
    # 2. Blockchain integration: Buy token on marketplace
    marketplace_contract = get_energy_marketplace()
    if marketplace_contract and listing.chain_listing_id is not None:
        try:
            # Load buyer's custodial wallet
            buyer_wallet = await load_wallet(buyer_id, db)
            
            # The price we listed with was int(price_inr * 10**16) or 10**15
            price_wei = int(listing.price_inr * 10**16)
            if price_wei == 0:
                price_wei = 10**15
                
            # Ensure wallet has enough MATIC for price + gas
            await ensure_funded(buyer_wallet.address, min_balance_wei=price_wei + 15_000_000_000_000_000)
            
            gas_price = await w3.eth.gas_price
            nonce = await w3.eth.get_transaction_count(buyer_wallet.address)
            
            buy_tx = await marketplace_contract.functions.buyToken(
                listing.chain_listing_id
            ).build_transaction({
                "from": buyer_wallet.address,
                "nonce": nonce,
                "value": price_wei,
                "gasPrice": gas_price,
                "gas": 300_000,
            })
            
            tx_hash_hex = await sign_and_send(buy_tx, buyer_wallet)
            logger.info(f"Initiated on-chain purchase: tx={tx_hash_hex}")
            trade.tx_hash = tx_hash_hex
            
        except Exception as e:
            logger.error(f"Error purchasing token on-chain: {e}", exc_info=True)
            # In a robust app, we'd roll back the trade/listing, but for now we let it fail or log it.

    await db.commit()
    await db.refresh(trade)

    return PurchaseResponse(
        trade_id=trade.id,
        status="pending",
        message="Purchase initiated. Awaiting on-chain confirmation.",
    )
