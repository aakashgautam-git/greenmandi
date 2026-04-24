"""
services/nasa_api.py
Fetches solar irradiance data for Bangalore from the NASA POWER API.
https://power.larc.nasa.gov/api/temporal/daily/point
"""
import logging
from datetime import date, timedelta
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# Bangalore coordinates
LATITUDE  = 12.9716
LONGITUDE = 77.5946
NASA_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"


async def fetch_irradiance() -> Optional[float]:
    """
    Returns the average daily solar irradiance (W/m²) for Bangalore.
    Uses yesterday's date since today's data may not be available yet.
    Falls back to a reasonable default on error.
    """
    yesterday = (date.today() - timedelta(days=1)).strftime("%Y%m%d")
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN",
        "community": "RE",
        "longitude": LONGITUDE,
        "latitude": LATITUDE,
        "start": yesterday,
        "end": yesterday,
        "format": "JSON",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(NASA_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()
            value = (
                data.get("properties", {})
                .get("parameter", {})
                .get("ALLSKY_SFC_SW_DWN", {})
                .get(yesterday)
            )
            if value is not None and value != -999:
                logger.debug(f"NASA irradiance for {yesterday}: {value} kWh/m²/day")
                # Convert kWh/m²/day → W/m² (÷ 0.0036, since 1 kWh = 3.6 MJ)
                return round(float(value) * 1000 / 24, 2)
    except Exception as exc:
        logger.warning(f"NASA API fetch failed: {exc}. Using fallback irradiance.")

    # Bangalore annual average ≈ 200 W/m²
    return 200.0
