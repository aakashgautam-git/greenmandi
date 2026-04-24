import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Zap, DollarSign, ShoppingCart, TrendingDown, Clock, Leaf, Coins, Minus, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const priceData = [
  { time: '09:00', price: 0.12 },
  { time: '10:00', price: 0.15 },
  { time: '11:00', price: 0.11 },
  { time: '12:00', price: 0.18 },
  { time: '13:00', price: 0.22 },
  { time: '14:00', price: 0.20 },
  { time: '15:00', price: 0.25 },
  { time: '16:00', price: 0.19 },
];

const consumptionData = [
  { day: 'Mon', tokens: 8 },
  { day: 'Tue', tokens: 12 },
  { day: 'Wed', tokens: 10 },
  { day: 'Thu', tokens: 15 },
  { day: 'Fri', tokens: 11 },
  { day: 'Sat', tokens: 7 },
  { day: 'Sun', tokens: 6 },
];

interface Listing {
  id: number;
  seller: string;
  tokens: number;
  priceSmall: number;  // per token for 1–5
  priceBulk: number;   // per token for 6+
  rating: number;
}

const initialListings: Listing[] = [
  { id: 1, seller: 'SunFarm Co.', tokens: 25, priceSmall: 0.24, priceBulk: 0.18, rating: 4.8 },
  { id: 2, seller: 'GreenRoof LLC', tokens: 12, priceSmall: 0.26, priceBulk: 0.20, rating: 4.6 },
  { id: 3, seller: 'EcoPanel Hub', tokens: 40, priceSmall: 0.22, priceBulk: 0.16, rating: 4.9 },
  { id: 4, seller: 'SolarPeak', tokens: 8, priceSmall: 0.28, priceBulk: 0.22, rating: 4.5 },
];

interface PurchaseRecord {
  id: number;
  seller: string;
  tokens: number;
  cost: string;
  time: string;
}

