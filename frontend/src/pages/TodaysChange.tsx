import React, { useState } from 'react';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Zap, Clock, ArrowUpRight, ArrowDownRight, Sun, Moon, Sunrise, Sunset } from 'lucide-react';

const hourlyData = [
  { time: '00:00', rate: 0.08, label: '12 AM' },
  { time: '01:00', rate: 0.07, label: '1 AM' },
  { time: '02:00', rate: 0.06, label: '2 AM' },
  { time: '03:00', rate: 0.06, label: '3 AM' },
  { time: '04:00', rate: 0.07, label: '4 AM' },
  { time: '05:00', rate: 0.09, label: '5 AM' },
  { time: '06:00', rate: 0.12, label: '6 AM' },
  { time: '07:00', rate: 0.15, label: '7 AM' },
  { time: '08:00', rate: 0.18, label: '8 AM' },
  { time: '09:00', rate: 0.20, label: '9 AM' },
  { time: '10:00', rate: 0.22, label: '10 AM' },
  { time: '11:00', rate: 0.24, label: '11 AM' },
  { time: '12:00', rate: 0.26, label: '12 PM' },
  { time: '13:00', rate: 0.28, label: '1 PM' },
  { time: '14:00', rate: 0.27, label: '2 PM' },
  { time: '15:00', rate: 0.25, label: '3 PM' },
  { time: '16:00', rate: 0.23, label: '4 PM' },
  { time: '17:00', rate: 0.26, label: '5 PM' },
  { time: '18:00', rate: 0.30, label: '6 PM' },
  { time: '19:00', rate: 0.32, label: '7 PM' },
  { time: '20:00', rate: 0.28, label: '8 PM' },
  { time: '21:00', rate: 0.22, label: '9 PM' },
  { time: '22:00', rate: 0.15, label: '10 PM' },
  { time: '23:00', rate: 0.10, label: '11 PM' },
];

const currentHour = new Date().getHours();
const currentRate = hourlyData[currentHour]?.rate ?? 0.20;
const prevRate = hourlyData[currentHour > 0 ? currentHour - 1 : 23]?.rate ?? 0.20;
const dayHigh = Math.max(...hourlyData.map(d => d.rate));
const dayLow = Math.min(...hourlyData.map(d => d.rate));
const dayAvg = +(hourlyData.reduce((s, d) => s + d.rate, 0) / hourlyData.length).toFixed(3);
const changePercent = prevRate > 0 ? +(((currentRate - prevRate) / prevRate) * 100).toFixed(1) : 0;
const isUp = changePercent >= 0;

