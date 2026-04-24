"""
routers/listings.py
GET  /listings        — browse all active listings
POST /listings        — producer creates a new listing
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from config.db import get_db
from middleware.auth import get_current_user
from models.db_models import Listing
from models.schemas import ListingCreate, ListingOut
from services.pricing_engine import get_current_price

router = APIRouter()


@router.get("/listings", response_model=List[ListingOut])
async def get_listings(db: AsyncSession = Depends(get_db)):
    """Return all active energy listings."""
    result = await db.execute(
        select(Listing).where(Listing.status == "active").order_by(Listing.created_at.desc())
    )
    listings = result.scalars().all()
    return listings


@router.post("/listings", response_model=ListingOut, status_code=status.HTTP_201_CREATED)
async def create_listing(
    body: ListingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Producer creates a new energy listing on the marketplace."""
    user_id = current_user["sub"]

    # Use caller-specified price or fall back to current engine price
    price_per_kwh = body.price_per_kwh
    price_inr = round(body.kwh * price_per_kwh, 2)

    listing = Listing(
        producer_id=user_id,
        kwh=body.kwh,
        price_inr=price_inr,
        price_per_kwh=price_per_kwh,
        status="active",
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing
