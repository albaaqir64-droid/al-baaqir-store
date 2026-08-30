"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  IndianRupee,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";
import { fetchOrders, OrderRecord } from "../lib/orders";
import { readApiJson } from "../lib/api/client";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Dashboard() {
  const [productCount, setProductCount] = useState(0);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, order) => sum + (order.total ?? 0), 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    const packed = orders.filter((o) => o.status === "packed").length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const returned = orders.filter((o) => o.status === "returned").length;

    // Time-based calculations
    const now = new Date();
    const today = now.toLocaleDateString();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const prevSevenDaysAgo = new Date();
    prevSevenDaysAgo.setDate(now.getDate() - 14);

    const thisWeekOrders = orders.filter(o => {
      const date = o.createdAt?.toDate ? new Date(o.createdAt.toDate()) : new Date(o.createdAt);
      return date >= sevenDaysAgo;
    });

    const lastWeekOrders = orders.filter(o => {
      const date = o.createdAt?.toDate ? new Date(o.createdAt.toDate()) : new Date(o.createdAt);
      return date >= prevSevenDaysAgo && date < sevenDaysAgo;
    });

    const thisWeekSales = thisWeekOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const lastWeekSales = lastWeekOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

    // Growth Calculation
    const salesGrowth = lastWeekSales === 0 ? 100 : (((thisWeekSales - lastWeekSales) / lastWeekSales) * 100).toFixed(1);
    const orderGrowth = lastWeekOrders.length === 0 ? 100 : (((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100).toFixed(1);

    const todayOrders = orders.filter(o => {
      const date = o.createdAt?.toDate ? new Date(o.createdAt.toDate()) : new Date(o.createdAt);
      return date.toLocaleDateString() === today;
    });
    const todaySales = todayOrders.reduce((sum, order) => sum + (order.total ?? 0), 0);

    return {
      totalSales,
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      todaySales,
      pending,
      packed,
      shipped,
      delivered,
      cancelled,
      returned,
      salesGrowth: Number(salesGrowth),
      orderGrowth: Number(orderGrowth),
      shiprocketFailures: orders.filter(o => o.shiprocketStatus === "FAILED").length
    };
  }, [orders]);

  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, ordersData] = await Promise.all([
        fetch("/api/products"),
        fetchOrders()
      ]);
      const prodParsed = await readApiJson<unknown[]>(prodRes);
      setProductCount(prodParsed.ok && Array.isArray(prodParsed.data) ? prodParsed.data.length : 0);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error("Dashboard load failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, Md Munna. Here's what's happening today.</p>
        </div>
        <button
          onClick={() => loadData()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Sales"
          value={formatCurrency(stats.totalSales)}
          subValue={`+${formatCurrency(stats.todaySales)} today`}
          icon={IndianRupee}
          trend={stats.salesGrowth >= 0 ? `+${stats.salesGrowth}%` : `${stats.salesGrowth}%`}
          color="blue"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          subValue={`${stats.todayOrders} new orders`}
          icon={ShoppingBag}
          trend={stats.orderGrowth >= 0 ? `+${stats.orderGrowth}%` : `${stats.orderGrowth}%`}
          color="indigo"
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          subValue="Successful fulfillment"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="Pending Orders"
          value={stats.pending}
          subValue="Requires action"
          icon={Clock}
          color="amber"
          alert={stats.pending > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Status Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-slate-400" />
              Order Status Breakdown
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatusMiniCard label="Ready to Ship" count={stats.packed} color="sky" />
              <StatusMiniCard label="Shipped" count={stats.shipped} color="indigo" />
              <StatusMiniCard label="Cancelled" count={stats.cancelled} color="rose" />
              <StatusMiniCard label="RTO / Returned" count={stats.returned} color="orange" />
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1">
                View All <ChevronRight size={16} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Order ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No orders found.</td></tr>
                  ) : (
                    orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-slate-900">#{order.invoiceNumber || order.id.slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">{order.customerName}</p>
                          <p className="text-xs text-slate-500">{order.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/orders?id=${order.id}`} className="p-2 hover:bg-slate-100 rounded-lg inline-block transition-colors">
                            <ArrowUpRight size={18} className="text-slate-400" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-8">
          {/* Action Center */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Action Center</h2>
            <div className="space-y-4">
              {stats.pending > 0 && (
                <ActionItem
                  icon={Clock}
                  title={`${stats.pending} Pending Orders`}
                  desc="Need confirmation or packing"
                  color="amber"
                />
              )}
              {stats.shiprocketFailures > 0 && (
                <ActionItem
                  icon={AlertCircle}
                  title="Shiprocket Sync Failed"
                  desc={`${stats.shiprocketFailures} orders failed to sync`}
                  color="rose"
                />
              )}
              <ActionItem
                icon={Package}
                title="Low Stock Alert"
                desc="3 products are below threshold"
                color="indigo"
              />
            </div>
          </div>

          {/* Shiprocket Widget */}
          <div className="bg-slate-900 rounded-2xl p-6 shadow-lg shadow-slate-200 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Truck size={20} className="text-sky-400" />
                <h2 className="text-lg font-bold">Shiprocket Summary</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Synced</p>
                  <p className="text-2xl font-bold mt-1">{orders.filter(o => o.shiprocketOrderId).length}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pending</p>
                  <p className="text-2xl font-bold mt-1">{orders.filter(o => !o.shiprocketOrderId && o.status !== "cancelled").length}</p>
                </div>
              </div>
              <Link href="/admin/orders" className="w-full mt-6 py-3 bg-sky-500 hover:bg-sky-400 transition-colors rounded-xl text-center text-sm font-bold block">
                Track Shipments
              </Link>
            </div>
            {/* Decoration */}
            <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-sky-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, trend, color, alert }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className={`bg-white rounded-2xl border ${alert ? "border-amber-200 shadow-amber-50" : "border-slate-200"} p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        <p className="text-xs text-slate-400 mt-2 font-medium">{subValue}</p>
      </div>
    </div>
  );
}

function StatusMiniCard({ label, count, color }: any) {
  const colors: any = {
    sky: "bg-sky-50 text-sky-700",
    indigo: "bg-indigo-50 text-indigo-700",
    rose: "bg-rose-50 text-rose-700",
    orange: "bg-orange-50 text-orange-700",
  };
  return (
    <div className={`${colors[color]} p-4 rounded-xl text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
    packed: { label: "Packed", color: "bg-sky-100 text-sky-700" },
    shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
    delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "Cancelled", color: "bg-rose-100 text-rose-700" },
    returned: { label: "Returned/RTO", color: "bg-orange-100 text-orange-700" },
  };
  const { label, color } = config[status] || { label: status, color: "bg-slate-100 text-slate-700" };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
}

function ActionItem({ icon: Icon, title, desc, color }: any) {
  const colors: any = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${colors[color]} cursor-pointer hover:scale-[1.02] transition-transform`}>
      <div className="mt-1">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-bold leading-none">{title}</p>
        <p className="text-xs mt-1 opacity-70">{desc}</p>
      </div>
    </div>
  );
}
