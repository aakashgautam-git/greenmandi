"""
config/contracts.py — Loads ABIs + addresses for EnergyToken & EnergyMarketplace
Falls back gracefully if artifacts aren't compiled yet.
"""
import json
import os
import logging
from pathlib import Path

from config.provider import w3
from config.settings import settings

logger = logging.getLogger(__name__)

# Paths (monorepo layout: backend/ sits one level below root)
ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS_DIR = ROOT / "contracts" / "artifacts" / "contracts"
DEPLOYMENTS_FILE = ROOT / "contracts" / "deployments" / "amoy.json"

_energy_token = None
_energy_marketplace = None


def _load_abi(contract_name: str) -> list:
    """Load ABI from Hardhat artifact JSON."""
    artifact_path = ARTIFACTS_DIR / f"{contract_name}.sol" / f"{contract_name}.json"
    if not artifact_path.exists():
        logger.warning(f"ABI artifact not found at {artifact_path}. Returning empty ABI.")
        return []
    with open(artifact_path) as f:
        return json.load(f)["abi"]


def _load_addresses() -> dict:
    """Load deployed addresses from deployments/amoy.json."""
    if not DEPLOYMENTS_FILE.exists():
        logger.warning(f"Deployments file not found at {DEPLOYMENTS_FILE}. Using env vars instead.")
        return {
            "EnergyToken": settings.energy_token_address,
            "EnergyMarketplace": settings.energy_marketplace_address,
        }
    with open(DEPLOYMENTS_FILE) as f:
        return json.load(f)


def get_energy_token():
    global _energy_token
    if _energy_token is None:
        addrs = _load_addresses()
        abi = _load_abi("EnergyToken")
        addr = addrs.get("EnergyToken", settings.energy_token_address)
        if addr and abi:
            _energy_token = w3.eth.contract(address=w3.to_checksum_address(addr), abi=abi)
        else:
            logger.warning("EnergyToken contract not available (missing address or ABI).")
    return _energy_token


def get_energy_marketplace():
    global _energy_marketplace
    if _energy_marketplace is None:
        addrs = _load_addresses()
        abi = _load_abi("EnergyMarketplace")
        addr = addrs.get("EnergyMarketplace", settings.energy_marketplace_address)
        if addr and abi:
            _energy_marketplace = w3.eth.contract(address=w3.to_checksum_address(addr), abi=abi)
        else:
            logger.warning("EnergyMarketplace contract not available (missing address or ABI).")
    return _energy_marketplace
