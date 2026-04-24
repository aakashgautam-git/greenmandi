"""
routers/price.py
GET /price/current — returns latest ₹/kWh from pricing engine
"""
from fastapi import APIRouter
from models.schemas import PriceOut
from services.pricing_engine import get_current_price

router = APIRouter()


@router.get("/price/current", response_model=PriceOut)
async def current_price():
    """Return the live solar energy price in ₹/kWh."""
    snapshot = get_current_price()
    return PriceOut(
        price_per_kwh=snapshot["price_per_kwh"],
        irradiance=snapshot.get("irradiance"),
        demand_index=snapshot.get("demand_index"),
        timestamp=snapshot["timestamp"],
    )
