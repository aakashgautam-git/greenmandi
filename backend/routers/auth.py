"""
routers/auth.py
POST /auth/otp/send  — generate & store a 6-digit OTP (echoed in dev mode)
POST /auth/otp/verify — validate OTP, create user+wallet if new, return JWT
"""
import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.db import get_db
from config.settings import settings
from models.db_models import OtpCode, User
from models.schemas import OtpSendRequest, OtpSendResponse, OtpVerifyRequest, TokenResponse
from services.wallet_manager import create_wallet

router = APIRouter()

OTP_TTL_MINUTES = 5


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "role": role, "exp": expire},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


@router.post("/otp/send", response_model=OtpSendResponse)
async def send_otp(body: OtpSendRequest, db: AsyncSession = Depends(get_db)):
    """Generate a 6-digit OTP for the given phone number."""
    code = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)

    otp_record = OtpCode(phone=body.phone, code=code, expires_at=expires_at)
    db.add(otp_record)
    await db.commit()

    # TODO: Integrate real SMS provider (Twilio / MSG91) here
    # For now we echo the OTP back in the response (dev/demo mode)
    return OtpSendResponse(
        message=f"OTP sent to {body.phone} (dev mode — see 'otp' field)",
        otp=code,
    )


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(body: OtpVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP → create user if new → issue JWT."""
    now = datetime.now(timezone.utc)

    # Find a valid, unused OTP
    result = await db.execute(
        select(OtpCode)
        .where(
            OtpCode.phone == body.phone,
            OtpCode.code == body.otp,
            OtpCode.used.is_(False),
            OtpCode.expires_at > now,
        )
        .order_by(OtpCode.created_at.desc())
        .limit(1)
    )
    otp_record = result.scalar_one_or_none()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
        )

    # Mark OTP as used
    otp_record.used = True
    await db.flush()

    # Upsert user
    user_result = await db.execute(select(User).where(User.phone == body.phone))
    user = user_result.scalar_one_or_none()

    wallet_address = None
    if not user:
        user = User(phone=body.phone, role="producer")
        db.add(user)
        await db.flush()

        # Auto-create custodial wallet
        wallet = await create_wallet(user.id, db)
        wallet_address = wallet.address
    else:
        # Fetch existing wallet address if any
        from models.db_models import Wallet
        w_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
        w = w_res.scalar_one_or_none()
        wallet_address = w.address if w else None

    await db.commit()

    token = _create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role,
        wallet_address=wallet_address,
    )