// Time-of-day periods
const periods = [
  { label: 'Off-Peak', time: '12 AM – 6 AM', icon: Moon, avg: '$0.07', change: -42, color: '#6366F1', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  { label: 'Morning Rise', time: '6 AM – 12 PM', icon: Sunrise, avg: '$0.19', change: +58, color: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-600' },
  { label: 'Peak Solar', time: '12 PM – 6 PM', icon: Sun, avg: '$0.26', change: +8, color: '#EF4444', bg: 'bg-red-50', text: 'text-red-600' },
  { label: 'Evening Demand', time: '6 PM – 12 AM', icon: Sunset, avg: '$0.23', change: -12, color: '#0EA5E9', bg: 'bg-sky-50', text: 'text-sky-600' },
];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const idx = hourlyData.findIndex(d => d.time === label);
  const prev = idx > 0 ? hourlyData[idx - 1].rate : val;
  const diff = +(((val - prev) / prev) * 100).toFixed(1);
  return (
    <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-xs text-gray-500 font-medium mb-1">{hourlyData[idx]?.label || label}</div>
      <div className="text-xl font-bold text-[#1E293B]">${val.toFixed(2)} <span className="text-xs font-medium text-gray-400">/token</span></div>
      <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {diff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {diff >= 0 ? '+' : ''}{diff}% from prev hour
      </div>
    </div>
  );
};

const TodaysChange: React.FC = () => {
  const [hoveredPeriod, setHoveredPeriod] = useState<number | null>(null);

  return (
    <div className="w-full flex-grow flex flex-col gap-8 max-w-7xl mx-auto mt-6">

      {/* Header */}
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h1 className="text-3xl font-Display font-bold text-[#1E293B]">Today's Change ⚡</h1>
          <p className="text-gray-500 mt-1">Real-time electricity rate fluctuations throughout the day</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-green-700">Live Market</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Rate</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">${currentRate.toFixed(2)}/token</div>
          <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
            {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {isUp ? '+' : ''}{changePercent}% vs last hour
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-orange-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Day High</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">${dayHigh.toFixed(2)}/token</div>
          <div className="text-xs text-gray-500 mt-1">Peak at 7:00 PM</div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Day Low</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">${dayLow.toFixed(2)}/token</div>
          <div className="text-xs text-gray-500 mt-1">Off-peak at 2–3 AM</div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-violet-500"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Day Average</span>
          </div>
          <div className="text-2xl font-bold text-[#1E293B]">${dayAvg.toFixed(3)}/token</div>
          <div className="text-xs text-gray-500 mt-1">Across 24 hours</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-amber-400 to-red-400"></div>

        <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1E293B] flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-400" />
              Hourly Rate Fluctuation
              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-semibold text-gray-600">USD/Token</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Electricity price at every hour today</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-gray-500">Below avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-red-400"></div>
              <span className="text-gray-500">Above avg</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
              <div className="w-3 h-[1px] bg-amber-500"></div>
              <span className="text-gray-500">Day avg: ${dayAvg.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C853" stopOpacity={0.25} />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="25%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#EF4444" />
                  <stop offset="75%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#cbd5e1"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                stroke="#cbd5e1"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val.toFixed(2)}`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={dayAvg}
                stroke="#F59E0B"
                strokeDasharray="6 4"
                strokeWidth={1.5}
              />
              {currentHour < 24 && (
                <ReferenceLine
                  x={hourlyData[currentHour]?.label}
                  stroke="#00C853"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{ value: 'Now', position: 'top', fill: '#00C853', fontSize: 11, fontWeight: 700 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="rate"
                stroke="url(#strokeGradient)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#rateGradient)"
                dot={false}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3, fill: '#00C853' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time-of-Day Breakdown */}
      <div>
        <h2 className="text-xl font-bold text-[#1E293B] mb-4">Time-of-Day Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {periods.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.label}
                className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                onMouseEnter={() => setHoveredPeriod(i)}
                onMouseLeave={() => setHoveredPeriod(null)}
              >
                <div
                  className="absolute top-0 left-0 h-1 transition-all duration-500"
                  style={{
                    width: hoveredPeriod === i ? '100%' : '30%',
                    background: p.color,
                  }}
                ></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${p.text}`} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1E293B]">{p.label}</div>
                    <div className="text-xs text-gray-400">{p.time}</div>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Avg Rate</div>
                    <div className="text-xl font-bold text-[#1E293B]">{p.avg}<span className="text-xs font-medium text-gray-400">/token</span></div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${p.change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {p.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {p.change >= 0 ? '+' : ''}{p.change}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Rate Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-[#1E293B]">Hourly Breakdown</h3>
          <span className="text-xs font-semibold px-3 py-1 bg-gray-50 text-gray-600 rounded-full">24 data points</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {hourlyData.map((d, i) => {
            const prev = i > 0 ? hourlyData[i - 1].rate : d.rate;
            const diff = prev > 0 ? +(((d.rate - prev) / prev) * 100).toFixed(1) : 0;
            const isCurrent = i === currentHour;
            return (
              <div
                key={d.time}
                className={`flex flex-col items-center justify-center py-4 px-3 border-b border-r border-gray-50 transition-colors ${
                  isCurrent ? 'bg-green-50 ring-2 ring-green-200 ring-inset' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${isCurrent ? 'text-green-700' : 'text-gray-400'}`}>
                  {d.label} {isCurrent && '●'}
                </div>
                <div className={`text-lg font-bold ${isCurrent ? 'text-green-700' : 'text-[#1E293B]'}`}>
                  ${d.rate.toFixed(2)}
                </div>
                {i > 0 && (
                  <div className={`text-[10px] font-semibold mt-0.5 ${diff >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TodaysChange;
