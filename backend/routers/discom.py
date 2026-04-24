"""
routers/discom.py
GET /discom/trades  — all trades (DISCOM read-only audit view)
GET /discom/proofs  — all proofs
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from config.db import get_db
from models.db_models import Proof, Trade
from models.schemas import DiscomProofOut, DiscomTradeOut

router = APIRouter()


@router.get("/trades", response_model=List[DiscomTradeOut])
async def discom_trades(db: AsyncSession = Depends(get_db)):
    """DISCOM: read-only view of all trades across the platform."""
    result = await db.execute(select(Trade).order_by(Trade.created_at.desc()))
    return result.scalars().all()


@router.get("/proofs", response_model=List[DiscomProofOut])
async def discom_proofs(db: AsyncSession = Depends(get_db)):
    """DISCOM: all cryptographic trade proofs."""
    result = await db.execute(select(Proof).order_by(Proof.created_at.desc()))
    return result.scalars().all()