const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [buyAmounts, setBuyAmounts] = useState<Record<number, number>>({});
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([
    { id: 1, seller: 'SunFarm Co.', tokens: 3, cost: '$0.54', time: '2h ago' },
    { id: 2, seller: 'EcoPanel Hub', tokens: 5, cost: '$0.80', time: '5h ago' },
    { id: 3, seller: 'GreenRoof LLC', tokens: 2, cost: '$0.40', time: '1d ago' },
  ]);
  const [notification, setNotification] = useState<string | null>(null);

  const getBuyAmount = (id: number) => buyAmounts[id] || 1;

  const getActivePrice = (listing: Listing, qty: number) =>
    qty <= 5 ? listing.priceSmall : listing.priceBulk;

  const adjustAmount = (id: number, delta: number) => {
    const listing = listings.find(l => l.id === id);
    if (!listing) return;
    const current = getBuyAmount(id);
    const next = Math.max(1, Math.min(listing.tokens, current + delta));
    setBuyAmounts(prev => ({ ...prev, [id]: next }));
  };

  const handleBuy = (listing: Listing) => {
    const amount = getBuyAmount(listing.id);
    const price = getActivePrice(listing, amount);
    const cost = (amount * price).toFixed(2);

    // Add to purchase history
    const newPurchase: PurchaseRecord = {
      id: Date.now(),
      seller: listing.seller,
      tokens: amount,
      cost: `$${cost}`,
      time: 'Just now',
    };
    setPurchases(prev => [newPurchase, ...prev]);

    // Reduce tokens from listing (or remove if 0)
    setListings(prev =>
      prev
        .map(l => l.id === listing.id ? { ...l, tokens: l.tokens - amount } : l)
        .filter(l => l.tokens > 0)
    );

    // Reset buy amount for this listing
    setBuyAmounts(prev => {
      const next = { ...prev };
      delete next[listing.id];
      return next;
    });

    // Show notification
    setNotification(`✅ Purchased ${amount} token${amount > 1 ? 's' : ''} from ${listing.seller} for $${cost}`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="w-full flex-grow flex flex-col gap-8 max-w-7xl mx-auto mt-6">

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold animate-bounce">
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h1 className="text-3xl font-Display font-bold text-[#1E293B]">
            Welcome, {user?.name || 'Buyer'} ⚡
          </h1>
          <p className="text-gray-500 mt-1">Browse the marketplace and buy tokens from any seller</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 border border-sky-200 rounded-full">
          <ShoppingCart className="w-4 h-4 text-sky-600" />
          <span className="text-sm font-semibold text-sky-700">Buyer Account</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-sky-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Coins className="w-5 h-5 text-sky-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens Bought</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">328 tokens</div>
          <div className="flex items-center gap-1 text-xs font-semibold text-green-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +15.1% this month
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-indigo-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">$612.30</div>
          <div className="text-xs text-gray-500 mt-1">Across 42 purchases</div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Savings vs Grid</span>
          </div>
          <div className="text-2xl font-bold text-green-600">$187.40</div>
          <div className="flex items-center gap-1 text-xs font-semibold text-green-600 mt-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> 23% cheaper
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CO₂ Offset</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">148 kg</div>
          <div className="text-xs text-gray-500 mt-1">Clean energy contribution</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Price Trend */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-soft border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-blue-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-400" />
                Token Price Trend
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-semibold text-gray-600">USD/Token</span>
              </h2>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-3xl font-Display font-bold text-[#1E293B]">$0.19</span>
                <span className="text-sm font-semibold text-red-500 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md">
                  <ArrowDownRight className="w-3.5 h-3.5" /> -4.2%
                </span>
              </div>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
              {['1H', '1D', '1W', '1M'].map((tf) => (
                <button key={tf} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${tf === '1D' ? 'bg-white shadow-sm text-[#1E293B]' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="colorBuyerPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="price" stroke="#0EA5E9" strokeWidth={3} fillOpacity={1} fill="url(#colorBuyerPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Consumption */}
        <div className="lg:w-[380px] bg-white p-6 rounded-2xl shadow-soft border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
          <h2 className="text-lg font-bold text-[#1E293B] mb-2">Weekly Consumption</h2>
          <div className="text-2xl font-bold text-[#1E293B] mb-4">69 tokens</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consumptionData}>
                <defs>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="tokens" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConsumption)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Available Listings + Purchase History */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Available Listings — with partial buy */}
        <div className="flex-1 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-[#1E293B]">Available Tokens</h3>
              <p className="text-xs text-gray-400 mt-0.5">Choose any seller and pick how many tokens you want</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-sky-50 text-sky-700 rounded-full">{listings.length} sellers</span>
          </div>
          <div className="divide-y divide-gray-50">
            {listings.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">No listings available right now</div>
            )}
            {listings.map((listing) => {
              const qty = getBuyAmount(listing.id);
              const activePrice = getActivePrice(listing, qty);
              const isSmallTier = qty <= 5;
              const subtotal = (qty * activePrice).toFixed(2);
              return (
                <div key={listing.id} className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#1E293B]">{listing.seller}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <span>⭐ {listing.rating}</span>
                          <span className="text-gray-300">·</span>
                          <span className={isSmallTier ? 'text-amber-600 font-semibold' : 'text-gray-400 line-through'}>1–5: ${listing.priceSmall.toFixed(2)}</span>
                          <span className={!isSmallTier ? 'text-green-600 font-semibold' : 'text-gray-400'}>6+: ${listing.priceBulk.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-[#1E293B]">{listing.tokens} tokens</div>
                      <div className="text-xs text-gray-400">available</div>
                    </div>
                  </div>
                  {/* Quantity selector + buy */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2 border border-gray-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustAmount(listing.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={listing.tokens}
                        value={qty}
                        onChange={(e) => {
                          const v = Math.max(1, Math.min(listing.tokens, parseInt(e.target.value) || 1));
                          setBuyAmounts(prev => ({ ...prev, [listing.id]: v }));
                        }}
                        className="w-14 text-center bg-white border border-gray-200 rounded-lg py-1.5 text-sm font-bold text-[#1E293B] focus:outline-none focus:border-sky-400"
                      />
                      <button
                        onClick={() => adjustAmount(listing.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSmallTier
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isSmallTier ? '1–5 RATE' : '6+ BULK'}
                        </span>
                        <span className="text-xs text-gray-500">${activePrice.toFixed(2)}/token</span>
                      </div>
                      <span className="font-bold text-sm text-[#1E293B]">${subtotal}</span>
                    </div>
                    <button
                      onClick={() => handleBuy(listing)}
                      className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                    >
                      Buy {qty} token{qty > 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Purchase History */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#1E293B] flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" /> Purchase History
              </h3>
              <span className="text-xs font-semibold px-3 py-1 bg-gray-50 text-gray-600 rounded-full">{purchases.length} orders</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-700 font-bold text-xs">
                      {purchase.seller.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#1E293B]">{purchase.seller}</div>
                      <div className="text-xs text-gray-500">{purchase.tokens} token{purchase.tokens > 1 ? 's' : ''} · {purchase.time}</div>
                    </div>
                  </div>
                  <div className="font-bold text-sm text-sky-600">-{purchase.cost}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
