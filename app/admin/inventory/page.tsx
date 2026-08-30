"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Edit3,
  Save,
  X,
  ArrowUpRight
} from "lucide-react";
import { readApiJson } from "../../lib/api/client";
import Link from "next/link";

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  sku?: string;
  reorderStatus: "sufficient" | "low" | "out_of_stock";
}

interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStock: number;
}

const PAGE_SIZE = 10;

export default function InventoryAdminPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out_of_stock">("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [editReason, setEditReason] = useState("Manual adjustment");
  const [updateMessage, setUpdateMessage] = useState({ text: "", type: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    void loadInventory();
    void loadStats();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", data: { query: search || "" } }),
      });

      const parsed = await readApiJson<{ success?: boolean; results?: InventoryItem[] }>(response);
      if (parsed.ok && parsed.data?.success) {
        setInventory(parsed.data.results ?? []);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stats", data: {} }),
      });

      const parsed = await readApiJson<{ success?: boolean; stats?: InventoryStats }>(response);
      if (parsed.ok && parsed.data?.success) {
        setStats(parsed.data.stats ?? null);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  const filteredInventory = useMemo(() => {
    let filtered = inventory;
    if (filter === "low") {
      filtered = filtered.filter((item) => item.reorderStatus === "low");
    } else if (filter === "out_of_stock") {
      filtered = filtered.filter((item) => item.reorderStatus === "out_of_stock");
    }
    return filtered;
  }, [inventory, filter]);

  const pagedInventory = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredInventory.slice(start, start + PAGE_SIZE);
  }, [filteredInventory, page]);

  const handleUpdateStock = async (productId: string) => {
    if (!editQuantity) return;
    setIsUpdating(true);
    setUpdateMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_stock",
          data: {
            productId,
            quantity: parseInt(editQuantity),
            reason: editReason,
          },
        }),
      });

      const parsed = await readApiJson<{ success?: boolean }>(response);

      if (parsed.ok && parsed.data?.success) {
        setUpdateMessage({ text: "Stock updated successfully!", type: "success" });
        setEditingId(null);
        setEditQuantity("");
        void loadInventory();
        void loadStats();
        setTimeout(() => setUpdateMessage({ text: "", type: "" }), 3000);
      } else {
        setUpdateMessage({ text: "Failed to update stock", type: "error" });
      }
    } catch (error) {
      setUpdateMessage({ text: "Error updating stock", type: "error" });
      console.error("Error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "sufficient": return "bg-emerald-100 text-emerald-700";
      case "low": return "bg-amber-100 text-amber-700";
      case "out_of_stock": return "bg-rose-100 text-rose-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor stock levels, reorder points, and warehouse status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { loadInventory(); loadStats(); }}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            <Plus size={18} />
            Restock Item
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InventoryStatCard
          label="Total Items"
          value={stats?.totalStock || 0}
          subValue={`${stats?.totalProducts || 0} Products`}
          icon={Package}
          color="blue"
        />
        <InventoryStatCard
          label="Low Stock Items"
          value={stats?.lowStockItems || 0}
          icon={AlertCircle}
          color="amber"
          alert={!!stats?.lowStockItems}
        />
        <InventoryStatCard
          label="Out of Stock"
          value={stats?.outOfStockItems || 0}
          icon={XCircle}
          color="rose"
          alert={!!stats?.outOfStockItems}
        />
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inventory Health</p>
            <h3 className="text-3xl font-bold mt-2">
              {stats ? Math.round(((stats.totalProducts - stats.outOfStockItems) / stats.totalProducts) * 100) : 0}%
            </h3>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-400">
              <TrendingUp size={14} />
              Optimal availability
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
             <Package size={120} />
          </div>
        </div>
      </div>

      {/* Filters & Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadInventory()}
              placeholder="Search by SKU, Product Name..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:outline-none transition-all"
            >
              <option value="all">All Status</option>
              <option value="low">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {updateMessage.text && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            updateMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {updateMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {updateMessage.text}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product / SKU</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6"><div className="h-10 bg-slate-50 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : pagedInventory.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">No items found matching your criteria.</td></tr>
              ) : (
                pagedInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{item.productName}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SKU: {item.sku || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">{item.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                           <input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                           <span className={`text-sm font-bold ${item.currentStock < 5 ? 'text-amber-600' : 'text-slate-900'}`}>{item.currentStock}</span>
                           {item.currentStock < 5 && <TrendingDown size={14} className="text-amber-500" />}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(item.reorderStatus)}`}>
                        {item.reorderStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-2">
                           <button
                            onClick={() => handleUpdateStock(item.id)}
                            disabled={isUpdating}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                           >
                             <Save size={18} />
                           </button>
                           <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                           >
                             <X size={18} />
                           </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(item.id); setEditQuantity(String(item.currentStock)); }}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-500">Page {page} of {Math.ceil(filteredInventory.length / PAGE_SIZE) || 1}</p>
           <div className="flex gap-2">
             <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors"
             >
               <ChevronLeft size={18} />
             </button>
             <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * PAGE_SIZE >= filteredInventory.length}
                className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors"
             >
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </div>

      {/* Manual Adjustment Reason Modal-like section */}
      {editingId && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300">
           <div className="flex items-center gap-2 text-amber-800 mb-4">
              <AlertCircle size={20} />
              <h3 className="font-bold">Stock Adjustment Protocol</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Adjustment Reason</label>
                <select
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                >
                  <option>Manual adjustment</option>
                  <option>Stock received</option>
                  <option>Damaged goods</option>
                  <option>Return from customer</option>
                  <option>Inventory count correction</option>
                  <option>Transfer</option>
                </select>
              </div>
              <div className="flex items-end">
                 <p className="text-xs text-amber-600 font-medium">
                   Note: All inventory adjustments are logged for audit purposes. Please ensure the reason accurately reflects the physical stock change.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function InventoryStatCard({ label, value, subValue, icon: Icon, color, alert }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className={`bg-white rounded-2xl border ${alert ? "border-amber-200 shadow-amber-50" : "border-slate-200"} p-6 shadow-sm`}>
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          {subValue && <p className="text-[10px] text-slate-400 font-bold mt-1">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}
