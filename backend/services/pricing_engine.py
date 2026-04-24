"""
services/pricing_engine.py
Solar curve + demand index → ₹/kWh pricing.
Runs every 30 s via APScheduler and caches the latest price in memory.
"""
import logging
import math
from datetime import datetime, timezone
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from services.nasa_api import fetch_irradiance

logger = logging.getLogger(__name__)

# ── In-memory price cache ──────────────────────────────────────────────────
_price_cache: dict = {
    "price_per_kwh": 5.50,        # default ₹/kWh
    "irradiance": None,
    "demand_index": None,
    "timestamp": datetime.now(timezone.utc),
}

_scheduler: Optional[AsyncIOScheduler] = None

# Pricing constants (tunable)
BASE_PRICE          = 4.0    # ₹/kWh floor
IRRADIANCE_SCALE    = 0.008  # higher irradiance → lower price (excess supply)
DEMAND_PEAK_PREMIUM = 2.0    # ₹ added during peak hours (8–10 AM / 6–9 PM)


def _compute_demand_index() -> float:
    """0.0–1.0 demand index based on time-of-day."""
    hour = datetime.now().hour
    if 8 <= hour <= 10 or 18 <= hour <= 21:
        return 1.0   # peak
    elif 22 <= hour or hour <= 5:
        return 0.2   # off-peak
    else:
        return 0.6   # shoulder


def _compute_price(irradiance: float, demand_index: float) -> float:
    """Solar price curve: lower irradiance & higher demand → higher price."""
    # Irradiance component: max irradiance (≈ 350 W/m²) → minimal discount
    irradiance_discount = IRRADIANCE_SCALE * min(irradiance, 350)
    demand_premium = DEMAND_PEAK_PREMIUM * demand_index
    price = BASE_PRICE - irradiance_discount + demand_premium
    # Clamp to [₹3.00, ₹12.00]
    return round(max(3.0, min(12.0, price)), 2)


async def _refresh_price():
    """Called every 30 s — fetches irradiance and updates the cache."""
    global _price_cache
    try:
        irradiance   = await fetch_irradiance()
        demand_index = _compute_demand_index()
        price        = _compute_price(irradiance or 200.0, demand_index)

        _price_cache = {
            "price_per_kwh": price,
            "irradiance": irradiance,
            "demand_index": demand_index,
            "timestamp": datetime.now(timezone.utc),
        }
        logger.info(f"Price updated: ₹{price}/kWh | irradiance={irradiance} W/m² | demand={demand_index}")
    except Exception as exc:
        logger.error(f"Pricing engine error: {exc}")


def get_current_price() -> dict:
    """Return the latest cached price snapshot."""
    return _price_cache.copy()


async def start_pricing_engine():
    global _scheduler
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(_refresh_price, "interval", seconds=30, id="price_refresh")
    _scheduler.start()
    # Run immediately on startup
    await _refresh_price()
    logger.info("Pricing engine started (30 s interval).")


async def stop_pricing_engine():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Pricing engine stopped.")
