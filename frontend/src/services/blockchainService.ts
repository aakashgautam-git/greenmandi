/**
 * blockchainService.ts
 * Handles all MetaMask / ethers.js interactions with the deployed
 * EnergyToken (ERC-1155) and EnergyMarketplace contracts on Polygon Amoy.
 */
import { ethers } from "ethers";

// ─── Contract addresses on Polygon Amoy ────────────────────────────
// Update these after deployment. They are read from env or fall back to defaults.
const ENERGY_TOKEN_ADDRESS =
  (import.meta as any).env?.VITE_ENERGY_TOKEN_ADDRESS ??
  "0xB1F9F04120A85A9aBD34BEAcEDd02e838561db12";

const ENERGY_MARKETPLACE_ADDRESS =
  (import.meta as any).env?.VITE_ENERGY_MARKETPLACE_ADDRESS ??
  "0x1b57B778BdaD1FdcC54C761aCDAAe0BCfFF0D681";

// ─── Polygon Amoy chain parameters ─────────────────────────────────
const AMOY_CHAIN_ID = 80002;
const AMOY_CHAIN_HEX = "0x" + AMOY_CHAIN_ID.toString(16); // 0x13882

const AMOY_NETWORK_PARAMS = {
  chainId: AMOY_CHAIN_HEX,
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com"],
};

// ─── Minimal ABIs (only the functions we actually call) ────────────
const EnergyTokenABI = [
  // Read
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function currentTokenId() view returns (uint256)",
  "function tokenEnergyAmount(uint256 id) view returns (uint256)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  // Write
  "function confirmMint(address producer, uint256 amountInWh) returns (uint256)",
  "function setApprovalForAll(address operator, bool approved)",
  // Owner helpers
  "function owner() view returns (address)",
  "function oracleAddress() view returns (address)",
  // Events
  "event MintConfirmed(address indexed producer, uint256 indexed tokenId, uint256 amount)",
];

const EnergyMarketplaceABI = [
  // Read
  "function currentListingId() view returns (uint256)",
  "function listings(uint256) view returns (uint256 listingId, address seller, uint256 tokenId, uint256 price, bool active)",
  // Write
  "function listToken(uint256 tokenId, uint256 price)",
  "function buyToken(uint256 listingId) payable",
  "function cancelListing(uint256 listingId)",
  // Events
  "event TokenListed(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 price)",
  "event TokenPurchased(uint256 indexed listingId, address indexed buyer, uint256 indexed tokenId, uint256 price)",
];

// ─── Helpers ───────────────────────────────────────────────────────

function getProvider(): ethers.BrowserProvider {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask.");
  }
  return new ethers.BrowserProvider((window as any).ethereum);
}

async function getSigner(): Promise<ethers.Signer> {
  const provider = getProvider();
  return provider.getSigner();
}

function tokenContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ENERGY_TOKEN_ADDRESS, EnergyTokenABI, signerOrProvider);
}

function marketplaceContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ENERGY_MARKETPLACE_ADDRESS, EnergyMarketplaceABI, signerOrProvider);
}

// ─── Network guard ─────────────────────────────────────────────────

export async function ensureAmoyNetwork(): Promise<void> {
  const provider = getProvider();
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== AMOY_CHAIN_ID) {
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_CHAIN_HEX }],
      });
    } catch (switchErr: any) {
      // 4902 = chain not added yet
      if (switchErr.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [AMOY_NETWORK_PARAMS],
        });
      } else {
        throw new Error("Please switch to Polygon Amoy Testnet.");
      }
    }
  }
}

// ─── Wallet ────────────────────────────────────────────────────────

export async function connectWallet(): Promise<string> {
  const provider = getProvider();
  const accounts: string[] = await provider.send("eth_requestAccounts", []);
  if (!accounts.length) throw new Error("No accounts returned from MetaMask.");
  await ensureAmoyNetwork();
  return accounts[0];
}

export async function getCurrentAccount(): Promise<string | null> {
  try {
    const provider = getProvider();
    const accounts: string[] = await provider.send("eth_accounts", []);
    return accounts[0] ?? null;
  } catch {
    return null;
  }
}

// ─── Balances ──────────────────────────────────────────────────────

