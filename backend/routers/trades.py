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

from config.db import get_db
from middleware.auth import get_current_user
from models.db_models import Listing, Proof, Trade, User, Wallet
from models.schemas import ProofOut, PurchaseRequest, PurchaseResponse, TradeOut

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
    await db.commit()
    await db.refresh(trade)

    return PurchaseResponse(
        trade_id=trade.id,
        status="pending",
        message="Purchase initiated. Awaiting on-chain confirmation.",
    )
