import React, { useState, useCallback, useEffect } from "react";
import {
  connectWallet,
  getNativePOLBalance,
  getTokenBalance,
  getCurrentTokenId,
  getTokenEnergy,
  mintEnergyToken,
  isMarketplaceApproved,
  approveMarketplace,
  createListing,
  buyToken,
  getListing,
  explorerTxUrl,
  ENERGY_TOKEN_ADDRESS,
  ENERGY_MARKETPLACE_ADDRESS,
  type ListingData,
} from "../services/blockchainService";
import {
  Wallet,
  Zap,
  ShieldCheck,
  Tag,
  ShoppingCart,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Copy,
  RefreshCw,
  Info,
} from "lucide-react";

// ─── Tiny helpers ──────────────────────────────────────────────────

function shortenAddr(a: string) {
  return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
}

function StatusBadge({ status }: { status: "idle" | "loading" | "success" | "error" }) {
  if (status === "loading")
    return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
  if (status === "success")
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === "error")
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  return null;
}

// ─── Main Component ────────────────────────────────────────────────

const TransactionDemo: React.FC = () => {
  // Seller state
  const [sellerAddr, setSellerAddr] = useState("");
  const [sellerPOL, setSellerPOL] = useState("—");
  const [sellerTokenId, setSellerTokenId] = useState<number | null>(null);
  const [sellerTokenBal, setSellerTokenBal] = useState("—");
  const [sellerEnergy, setSellerEnergy] = useState("—");
  const [mintAmountWh, setMintAmountWh] = useState("5000");
  const [listPrice, setListPrice] = useState("0.01");
  const [sellerApproved, setSellerApproved] = useState(false);
  const [lastListingId, setLastListingId] = useState<number | null>(null);

  // Buyer state
  const [buyerAddr, setBuyerAddr] = useState("");
  const [buyerPOL, setBuyerPOL] = useState("—");
  const [buyerTokenBal, setBuyerTokenBal] = useState("—");
  const [buyListingId, setBuyListingId] = useState("");
  const [listingPreview, setListingPreview] = useState<ListingData | null>(null);

  // Shared
  const [txHash, setTxHash] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [stepStatus, setStepStatus] = useState<Record<string, "idle" | "loading" | "success" | "error">>({});
  const [stepMsg, setStepMsg] = useState<Record<string, string>>({});
  const [successBanner, setSuccessBanner] = useState("");

  // Warnings
  const sameWallet = sellerAddr && buyerAddr && sellerAddr.toLowerCase() === buyerAddr.toLowerCase();

  // ── step helper ──
  const runStep = useCallback(
    async (key: string, fn: () => Promise<void>) => {
      setGlobalError("");
      setStepStatus((s) => ({ ...s, [key]: "loading" }));
      setStepMsg((s) => ({ ...s, [key]: "" }));
      try {
        await fn();
        setStepStatus((s) => ({ ...s, [key]: "success" }));
      } catch (err: any) {
        const msg = err?.reason || err?.message || String(err);
        setStepStatus((s) => ({ ...s, [key]: "error" }));
        setStepMsg((s) => ({ ...s, [key]: msg }));
        setGlobalError(msg);
      }
    },
    []
  );

  // ── Refresh balances ──
  const refreshSeller = useCallback(async () => {
    if (!sellerAddr) return;
    try {
      setSellerPOL(parseFloat(await getNativePOLBalance(sellerAddr)).toFixed(4));
      const latestId = await getCurrentTokenId();
      if (latestId > 0) {
        setSellerTokenId(latestId);
        setSellerTokenBal(await getTokenBalance(sellerAddr, latestId));
        setSellerEnergy(await getTokenEnergy(latestId));
        setSellerApproved(await isMarketplaceApproved(sellerAddr));
      }
    } catch {
      /* silent */
    }
  }, [sellerAddr]);

  const refreshBuyer = useCallback(async () => {
    if (!buyerAddr) return;
    try {
      setBuyerPOL(parseFloat(await getNativePOLBalance(buyerAddr)).toFixed(4));
      if (sellerTokenId) {
        setBuyerTokenBal(await getTokenBalance(buyerAddr, sellerTokenId));
      }
    } catch {
      /* silent */
    }
  }, [buyerAddr, sellerTokenId]);

  useEffect(() => { refreshSeller(); }, [refreshSeller]);
  useEffect(() => { refreshBuyer(); }, [refreshBuyer]);

  // Auto-load listing preview
  useEffect(() => {
    if (!buyListingId) { setListingPreview(null); return; }
    const id = parseInt(buyListingId);
    if (isNaN(id) || id <= 0) { setListingPreview(null); return; }
    getListing(id).then(setListingPreview).catch(() => setListingPreview(null));
  }, [buyListingId]);

  // auto-fill listing id for buyer
  useEffect(() => {
    if (lastListingId) setBuyListingId(String(lastListingId));
  }, [lastListingId]);

  // ── Actions ──
  const handleConnectSeller = () =>
    runStep("connectSeller", async () => {
      const addr = await connectWallet();
      setSellerAddr(addr);
    });

  const handleConnectBuyer = () =>
    runStep("connectBuyer", async () => {
      const addr = await connectWallet();
      setBuyerAddr(addr);
    });

  const handleMint = () =>
    runStep("mint", async () => {
      const wh = parseInt(mintAmountWh);
      if (isNaN(wh) || wh <= 0) throw new Error("Enter a valid Wh amount.");
      const result = await mintEnergyToken(sellerAddr, wh);
      setSellerTokenId(result.tokenId);
      setStepMsg((s) => ({ ...s, mint: `Minted token #${result.tokenId}` }));
      await refreshSeller();
    });

  const handleApprove = () =>
    runStep("approve", async () => {
      await approveMarketplace();
      setSellerApproved(true);
      setStepMsg((s) => ({ ...s, approve: "Marketplace approved ✓" }));
    });

  const handleCreateListing = () =>
    runStep("list", async () => {
      if (!sellerTokenId) throw new Error("No token minted yet.");
      const result = await createListing(sellerTokenId, listPrice);
      setLastListingId(result.listingId);
      setStepMsg((s) => ({ ...s, list: `Listing #${result.listingId} created` }));
      await refreshSeller();
    });

  const handleBuy = () =>
    runStep("buy", async () => {
      const id = parseInt(buyListingId);
      if (isNaN(id) || id <= 0) throw new Error("Enter a valid listing ID.");
      const hash = await buyToken(id);
      setTxHash(hash);
      setSuccessBanner("Purchase complete!");
      await refreshBuyer();
      await refreshSeller();
      // refresh listing preview
      getListing(id).then(setListingPreview).catch(() => {});
    });

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1E293B]">⚡ Blockchain Transaction Demo</h1>
        <p className="text-gray-500 mt-1.5 text-sm">
          End-to-end buyer-to-seller payment flow on <span className="font-semibold text-purple-600">Polygon Amoy Testnet</span>
        </p>
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md font-mono text-gray-600">
            Token: {shortenAddr(ENERGY_TOKEN_ADDRESS)}
            <button onClick={() => navigator.clipboard.writeText(ENERGY_TOKEN_ADDRESS)}><Copy className="w-3 h-3" /></button>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md font-mono text-gray-600">
            Marketplace: {shortenAddr(ENERGY_MARKETPLACE_ADDRESS)}
            <button onClick={() => navigator.clipboard.writeText(ENERGY_MARKETPLACE_ADDRESS)}><Copy className="w-3 h-3" /></button>
          </span>
        </div>
      </div>

      {/* Same-wallet warning */}
      {sameWallet && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span><strong>Warning:</strong> Seller and Buyer are the same wallet. Switch accounts in MetaMask for a realistic demo.</span>
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ─── SELLER PANEL ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-200/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-lg text-[#1E293B]">Seller Panel</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Connect */}
            <div>
              {sellerAddr ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="font-mono font-semibold text-green-800">{shortenAddr(sellerAddr)}</span>
                  </div>
                  <button onClick={refreshSeller} className="text-green-600 hover:text-green-800"><RefreshCw className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={handleConnectSeller} disabled={stepStatus.connectSeller === "loading"} className="w-full btn-primary flex items-center justify-center gap-2 py-3">
                  <StatusBadge status={stepStatus.connectSeller || "idle"} />
                  <Wallet className="w-4 h-4" /> Connect Seller Wallet
                </button>
              )}
            </div>

            {sellerAddr && (
              <>
                {/* Balances */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">POL Balance</div>
                    <div className="font-bold text-lg text-[#1E293B]">{sellerPOL} <span className="text-xs text-gray-400">POL</span></div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Energy Token</div>
                    <div className="font-bold text-lg text-[#1E293B]">
                      {sellerTokenBal} {sellerTokenId ? <span className="text-xs text-gray-400">#{sellerTokenId}</span> : ""}
                    </div>
                    {sellerEnergy !== "—" && <div className="text-xs text-gray-500 mt-0.5">{sellerEnergy} Wh</div>}
                  </div>
                </div>

                {/* Step 1 — Mint */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Step 1: Mint Energy Tokens
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={mintAmountWh}
                      onChange={(e) => setMintAmountWh(e.target.value)}
                      placeholder="Energy in Wh"
                      className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleMint}
                      disabled={stepStatus.mint === "loading"}
                      className="btn-primary py-2.5 px-5 text-sm flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <StatusBadge status={stepStatus.mint || "idle"} />
                      Mint
                    </button>
                  </div>
                  {stepMsg.mint && <p className={`text-xs ${stepStatus.mint === "error" ? "text-red-500" : "text-green-600"}`}>{stepMsg.mint}</p>}
                </div>

                {/* Step 2 — Approve */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Step 2: Approve Marketplace
                  </label>
                  {sellerApproved ? (
                    <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Marketplace is approved
                    </div>
                  ) : (
                    <button
                      onClick={handleApprove}
                      disabled={stepStatus.approve === "loading"}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <StatusBadge status={stepStatus.approve || "idle"} />
                      Approve Marketplace Contract
                    </button>
                  )}
                  {stepMsg.approve && <p className={`text-xs ${stepStatus.approve === "error" ? "text-red-500" : "text-green-600"}`}>{stepMsg.approve}</p>}
                </div>

                {/* Step 3 — Create Listing */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Step 3: List Token for Sale
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      placeholder="Price in POL"
                      className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleCreateListing}
                      disabled={stepStatus.list === "loading" || !sellerApproved}
                      className="btn-primary py-2.5 px-5 text-sm flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                    >
                      <StatusBadge status={stepStatus.list || "idle"} />
                      List
                    </button>
                  </div>
                  {stepMsg.list && <p className={`text-xs ${stepStatus.list === "error" ? "text-red-500" : "text-green-600"}`}>{stepMsg.list}</p>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── BUYER PANEL ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-sky-50 to-sky-100/50 border-b border-sky-200/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-lg text-[#1E293B]">Buyer Panel</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Connect */}
            <div>
              {buyerAddr ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="font-mono font-semibold text-green-800">{shortenAddr(buyerAddr)}</span>
                  </div>
                  <button onClick={refreshBuyer} className="text-green-600 hover:text-green-800"><RefreshCw className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={handleConnectBuyer} disabled={stepStatus.connectBuyer === "loading"} className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <StatusBadge status={stepStatus.connectBuyer || "idle"} />
                  <Wallet className="w-4 h-4" /> Connect Buyer Wallet
                </button>
              )}
            </div>

            {buyerAddr && (
              <>
                {/* Balances */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">POL Balance</div>
                    <div className="font-bold text-lg text-[#1E293B]">{buyerPOL} <span className="text-xs text-gray-400">POL</span></div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Energy Token</div>
                    <div className="font-bold text-lg text-[#1E293B]">{buyerTokenBal}</div>
                  </div>
                </div>

                <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Switch your MetaMask to a <strong>different account</strong> from the seller, then click "Connect Buyer Wallet".</span>
                </div>

                {/* Listing ID */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Listing ID</label>
                  <input
                    type="number"
                    value={buyListingId}
                    onChange={(e) => setBuyListingId(e.target.value)}
                    placeholder="Enter listing ID"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  />
                </div>

                {/* Listing Preview */}
                {listingPreview && (
                  <div className={`p-4 rounded-xl border ${listingPreview.active ? "bg-green-50 border-green-200" : "bg-gray-100 border-gray-200 opacity-60"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Listing #{listingPreview.listingId}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${listingPreview.active ? "bg-green-200 text-green-800" : "bg-gray-300 text-gray-600"}`}>
                        {listingPreview.active ? "Active" : "Sold / Cancelled"}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>Seller: <span className="font-mono text-xs">{shortenAddr(listingPreview.seller)}</span></div>
                      <div>Token ID: <span className="font-semibold">#{listingPreview.tokenId}</span></div>
                      <div>Price: <span className="font-bold text-lg text-[#1E293B]">{listingPreview.price} POL</span></div>
                    </div>
                  </div>
                )}

                {/* Buy Button */}
                <button
                  onClick={handleBuy}
                  disabled={stepStatus.buy === "loading" || !listingPreview?.active}
                  className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <StatusBadge status={stepStatus.buy || "idle"} />
                  <ShoppingCart className="w-4 h-4" />
                  Buy Tokens — Pay {listingPreview?.active ? `${listingPreview.price} POL` : "…"}
                </button>
                {stepMsg.buy && <p className={`text-xs ${stepStatus.buy === "error" ? "text-red-500" : "text-green-600"}`}>{stepMsg.buy}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── SUCCESS RESULT CARD ────────────────────────────────── */}
      {txHash && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 space-y-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-green-800">{successBanner || "Transaction Confirmed!"}</h3>
              <p className="text-sm text-green-600">Transaction confirmed on Polygon Amoy</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-white/80 rounded-xl border border-green-100">
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="font-semibold text-green-700">✅ Payment sent from buyer to seller using test POL</div>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-green-100">
              <div className="text-xs text-gray-500 mb-1">Token Transfer</div>
              <div className="font-semibold text-green-700">✅ Energy tokens transferred to buyer</div>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-green-100">
              <div className="text-xs text-gray-500 mb-1">Network</div>
              <div className="font-semibold text-green-700">✅ Transaction confirmed on Polygon Amoy</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-white/80 rounded-xl border border-green-100">
            <span className="text-xs text-gray-500">Tx Hash:</span>
            <span className="font-mono text-xs text-[#1E293B] truncate flex-1">{txHash}</span>
            <button onClick={() => navigator.clipboard.writeText(txHash)} className="text-gray-400 hover:text-gray-600"><Copy className="w-4 h-4" /></button>
            <a href={explorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View on Explorer <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionDemo;
