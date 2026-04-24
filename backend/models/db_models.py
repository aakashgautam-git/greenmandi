"""
models/db_models.py — SQLAlchemy ORM models
Tables: users, wallets, otp_codes, trades, proofs, listings, price_snapshots
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.orm import relationship

from config.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id         = Column(String, primary_key=True, default=_uuid)
    phone      = Column(String, unique=True, nullable=False, index=True)
    role       = Column(String, default="producer")          # producer | consumer | discom
    created_at = Column(DateTime, server_default=func.now())

    wallet = relationship("Wallet", back_populates="user", uselist=False)
    trades_as_buyer  = relationship("Trade", foreign_keys="Trade.buyer_id",  back_populates="buyer")
    trades_as_seller = relationship("Trade", foreign_keys="Trade.seller_id", back_populates="seller")
    listings = relationship("Listing", back_populates="producer")


class Wallet(Base):
    __tablename__ = "wallets"

    id              = Column(String, primary_key=True, default=_uuid)
    user_id         = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    address         = Column(String, unique=True, nullable=False)
    encrypted_key   = Column(Text, nullable=False)  # AES-encrypted private key
    created_at      = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="wallet")


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    phone      = Column(String, nullable=False, index=True)
    code       = Column(String(6), nullable=False)
    used       = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Listing(Base):
    __tablename__ = "listings"

    id           = Column(String, primary_key=True, default=_uuid)
    producer_id  = Column(String, ForeignKey("users.id"), nullable=False)
    kwh          = Column(Float, nullable=False)
    price_inr    = Column(Float, nullable=False)       # ₹ total
    price_per_kwh= Column(Float, nullable=False)
    token_id     = Column(String, nullable=True)       # on-chain token ID once minted
    status       = Column(String, default="active")    # active | sold | cancelled
    tx_hash      = Column(String, nullable=True)
    created_at   = Column(DateTime, server_default=func.now())

    producer = relationship("User", back_populates="listings")
    trade    = relationship("Trade", back_populates="listing", uselist=False)


class Trade(Base):
    __tablename__ = "trades"

    id          = Column(String, primary_key=True, default=_uuid)
    listing_id  = Column(String, ForeignKey("listings.id"), nullable=False)
    buyer_id    = Column(String, ForeignKey("users.id"),    nullable=False)
    seller_id   = Column(String, ForeignKey("users.id"),    nullable=False)
    kwh         = Column(Float, nullable=False)
    amount_inr  = Column(Float, nullable=False)
    tx_hash     = Column(String, nullable=True)
    status      = Column(String, default="pending")    # pending | confirmed | failed
    executed_at = Column(DateTime, nullable=True)
    created_at  = Column(DateTime, server_default=func.now())

    listing = relationship("Listing",  back_populates="trade")
    buyer   = relationship("User", foreign_keys=[buyer_id],  back_populates="trades_as_buyer")
    seller  = relationship("User", foreign_keys=[seller_id], back_populates="trades_as_seller")
    proof   = relationship("Proof", back_populates="trade", uselist=False)


class Proof(Base):
    __tablename__ = "proofs"

    id            = Column(String, primary_key=True, default=_uuid)
    trade_id      = Column(String, ForeignKey("trades.id"), unique=True, nullable=False)
    buyer_address = Column(String, nullable=False)
    seller_address= Column(String, nullable=False)
    kwh           = Column(Float, nullable=False)
    amount_inr    = Column(Float, nullable=False)
    tx_hash       = Column(String, nullable=False)
    block_number  = Column(Integer, nullable=True)
    signature     = Column(Text, nullable=True)       # oracle signature
    created_at    = Column(DateTime, server_default=func.now())

    trade = relationship("Trade", back_populates="proof")


class MintRequest(Base):
    __tablename__ = "mint_requests"

    id          = Column(String, primary_key=True, default=_uuid)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    kwh         = Column(Float, nullable=False)
    status      = Column(String, default="pending")   # pending | confirmed | failed
    token_id    = Column(String, nullable=True)
    tx_hash     = Column(String, nullable=True)
    created_at  = Column(DateTime, server_default=func.now())


class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    price_per_kwh = Column(Float, nullable=False)
    irradiance    = Column(Float, nullable=True)
    demand_index  = Column(Float, nullable=True)
    created_at    = Column(DateTime, server_default=func.now())
