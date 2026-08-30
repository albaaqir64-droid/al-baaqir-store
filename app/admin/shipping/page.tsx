"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Search,
  Filter,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { fetchOrders, OrderRecord } from "../../lib/orders";

export default function ShippingPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetching wallet balance
      const walletRes = await fetch("/api/admin/shiprocket/wallet");
      const walletData = await walletRes.json();
      if (walletData.balance_amount !== undefined) {
        setWalletBalance(walletData.balance_amount);
      }

      // Fetching orders that are synced with Shiprocket
      const allOrders = await fetchOrders();
      const syncedOrders = allOrders.filter(o => o.shiprocketShipmentId);
      setOrders(syncedOrders);
    } catch (err) {
      console.error("Error loading shipping data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredShipments = useMemo(() => {
    return orders.filter(s =>
      s.shiprocketShipmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const stats = useMemo(() => {
    return {
      inTransit: orders.filter(o => o.status === 'shipped').length,
      outForDelivery: orders.filter(o => o.status === 'out_for_delivery').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      pending: orders.filter(o => o.shiprocketStatus === 'NEW' || !o.shiprocketStatus).length
    };
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'shipped':
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-700';
      case 'pending':
      case 'new': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const handleBulkManifest = async () => {
    if (selectedShipments.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/shiprocket/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentIds: selectedShipments }),
      });
      const data = await res.json();
      if (data.ok && data.manifestUrl) {
        window.open(data.manifestUrl, "_blank");
      } else {
        alert(data.error || "Failed to generate manifest");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating manifest");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkLabels = async () => {
    if (selectedShipments.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/shiprocket/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentIds: selectedShipments }),
      });
      const data = await res.json();
      if (data.ok && data.labelUrl) {
        window.open(data.labelUrl, "_blank");
      } else {
        alert(data.error || "Failed to generate labels");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating labels");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedShipments(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logistics & Shipping</h1>
          <p className="text-slate-500 text-sm mt-1">Track Shiprocket shipments and manage fulfillment providers.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedShipments.length > 0 && (
            <div className="flex items-center gap-2 mr-2 animate-in slide-in-from-right-4">
              <button
                onClick={handleBulkLabels}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                Print Labels ({selectedShipments.length})
              </button>
              <button
                onClick={handleBulkManifest}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Create Manifest"}
              </button>
            </div>
          )}
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Shipping Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ShippingStatCard label="In Transit" count={stats.inTransit} icon={Truck} color="blue" />
        <ShippingStatCard label="Out for Delivery" count={stats.outForDelivery} icon={MapPin} color="indigo" />
        <ShippingStatCard label="Delivered" count={stats.delivered} icon={CheckCircle2} color="emerald" />
        <ShippingStatCard label="Awaiting Sync" count={stats.pending} icon={AlertCircle} color="rose" alert={stats.pending > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Active Shipments</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Track AWB/Order..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedShipments(filteredShipments.map(s => s.shiprocketShipmentId!).filter(Boolean));
                        } else {
                          setSelectedShipments([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shipment / AWB</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                   [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-6"><div className="h-8 bg-slate-50 rounded-lg w-full"></div></td>
                    </tr>
                   ))
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">
                      No active shipments found.
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((s) => (
                    <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedShipments.includes(s.shiprocketShipmentId!) ? 'bg-slate-50' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedShipments.includes(s.shiprocketShipmentId!)}
                          onChange={() => toggleSelection(s.shiprocketShipmentId!)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{s.shiprocketShipmentId}</span>
                          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-tighter">
                            AWB: {s.shiprocketOrderId || 'SYNCING'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{s.invoiceNumber || s.id.slice(-8).toUpperCase()}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{s.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {s.shipping.city}, {s.shipping.state}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(s.status)}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <a
                          href={`https://app.shiprocket.in/orders/${s.shiprocketOrderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 inline-block text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                         >
                           <ExternalLink size={16} />
                         </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
             <button disabled className="p-2 border border-slate-200 rounded-lg opacity-50"><ChevronLeft size={16}/></button>
             <span className="text-xs font-bold text-slate-500">Page 1 of 3</span>
             <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronRight size={16}/></button>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={20} className="text-sky-400" />
                <h2 className="text-lg font-bold">Courier Split</h2>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Delhivery</span>
                    <span className="text-sm font-bold">45%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500" style={{ width: '45%' }}></div>
                 </div>

                 <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">BlueDart</span>
                    <span className="text-sm font-bold">32%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: '32%' }}></div>
                 </div>

                 <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">XpressBees</span>
                    <span className="text-sm font-bold">23%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '23%' }}></div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Shiprocket Wallet</h2>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance</p>
                    <p className="text-xl font-bold text-slate-900">₹{walletBalance ? Number(walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : "---"}</p>
                 </div>
                 <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold">Recharge</button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100">
                 <Clock size={14} />
                 <span>Auto-recharge triggers at ₹500</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ShippingStatCard({ label, count, icon: Icon, color, alert }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className={`bg-white rounded-2xl border ${alert ? 'border-rose-200 shadow-rose-50' : 'border-slate-200'} p-5 shadow-sm`}>
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{count}</p>
        </div>
      </div>
    </div>
  );
}
