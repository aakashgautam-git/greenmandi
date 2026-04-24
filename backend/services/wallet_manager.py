"""
services/wallet_manager.py
Custodial wallet create/load/sign using eth_account (web3.py ecosystem).
Private keys are stored XOR-obfuscated in the DB for demo purposes.
In production, use a KMS (AWS KMS / HashiCorp Vault).
"""
import hashlib
import logging

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
    """Sign a transaction dict and broadcast it. Returns tx hash hex."""
    from config.provider import w3
    signed = signer.sign_transaction(tx)
    tx_hash = await w3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()


async def ensure_funded(address: str, min_balance_wei: int = 15_000_000_000_000_000) -> None:
    """
    Ensure a custodial wallet has at least `min_balance_wei` MATIC for gas.
    Default threshold: 0.015 MATIC. If below, oracle wallet tops it up to 0.02 MATIC.
    This is a convenience helper for the Amoy testnet demo.
    """
    from config.provider import w3
    checksum_addr = w3.to_checksum_address(address)
    balance = await w3.eth.get_balance(checksum_addr)

    if balance >= min_balance_wei:
        return  # Already funded, nothing to do

    top_up_amount = 20_000_000_000_000_000  # 0.02 MATIC in wei
    oracle_account = Account.from_key(settings.private_key)
    nonce = await w3.eth.get_transaction_count(oracle_account.address)
    gas_price = await w3.eth.gas_price

    tx = {
        "nonce":    nonce,
        "to":       checksum_addr,
        "value":    top_up_amount,
        "gas":      21_000,
        "gasPrice": gas_price,
        "chainId":  80002,  # Polygon Amoy
    }
    signed = oracle_account.sign_transaction(tx)
    tx_hash = await w3.eth.send_raw_transaction(signed.raw_transaction)
    await w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    logger.info(f"💰 Funded {address} with 0.02 MATIC from oracle (tx={tx_hash.hex()})")
