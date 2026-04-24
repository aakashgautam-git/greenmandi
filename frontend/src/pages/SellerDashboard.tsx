import React from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ArrowUpRight, Zap, DollarSign, BarChart3, Package, Clock, Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const productionData = [
  { time: '06:00', tokens: 1 },
  { time: '08:00', tokens: 4 },
  { time: '10:00', tokens: 9 },
  { time: '12:00', tokens: 12 },
  { time: '14:00', tokens: 11 },
  { time: '16:00', tokens: 7 },
  { time: '18:00', tokens: 3 },
  { time: '20:00', tokens: 1 },
];

const revenueData = [
  { day: 'Mon', revenue: 12.5 },
  { day: 'Tue', revenue: 18.2 },
  { day: 'Wed', revenue: 14.8 },
  { day: 'Thu', revenue: 22.1 },
  { day: 'Fri', revenue: 19.6 },
  { day: 'Sat', revenue: 25.3 },
  { day: 'Sun', revenue: 21.0 },
];

const activeListings = [
  { id: 1, amount: '15 tokens', priceSmall: '$0.28/token', priceBulk: '$0.22/token', status: 'Active', time: '2h ago' },
  { id: 2, amount: '8 tokens', priceSmall: '$0.30/token', priceBulk: '$0.24/token', status: 'Active', time: '4h ago' },
  { id: 3, amount: '22 tokens', priceSmall: '$0.26/token', priceBulk: '$0.20/token', status: 'Pending', time: '6h ago' },
  { id: 4, amount: '5 tokens', priceSmall: '$0.32/token', priceBulk: '$0.25/token', status: 'Active', time: '8h ago' },
];

const recentSales = [
  { id: 1, buyer: 'Alice M.', amount: '10 tokens', earned: '$2.20', time: '1h ago' },
  { id: 2, buyer: 'Bob K.', amount: '6 tokens', earned: '$1.44', time: '3h ago' },
  { id: 3, buyer: 'Carol S.', amount: '18 tokens', earned: '$3.60', time: '5h ago' },
];

const SellerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="w-full flex-grow flex flex-col gap-8 max-w-7xl mx-auto mt-6">

      {/* Header */}
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h1 className="text-3xl font-Display font-bold text-[#1E293B]">
            Welcome, {user?.name || 'Seller'} ☀️
          </h1>
          <p className="text-gray-500 mt-1">Manage your token production and sales</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
          <Zap className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">Seller Account</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">$1,284.50</div>
          <div className="flex items-center gap-1 text-xs font-semibold text-green-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +18.2% this month
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens Sold</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">542 tokens</div>
          <div className="flex items-center gap-1 text-xs font-semibold text-green-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% this month
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Listings</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">4</div>
          <div className="text-xs text-gray-500 mt-1">3 active · 1 pending</div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Price</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">$0.228</div>
          <div className="text-xs text-gray-500 mt-1">per token average</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Production Chart */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-soft border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                Today's Production
              </h2>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-3xl font-Display font-bold text-[#1E293B]">48 tokens</span>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +8.2%
                </span>
              </div>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionData}>
                <defs>
                  <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="tokens" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorProduction)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="lg:w-[380px] bg-white p-6 rounded-2xl shadow-soft border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
          <h2 className="text-lg font-bold text-[#1E293B] mb-2">Weekly Revenue</h2>
          <div className="text-2xl font-bold text-[#1E293B] mb-4">$133.50</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C853" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00C853" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 11}} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#00C853" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Listings + Quick List + Recent Sales */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Active Listings Table */}
        <div className="flex-1 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-[#1E293B]">Active Listings</h3>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full">{activeListings.length} listings</span>
          </div>
          <div className="divide-y divide-gray-50">
            {activeListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#1E293B]">{listing.amount}</div>
                    <div className="text-xs text-gray-500">1–5: {listing.priceSmall}</div>
                    <div className="text-xs text-gray-500">6+: {listing.priceBulk}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mt-0.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${listing.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {listing.status}
                    </span>
                    <span className="text-xs text-gray-400">{listing.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick List + Recent Sales */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          {/* Quick List Form */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-lg text-[#1E293B] mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" /> New Listing
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-800">!</span>
                    Tiered Pricing
                  </div>
                  <p className="text-[11px] text-amber-600 leading-relaxed">Set a higher per-token rate for small orders (1–5 tokens) and a lower bulk rate for 6+ tokens.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price for 1–5 Tokens (USD/Token)</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 text-[#1E293B] font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-right" defaultValue="0.28" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price for 6+ Tokens (USD/Token)</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 text-[#1E293B] font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-right" defaultValue="0.22" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (Tokens)</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 text-[#1E293B] font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-right" placeholder="0" />
                </div>
                <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wide transition-all shadow-md hover:shadow-lg">
                  List Tokens for Sale
                </button>
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-lg text-[#1E293B] flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" /> Recent Sales
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-700 font-bold text-xs">
                      {sale.buyer.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#1E293B]">{sale.buyer}</div>
                      <div className="text-xs text-gray-500">{sale.amount} · {sale.time}</div>
                    </div>
                  </div>
                  <div className="font-bold text-sm text-green-600">+{sale.earned}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
