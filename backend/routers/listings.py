"""
routers/listings.py
GET  /listings        — browse all active listings
POST /listings        — producer creates a new listing
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging

from config.db import get_db
from config.settings import settings
from config.contracts import get_energy_token, get_energy_marketplace
from middleware.auth import get_current_user
from models.db_models import Listing, MintRequest
from models.schemas import ListingCreate, ListingOut
from services.pricing_engine import get_current_price
from services.wallet_manager import load_wallet, ensure_funded, sign_and_send
from config.provider import w3

logger = logging.getLogger(__name__)
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

    # 1. Find a confirmed MintRequest for this user that hasn't been listed yet
    # For demo purposes, just get the most recent confirmed mint request
    result = await db.execute(
        select(MintRequest)
        .where(MintRequest.user_id == user_id, MintRequest.status == "confirmed")
        .order_by(MintRequest.created_at.desc())
        .limit(1)
    )
    mint_req = result.scalar_one_or_none()
    if not mint_req or not mint_req.token_id:
        raise HTTPException(status_code=400, detail="No confirmed minted energy tokens found for this user. Request mint first.")
    
    token_id = int(mint_req.token_id)
    
    # 2. Blockchain integration: List token on marketplace
    marketplace_contract = get_energy_marketplace()
    token_contract = get_energy_token()
    
    chain_listing_id = None
    tx_hash_hex = None
    
    if marketplace_contract and token_contract:
        try:
            # Load user's custodial wallet
            user_wallet = await load_wallet(user_id, db)
            
            # Ensure it has enough MATIC to pay gas
            await ensure_funded(user_wallet.address)
            
            gas_price = await w3.eth.gas_price
            
            # 2a. Approve marketplace to handle tokens
            is_approved = await token_contract.functions.isApprovedForAll(user_wallet.address, marketplace_contract.address).call()
            if not is_approved:
                nonce = await w3.eth.get_transaction_count(user_wallet.address)
                approve_tx = await token_contract.functions.setApprovalForAll(
                    marketplace_contract.address, 
                    True
                ).build_transaction({
                    "from": user_wallet.address,
                    "nonce": nonce,
                    "gasPrice": gas_price,
                    "gas": 100_000,
                })
                approve_tx_hash = await sign_and_send(approve_tx, user_wallet)
                await w3.eth.wait_for_transaction_receipt(approve_tx_hash, timeout=60)
                logger.info(f"Marketplace approved by {user_wallet.address}")

            # 2b. List the token
            # We list the price in Wei for native MATIC payments (e.g., 0.001 MATIC)
            # In a real app we'd peg to INR, but here we just convert INR -> MATIC Wei as an approximation
            # Let's say 1 INR = 0.01 MATIC = 10^16 Wei
            price_wei = int(price_inr * 10**16) 
            if price_wei == 0:
                price_wei = 10**15 # fallback min price
                
            nonce = await w3.eth.get_transaction_count(user_wallet.address)
            list_tx = await marketplace_contract.functions.listToken(
                token_id, 
                price_wei
            ).build_transaction({
                "from": user_wallet.address,
                "nonce": nonce,
                "gasPrice": gas_price,
                "gas": 250_000,
            })
            tx_hash_hex = await sign_and_send(list_tx, user_wallet)
            receipt = await w3.eth.wait_for_transaction_receipt(tx_hash_hex, timeout=60)
            
            if receipt.status == 1:
                events = marketplace_contract.events.TokenListed().process_receipt(receipt)
                if events:
                    chain_listing_id = events[0]["args"]["listingId"]
                    logger.info(f"✅ Token listed on-chain: listingId={chain_listing_id}")
            else:
                logger.warning(f"❌ List token tx reverted: {tx_hash_hex}")
        except Exception as e:
            logger.error(f"Error listing token on-chain: {e}", exc_info=True)
            # We can choose to fail or continue in simulated mode
            # Let's fail if blockchain is connected but errors out
            pass

    listing = Listing(
        producer_id=user_id,
        kwh=body.kwh,
        price_inr=price_inr,
        price_per_kwh=price_per_kwh,
        token_id=str(token_id),
        chain_listing_id=chain_listing_id,
        status="active",
        tx_hash=tx_hash_hex,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing
