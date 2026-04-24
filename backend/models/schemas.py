"""
models/schemas.py — Pydantic v2 request / response schemas
Matches the exact JSON shapes the React frontend expects.
"""
from __future__ import annotations
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ────────────────────────────────────────────────
# Auth
# ────────────────────────────────────────────────
class OtpSendRequest(BaseModel):
    phone: str = Field(..., examples=["+919876543210"])


class OtpSendResponse(BaseModel):
    message: str
    # In dev mode we echo the OTP back so you can test without SMS
    otp: Optional[str] = None


class OtpVerifyRequest(BaseModel):
    phone: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    wallet_address: Optional[str] = None


# ────────────────────────────────────────────────
# Mint
# ────────────────────────────────────────────────
class MintRequest(BaseModel):
    kwh: float = Field(..., gt=0, description="Surplus energy in kWh to mint tokens for")


class MintResponse(BaseModel):
    mint_request_id: str
    status: str
    message: str


# ────────────────────────────────────────────────
# Listings
# ────────────────────────────────────────────────
class ListingCreate(BaseModel):
    kwh: float = Field(..., gt=0)
    price_per_kwh: float = Field(..., gt=0, description="Price in ₹ per kWh")


class ListingOut(BaseModel):
    id: str
    producer_id: str
    kwh: float
    price_inr: float
    price_per_kwh: float
    token_id: Optional[str]
    status: str
    tx_hash: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ────────────────────────────────────────────────
# Trades
# ────────────────────────────────────────────────
class TradeOut(BaseModel):
    id: str
    listing_id: str
    buyer_id: str
    seller_id: str
    kwh: float
    amount_inr: float
    tx_hash: Optional[str]
    status: str
    executed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class PurchaseRequest(BaseModel):
    listing_id: str


class PurchaseResponse(BaseModel):
    trade_id: str
    status: str
    message: str


# ────────────────────────────────────────────────
# Proof
# ────────────────────────────────────────────────
class ProofOut(BaseModel):
    id: str
    trade_id: str
    buyer_address: str
    seller_address: str
    kwh: float
    amount_inr: float
    tx_hash: str
    block_number: Optional[int]
    signature: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ────────────────────────────────────────────────
# Price
# ────────────────────────────────────────────────
class PriceOut(BaseModel):
    price_per_kwh: float
    irradiance: Optional[float]
    demand_index: Optional[float]
    timestamp: datetime


# ────────────────────────────────────────────────
# DISCOM
# ────────────────────────────────────────────────
class DiscomTradeOut(TradeOut):
    buyer_wallet: Optional[str] = None
    seller_wallet: Optional[str] = None


class DiscomProofOut(ProofOut):
    pass


# ────────────────────────────────────────────────
# Generic
# ────────────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str
