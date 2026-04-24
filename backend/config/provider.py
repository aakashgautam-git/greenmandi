"""
config/provider.py — web3.py AsyncWeb3 provider pointing at Polygon Amoy
"""
from web3 import AsyncWeb3, AsyncHTTPProvider
from config.settings import settings

w3 = AsyncWeb3(AsyncHTTPProvider(settings.polygon_rpc_url))
