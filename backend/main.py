"""
Solarix FastAPI Backend — main.py
Entry point: mounts all routers, CORS, global exception handlers,
and starts background services (oracle, event listener, pricing engine).
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.db import init_db
from routers import auth, mint, listings, trades, price, discom
from services.oracle import start_oracle, stop_oracle
from services.event_listener import start_event_listener, stop_event_listener
from services.pricing_engine import start_pricing_engine, stop_pricing_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Solarix backend starting up…")

    # 1. Create all DB tables
    await init_db()

    # 2. Start background services
    await start_pricing_engine()
    await start_oracle()
    await start_event_listener()

    logger.info("✅ All background services started.")
    yield

    # Shutdown
    logger.info("🛑 Solarix backend shutting down…")
    await stop_event_listener()
    await stop_oracle()
    await stop_pricing_engine()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Solarix API",
    description="P2P Solar Energy Trading Platform — Backend API",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server and any future frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router,      prefix="/auth",   tags=["Auth"])
app.include_router(mint.router,      prefix="",        tags=["Mint"])
app.include_router(listings.router,  prefix="",        tags=["Listings"])
app.include_router(trades.router,    prefix="",        tags=["Trades"])
app.include_router(price.router,     prefix="",        tags=["Price"])
app.include_router(discom.router,    prefix="/discom", tags=["DISCOM"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Meta"])
async def health():
    return {"status": "ok", "service": "solarix-backend-v2"}
