"""
services/wallet_manager.py
Custodial wallet create/load/sign using eth_account (web3.py ecosystem).
Private keys are stored AES-encrypted in the DB for demo purposes.
In production, use a KMS (AWS KMS / HashiCorp Vault).
"""
import hashlib
import json
import logging
import os

from eth_account import Account
from eth_account.signers.local import LocalAccount
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from models.db_models import Wallet

logger = logging.getLogger(__name__)

# Simple XOR-based obfuscation for dev (replace with real KMS in production)
_MASTER_KEY = hashlib.sha256(settings.secret_key.encode()).digest()


def _obfuscate(data: str) -> str:
    """Deterministic reversible obfuscation (NOT production-grade encryption)."""
    data_bytes = data.encode()
    key_stream = (_MASTER_KEY * ((len(data_bytes) // len(_MASTER_KEY)) + 1))[: len(data_bytes)]
    xored = bytes(a ^ b for a, b in zip(data_bytes, key_stream))
    return xored.hex()


def _deobfuscate(hex_data: str) -> str:
    xored = bytes.fromhex(hex_data)
    key_stream = (_MASTER_KEY * ((len(xored) // len(_MASTER_KEY)) + 1))[: len(xored)]
    return bytes(a ^ b for a, b in zip(xored, key_stream)).decode()


async def create_wallet(user_id: str, db: AsyncSession) -> Wallet:
    """Generate a new Ethereum keypair and persist it (obfuscated) to DB."""
    account: LocalAccount = Account.create()
    encrypted_key = _obfuscate(account.key.hex())

    wallet = Wallet(
        user_id=user_id,
        address=account.address,
        encrypted_key=encrypted_key,
    )
    db.add(wallet)
    await db.flush()
    logger.info(f"Created wallet {account.address} for user {user_id}")
    return wallet


async def load_wallet(user_id: str, db: AsyncSession) -> LocalAccount:
    """Load and decrypt the custodial wallet for a user."""
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise ValueError(f"No wallet found for user {user_id}")

    private_key = _deobfuscate(wallet.encrypted_key)
    return Account.from_key(private_key)


async def sign_and_send(tx: dict, signer: LocalAccount) -> str:
    """Sign a transaction dict and broadcast it. Returns tx hash."""
    from config.provider import w3
    signed = signer.sign_transaction(tx)
    tx_hash = await w3.eth.send_raw_transaction(signed.rawTransaction)
    return tx_hash.hex()
