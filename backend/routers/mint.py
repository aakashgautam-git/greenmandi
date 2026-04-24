"""
routers/mint.py
POST /mint — producer requests token minting for surplus energy
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from config.db import get_db
from middleware.auth import get_current_user
from models.db_models import MintRequest as MintRequestModel
from models.schemas import MintRequest, MintResponse

router = APIRouter()


@router.post("/mint", response_model=MintResponse)
async def request_mint(
    body: MintRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Producer submits a mint request for surplus kWh.
    The oracle service will watch for this record and call confirmMint() on-chain.
    """
    user_id = current_user["sub"]

    mint_req = MintRequestModel(user_id=user_id, kwh=body.kwh, status="pending")
    db.add(mint_req)
    await db.commit()
    await db.refresh(mint_req)

    return MintResponse(
        mint_request_id=mint_req.id,
        status="pending",
        message=f"Mint request received for {body.kwh} kWh. Oracle will confirm shortly.",
    )