export async function getNativePOLBalance(address: string): Promise<string> {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

export async function getTokenBalance(address: string, tokenId: number): Promise<string> {
  const provider = getProvider();
  const contract = tokenContract(provider);
  const bal: bigint = await contract.balanceOf(address, tokenId);
  return bal.toString();
}

export async function getCurrentTokenId(): Promise<number> {
  const provider = getProvider();
  const contract = tokenContract(provider);
  const id: bigint = await contract.currentTokenId();
  return Number(id);
}

export async function getTokenEnergy(tokenId: number): Promise<string> {
  const provider = getProvider();
  const contract = tokenContract(provider);
  const wh: bigint = await contract.tokenEnergyAmount(tokenId);
  return wh.toString();
}

// ─── Minting (owner / oracle only) ─────────────────────────────────

export async function mintEnergyToken(
  producerAddress: string,
  amountInWh: number
): Promise<{ txHash: string; tokenId: number }> {
  await ensureAmoyNetwork();
  const signer = await getSigner();
  const contract = tokenContract(signer);

  const tx = await contract.confirmMint(producerAddress, amountInWh);
  const receipt = await tx.wait();

  // Parse MintConfirmed event to get the new tokenId
  const iface = new ethers.Interface(EnergyTokenABI);
  let newTokenId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed && parsed.name === "MintConfirmed") {
        newTokenId = Number(parsed.args.tokenId);
        break;
      }
    } catch {
      // skip logs from other contracts
    }
  }

  return { txHash: receipt.hash, tokenId: newTokenId };
}

// ─── Approval ──────────────────────────────────────────────────────

export async function isMarketplaceApproved(ownerAddress: string): Promise<boolean> {
  const provider = getProvider();
  const contract = tokenContract(provider);
  return contract.isApprovedForAll(ownerAddress, ENERGY_MARKETPLACE_ADDRESS);
}

export async function approveMarketplace(): Promise<string> {
  await ensureAmoyNetwork();
  const signer = await getSigner();
  const contract = tokenContract(signer);

  const tx = await contract.setApprovalForAll(ENERGY_MARKETPLACE_ADDRESS, true);
  const receipt = await tx.wait();
  return receipt.hash;
}

// ─── Listing ───────────────────────────────────────────────────────

export async function createListing(
  tokenId: number,
  priceInPOL: string
): Promise<{ txHash: string; listingId: number }> {
  await ensureAmoyNetwork();
  const signer = await getSigner();
  const contract = marketplaceContract(signer);

  const priceWei = ethers.parseEther(priceInPOL);
  const tx = await contract.listToken(tokenId, priceWei);
  const receipt = await tx.wait();

  // Parse TokenListed event
  const iface = new ethers.Interface(EnergyMarketplaceABI);
  let listingId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed && parsed.name === "TokenListed") {
        listingId = Number(parsed.args.listingId);
        break;
      }
    } catch {
      // skip
    }
  }

  return { txHash: receipt.hash, listingId };
}

// ─── Buying ────────────────────────────────────────────────────────

export async function buyToken(
  listingId: number
): Promise<string> {
  await ensureAmoyNetwork();
  const signer = await getSigner();
  const provider = getProvider();
  const contract = marketplaceContract(signer);

  // Read listing to know the exact price
  const readContract = marketplaceContract(provider);
  const listing = await readContract.listings(listingId);
  const price: bigint = listing.price;

  if (!listing.active) throw new Error("This listing is no longer active.");

  const tx = await contract.buyToken(listingId, { value: price });
  const receipt = await tx.wait();
  return receipt.hash;
}

// ─── Read listing ──────────────────────────────────────────────────

export interface ListingData {
  listingId: number;
  seller: string;
  tokenId: number;
  price: string;      // in POL
  priceWei: string;
  active: boolean;
}

export async function getListing(listingId: number): Promise<ListingData> {
  const provider = getProvider();
  const contract = marketplaceContract(provider);
  const l = await contract.listings(listingId);

  return {
    listingId: Number(l.listingId),
    seller: l.seller,
    tokenId: Number(l.tokenId),
    price: ethers.formatEther(l.price),
    priceWei: l.price.toString(),
    active: l.active,
  };
}

export async function getCurrentListingId(): Promise<number> {
  const provider = getProvider();
  const contract = marketplaceContract(provider);
  const id: bigint = await contract.currentListingId();
  return Number(id);
}

// ─── Utility ───────────────────────────────────────────────────────

export function explorerTxUrl(txHash: string): string {
  return `https://amoy.polygonscan.com/tx/${txHash}`;
}

export { ENERGY_TOKEN_ADDRESS, ENERGY_MARKETPLACE_ADDRESS };
