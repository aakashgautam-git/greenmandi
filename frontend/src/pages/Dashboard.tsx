import React from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Zap, BatteryCharging, TrendingUp, Hexagon } from 'lucide-react';

const mockChartData = [
  { time: '09:00', price: 0.12 },
  { time: '10:00', price: 0.15 },
  { time: '11:00', price: 0.11 },
  { time: '12:00', price: 0.18 },
  { time: '13:00', price: 0.22 },
  { time: '14:00', price: 0.20 },
  { time: '15:00', price: 0.25 },
  { time: '16:00', price: 0.31 },
];

const mockOrders = [
  { id: 1, type: 'sell', amount: '15.0', price: '0.22', color: 'text-red-500' },
  { id: 2, type: 'sell', amount: '8.5', price: '0.21', color: 'text-red-500' },
  { id: 3, type: 'sell', amount: '42.0', price: '0.20', color: 'text-red-500' },
  { id: 4, type: 'buy', amount: '12.0', price: '0.19', color: 'text-green-500' },
  { id: 5, type: 'buy', amount: '5.5', price: '0.18', color: 'text-green-500' },
  { id: 6, type: 'buy', amount: '18.2', price: '0.17', color: 'text-green-500' },
];

const Dashboard: React.FC = () => {
  return (
    <div className="w-full flex-grow flex flex-col gap-8 max-w-7xl mx-auto mt-6">
      
      {/* Top Banner Status */}
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h1 className="text-3xl font-Display font-bold text-[#1E293B]">Grid Status Overview</h1>
          <p className="text-gray-500 mt-1">Live peer-to-peer marketplace telemetry</p>
        </div>
        <div className="flex gap-4">
          <div className="stat-card py-3">
             <Hexagon className="w-5 h-5 text-purple-500" />
             <div>
               <div className="text-xs text-gray-500 font-medium">Node ID</div>
               <div className="font-semibold text-[#1E293B]">0x7F...4A21</div>
             </div>
          </div>
          <div className="stat-card py-3">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
             <div>
               <div className="text-xs text-gray-500 font-medium">Connection</div>
               <div className="font-semibold text-[#1E293B]">Synchronized</div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Interactive Chart Area */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 h-[500px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-400" /> 
                  Energy Price <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-semibold text-gray-600">USD/kWh</span>
                </h2>
                <div className="flex items-baseline gap-3 mt-3">
                  <span className="text-4xl font-Display font-bold text-[#1E293B]">$0.31</span>
                  <span className="text-sm font-semibold text-primary flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md">
                    <ArrowUpRight className="w-4 h-4" /> +12.4%
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

            <div className="flex-grow w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C853" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00C853" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: '600' }}
                    itemStyle={{ color: '#00C853' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#00C853" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Execution & Order Book Panels */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-lg text-[#1E293B] mb-5">Quick Trade</h3>
              <div className="flex rounded-lg p-1 bg-gray-50 border border-gray-200 mb-6">
                <button className="flex-1 py-2 text-sm font-semibold rounded shadow-sm bg-white text-[#1E293B] border border-gray-200">Buy Energy</button>
                <button className="flex-1 py-2 text-sm font-semibold rounded text-gray-500 hover:text-gray-700 transition-colors">Sell Energy</button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (USD)</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 text-[#1E293B] font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-right" defaultValue="0.31" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (kWh)</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 text-[#1E293B] font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-right" placeholder="0.00" />
                </div>
                
                <div className="flex justify-between items-center text-sm font-semibold pt-2">
                  <span className="text-gray-500">Total Transaction:</span>
                  <span className="text-[#1E293B] text-lg">$0.00</span>
                </div>
                
                <button className="w-full btn-primary py-3.5 mt-2 text-sm uppercase tracking-wide">
                  Execute Order
                </button>
              </div>
            </div>

            {/* Order Book Preview */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between mb-4">
                <span>Price (USD)</span>
                <span>Amount (kWh)</span>
              </div>
              <div className="space-y-3 text-sm font-medium">
                {mockOrders.slice(0,4).map((order) => (
                  <div key={order.id} className="flex justify-between cursor-pointer hover:bg-gray-100 p-1.5 rounded-lg -mx-1.5 transition-colors">
                    <span className={order.color}>${order.price}</span>
                    <span className="text-gray-700">{order.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
