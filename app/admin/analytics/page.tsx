"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  IndianRupee,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search
} from "lucide-react";
import { fetchOrders, OrderRecord } from "../../lib/orders";
import { readApiJson } from "../../lib/api/client";
import { getVisitorCount } from "../../lib/analytics";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [visitors, setVisitors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  async function loadData() {
    setLoading(true);
    try {
      const [ordersData, visitorCount] = await Promise.all([
        fetchOrders(),
        getVisitorCount()
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setVisitors(visitorCount);
    } catch (error) {
      console.error("Analytics load failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const { stats, filteredOrders } = useMemo(() => {
    const now = new Date();
    const startTime = new Date();
    const prevStartTime = new Date();

    let days = 7;
    if (timeRange === "24h") days = 1;
    else if (timeRange === "7d") days = 7;
    else if (timeRange === "30d") days = 30;
    else if (timeRange === "1y") days = 365;

    startTime.setDate(now.getDate() - days);
    prevStartTime.setDate(startTime.getDate() - days);

    const currentPeriodOrders = orders.filter(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);
      return d && d >= startTime;
    });

    const prevPeriodOrders = orders.filter(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);
      return d && d >= prevStartTime && d < startTime;
    });

    const totalRevenue = currentPeriodOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = currentPeriodOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const prevRevenue = prevPeriodOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const prevOrders = prevPeriodOrders.length;
    const prevAOV = prevOrders > 0 ? prevRevenue / prevOrders : 0;

    // Calculate conversion rate
    const conversionRate = visitors > 0 ? (totalOrders / visitors) * 100 : 0;

    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const orderGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;
    const aovGrowth = prevAOV > 0 ? ((avgOrderValue - prevAOV) / prevAOV) * 100 : 0;

    return {
      filteredOrders: currentPeriodOrders,
      stats: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        conversionRate: Number(conversionRate.toFixed(2)),
        revenueGrowth: Number(revenueGrowth.toFixed(1)),
        orderGrowth: Number(orderGrowth.toFixed(1)),
        aovGrowth: Number(aovGrowth.toFixed(1)),
        customerGrowth: 0
      }
    };
  }, [orders, visitors, timeRange]);

  // Generate simple bar chart data for revenue by day
  const dailyRevenue = useMemo(() => {
    // Adjust chart range based on selection
    let days = 7;
    if (timeRange === "24h") days = 1;
    else if (timeRange === "7d") days = 7;
    else if (timeRange === "30d") days = 30;
    else if (timeRange === "1y") days = 12; // Use months for 1y

    const isYearly = timeRange === "1y";

    const labels = [...Array(days)].map((_, i) => {
      const d = new Date();
      if (isYearly) {
        d.setMonth(d.getMonth() - (days - 1 - i));
        return d.toLocaleDateString('en-IN', { month: 'short' });
      } else {
        d.setDate(d.getDate() - (days - 1 - i));
        return d.toLocaleDateString('en-IN', { weekday: 'short' });
      }
    });

    const dailyMap: Record<string, number> = {};
    labels.forEach(label => dailyMap[label] = 0);

    filteredOrders.forEach(order => {
      if (!order.createdAt) return;
      const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const label = isYearly
        ? date.toLocaleDateString('en-IN', { month: 'short' })
        : date.toLocaleDateString('en-IN', { weekday: 'short' });

      if (dailyMap[label] !== undefined) {
        dailyMap[label] += order.total || 0;
      }
    });

    const maxVal = Math.max(...Object.values(dailyMap), 1000);

    return labels.map((day) => ({
      day,
      value: dailyMap[day],
      height: (dailyMap[day] / (maxVal * 1.2)) * 100
    }));
  }, [filteredOrders, timeRange]);

  const categoryStats = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.cartItems?.forEach(item => {
        const cat = (item as any).category || "Other";
        catMap[cat] = (catMap[cat] || 0) + (item.price * item.quantity);
      });
    });

    const sorted = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const total = Object.values(catMap).reduce((a, b) => a + b, 0);

    return sorted.map(([label, val]) => ({
      label,
      value: val,
      percentage: total > 0 ? (val / total) * 100 : 0
    }));
  }, [filteredOrders]);

  const distribution = useMemo(() => {
    let prepaid = 0;
    let cod = 0;
    filteredOrders.forEach(o => {
      if (String(o.paymentMethod).toLowerCase() === 'cod') cod++;
      else prepaid++;
    });
    const total = filteredOrders.length || 1;
    return {
      prepaid: Math.round((prepaid / total) * 100),
      cod: Math.round((cod / total) * 100)
    };
  }, [filteredOrders]);

  const regionStats = useMemo(() => {
    const cityMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const city = o.shipping?.city || "Unknown";
      cityMap[city] = (cityMap[city] || 0) + (o.total || 0);
    });

    const sorted = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const total = Object.values(cityMap).reduce((a, b) => a + b, 0);

    return sorted.map(([name, val]) => ({
      name,
      amount: val,
      percentage: total > 0 ? (val / total) * 100 : 0
    }));
  }, [filteredOrders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time performance metrics and sales insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {['24h', '7d', '30d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  timeRange === range
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsStatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          trend={stats.revenueGrowth}
          icon={IndianRupee}
          color="blue"
        />
        <AnalyticsStatCard
          label="Orders"
          value={stats.totalOrders}
          trend={stats.orderGrowth}
          icon={ShoppingBag}
          color="indigo"
        />
        <AnalyticsStatCard
          label="Avg. Order Value"
          value={formatCurrency(stats.avgOrderValue)}
          trend={stats.aovGrowth}
          icon={TrendingUp}
          color="emerald"
        />
        <AnalyticsStatCard
          label="Conversion Rate"
          value={stats.conversionRate > 0 ? `${stats.conversionRate}%` : "0%"}
          trend={0}
          icon={Users}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Revenue ({timeRange === '24h' ? 'Last 24 Hours' : `Last ${timeRange}`})</h2>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">Sales performance based on settled orders</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-900"></div>
                <span className="text-slate-600">Actual Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                <span className="text-slate-400">Target</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {dailyRevenue.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="w-full relative">
                  <div
                    className="w-full bg-slate-100 rounded-t-xl group-hover:bg-slate-200 transition-colors relative overflow-hidden"
                    style={{ height: '200px' }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-xl transition-all duration-1000 ease-out"
                      style={{ height: `${item.height}%` }}
                    >
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/20 px-1.5 py-0.5 rounded text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatCurrency(item.value)}
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products/Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Top Categories</h2>
          <div className="space-y-6">
            {categoryStats.length > 0 ? (
              categoryStats.map((cat, i) => (
                <CategoryProgress
                  key={i}
                  label={cat.label}
                  percentage={cat.percentage}
                  color={["bg-blue-500", "bg-indigo-500", "bg-amber-500", "bg-emerald-500"][i % 4]}
                  value={formatCurrency(cat.value)}
                />
              ))
            ) : (
              <p className="text-slate-400 text-sm py-8 text-center">No category data available</p>
            )}
          </div>

          {categoryStats.length > 0 && (
            <div className="mt-10 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-900">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Highest Category</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {categoryStats[0].label} is your top performing category.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Order Distribution */}
         <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Order Distribution</h2>
            <div className="flex items-center gap-8">
              <div className="relative h-32 w-32 flex-shrink-0">
                 {/* Donut Chart Placeholder */}
                 <div className="absolute inset-0 rounded-full border-[12px] border-slate-100"></div>
                 <div
                    className="absolute inset-0 rounded-full border-[12px] border-slate-900 border-t-transparent border-r-transparent transition-all duration-1000"
                    style={{ transform: `rotate(${45 + (distribution.prepaid * 3.6)}deg)` }}
                 ></div>
                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-slate-900">{distribution.prepaid}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Prepaid</span>
                 </div>
              </div>
              <div className="flex-1 space-y-3">
                 <DistributionItem label="Prepaid (Online)" value={`${distribution.prepaid}%`} color="bg-slate-900" />
                 <DistributionItem label="Cash on Delivery" value={`${distribution.cod}%`} color="bg-slate-300" />
              </div>
            </div>
         </div>

         {/* Sales by Region */}
         <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
              Top Regions
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">LIVE DATA</span>
            </h2>
            <div className="space-y-4">
              {regionStats.length > 0 ? (
                regionStats.map((region, i) => (
                  <RegionItem key={i} name={region.name} amount={formatCurrency(region.amount)} percentage={region.percentage} />
                ))
              ) : (
                <p className="text-slate-400 text-sm py-8 text-center">No region data available</p>
              )}
            </div>
         </div>
      </div>
    </div>
  );
}

function AnalyticsStatCard({ label, value, trend, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  const isPositive = trend > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  );
}

function CategoryProgress({ label, percentage, color, value }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function DistributionItem({ label, value, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${color}`}></div>
        <span className="text-[10px] font-bold text-slate-600">{label}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-900">{value}</span>
    </div>
  );
}

function RegionItem({ name, amount, percentage }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-700">{name}</span>
          <span className="text-xs font-bold text-slate-900">{amount}</span>
        </div>
        <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 group-hover:bg-indigo-600 transition-all duration-700"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
