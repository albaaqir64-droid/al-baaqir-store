"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { fetchOrders, OrderRecord } from "../../lib/orders";

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load payment data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return orders.filter(o =>
      o.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const prepaid = orders.filter(o => o.paymentMethod?.toLowerCase() !== 'cod');
    const cod = orders.filter(o => o.paymentMethod?.toLowerCase() === 'cod');

    return {
      totalRevenue,
      prepaidRevenue: prepaid.reduce((sum, o) => sum + (o.total || 0), 0),
      codRevenue: cod.reduce((sum, o) => sum + (o.total || 0), 0),
      successRate: orders.length > 0 ? ((orders.filter(o => o.status !== 'cancelled').length / orders.length) * 100).toFixed(1) : "0"
    };
  }, [orders]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments & Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor revenue, reconciliation, and payout status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
            <Download size={18} />
            Payout Report
          </button>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Prepaid Revenue (Razorpay)</p>
            <h3 className="text-3xl font-bold mt-2">₹{stats.prepaidRevenue.toLocaleString('en-IN')}</h3>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ArrowUpRight size={14} />
              Auto-settlement active
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
             <IndianRupee size={120} />
          </div>
        </div>

        <PaymentStatCard label="Success Rate" value={`${stats.successRate}%`} icon={CheckCircle2} color="emerald" trend="+0.4%" />
        <PaymentStatCard label="COD Pending" value={`₹${stats.codRevenue.toLocaleString('en-IN')}`} icon={Clock} color="amber" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Transaction ID, Order ID..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
             Showing {filteredTransactions.length} transactions
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ref ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order / Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-6"><div className="h-6 bg-slate-50 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">No transactions found.</td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">
                      #{txn.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{txn.invoiceNumber || 'ORD-'+txn.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{txn.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {txn.paymentMethod || 'Prepaid'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      ₹{txn.total?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        txn.status === 'delivered' || txn.status === 'shipped' ? 'bg-emerald-100 text-emerald-700' :
                        txn.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        txn.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {txn.status === 'cancelled' ? 'FAILED' : 'SUCCESS'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-slate-400">
                      {txn.createdAt?.toDate ? new Date(txn.createdAt.toDate()).toLocaleDateString() : new Date(txn.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-500">Page 1 of 1</p>
           <div className="flex gap-2">
             <button disabled className="p-2 border border-slate-200 rounded-xl opacity-50"><ChevronLeft size={18} /></button>
             <button disabled className="p-2 border border-slate-200 rounded-xl opacity-50"><ChevronRight size={18} /></button>
           </div>
        </div>
      </div>
    </div>
  );
}

function PaymentStatCard({ label, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
    </div>
  );
}
