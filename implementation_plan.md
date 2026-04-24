# Phase 1: Smart Contracts Implementation Plan

This plan covers the initialization, development, and deployment setup for the Solarix smart contracts on the Polygon Amoy testnet.

## Goal

Create a `contracts/` directory with a fully functioning Hardhat project that includes the necessary Solidity contracts to replace the current backend simulation with actual on-chain token minting and trading.

## Proposed Changes

### 1. Hardhat Setup
- Create a `contracts/` folder in the root directory.
- Initialize a Hardhat project (`npm init -y`, `npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv`).
- Create `hardhat.config.js` configured for the **Polygon Amoy testnet** using the RPC URL and Private Key from the backend `.env`.

### 2. Smart Contracts (`contracts/`)

#### [NEW] `contracts/contracts/EnergyToken.sol`
- An ERC-1155 contract inheriting from OpenZeppelin.
- Represents tokenized solar energy generation (kWh).
- **Features**:
  - `confirmMint(address producer, uint256 amount)`: Authorized function (only callable by the Oracle Wallet) to mint tokens directly to a producer's wallet when generation is confirmed.
  - Role-based access control (only Oracle can mint).

#### [NEW] `contracts/contracts/EnergyMarketplace.sol`
- A marketplace contract to facilitate buying and selling of `EnergyToken`.
- **Features**:
  - `listTokens(uint256 tokenId, uint256 amount, uint256 price)`: Producer can list their minted tokens for sale.
  - `buyTokens(uint256 listingId)`: Consumer can purchase listed tokens (payable in native MATIC or an ERC20 stablecoin, we will stick to native MATIC for simplicity for now).

### 3. Deployment Scripts (`contracts/ignition/modules/` or `contracts/scripts/`)

#### [NEW] `contracts/scripts/deploy.js`
- Script to deploy `EnergyToken` and `EnergyMarketplace`.
- Configures the EnergyToken to grant the oracle role to the deployer (which is the wallet matching the `PRIVATE_KEY` in your `.env`).

## Open Questions

> [!IMPORTANT]
> 1. For marketplace purchases, do you want consumers to pay in native **MATIC** (simplest), or should we mock a stablecoin (like USDC or a custom INR-pegged ERC20 token) for purchasing?
> 2. Are you ready to install Node/npm dependencies globally/locally to run Hardhat?

## Verification Plan
1. Compile the contracts (`npx hardhat compile`) to ensure there are no syntax errors.
2. Run local Hardhat tests (if we decide to write them) or deploy to a local Hardhat node.
3. Once approved, we will deploy them to the Polygon Amoy testnet and copy the deployed contract addresses back into your `backend/.env`.
