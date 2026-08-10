"use client";

import { useEffect, useMemo, useState } from "react";
import AdminGuard from "../../components/AdminGuard";
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

const PAGE_SIZE = 15;

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
  const [updateMessage, setUpdateMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadInventory();
    loadStats();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", data: { query: search || "" } }),
      });

      const data = await response.json();
      if (data.success) {
        setInventory(data.results);
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

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
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
    setUpdateMessage("");

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

      const data = await response.json();

      if (data.success) {
        setUpdateMessage("✅ Stock updated successfully!");
        setEditingId(null);
        setEditQuantity("");
        loadInventory();
        loadStats();

        setTimeout(() => setUpdateMessage(""), 3000);
      } else {
        setUpdateMessage("❌ Failed to update stock");
      }
    } catch (error) {
      setUpdateMessage("❌ Error updating stock");
      console.error("Error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sufficient":
        return "bg-green-950 text-green-300 border-green-700";
      case "low":
        return "bg-yellow-950 text-yellow-300 border-yellow-700";
      case "out_of_stock":
        return "bg-red-950 text-red-300 border-red-700";
      default:
        return "bg-slate-800 text-slate-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sufficient":
        return "✓ In Stock";
      case "low":
        return "⚠ Low Stock";
      case "out_of_stock":
        return "✗ Out of Stock";
      default:
        return status;
    }
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header */}
          <header className="rounded-[32px] border border-emerald/20 bg-slate-900/90 p-8 shadow-2xl shadow-emerald/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Admin Dashboard</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Inventory Management</h1>
              </div>
              <Link
                href="/admin/orders"
                className="inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-gold/20 transition hover:bg-[#d4b229]"
              >
                View Orders
              </Link>
            </div>

            {/* Stats Grid */}
            {stats && (
              <div className="mt-8 grid gap-4 sm:grid-cols-5">
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-sm text-slate-400">Total Products</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{stats.totalProducts}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-sm text-slate-400">Total Stock</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{stats.totalStock}</p>
                </div>
                <div className="rounded-3xl border border-emerald/20 bg-emerald-950/40 p-6">
                  <p className="text-sm text-emerald-300">Avg Stock</p>
                  <p className="mt-3 text-3xl font-semibold text-emerald-300">{stats.averageStock}</p>
                </div>
                <div className="rounded-3xl border border-yellow-700/30 bg-yellow-950/40 p-6">
                  <p className="text-sm text-yellow-300">Low Stock</p>
                  <p className="mt-3 text-3xl font-semibold text-yellow-300">{stats.lowStockItems}</p>
                </div>
                <div className="rounded-3xl border border-red-700/30 bg-red-950/40 p-6">
                  <p className="text-sm text-red-300">Out of Stock</p>
                  <p className="mt-3 text-3xl font-semibold text-red-300">{stats.outOfStockItems}</p>
                </div>
              </div>
            )}
          </header>

          {/* Filters & Search */}
          <section className="rounded-[32px] border border-slate-800 bg-slate-900/95 p-6 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                    loadInventory();
                  }}
                  placeholder="Search by name, category, or SKU"
                  className="rounded-full border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/20"
                />
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="rounded-full border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/20"
                >
                  <option value="all">All Items</option>
                  <option value="low">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <p className="text-sm text-slate-400">
                Showing {pagedInventory.length} of {filteredInventory.length} items
              </p>
            </div>

            {updateMessage && (
              <div className="mt-4 rounded-lg bg-slate-800 p-3 text-sm text-slate-200">
                {updateMessage}
              </div>
            )}

            {/* Inventory Table */}
            {loading ? (
              <div className="mt-8 space-y-3">
                <div className="h-4 w-full rounded-full bg-slate-800 animate-pulse" />
                <div className="h-4 w-full rounded-full bg-slate-800 animate-pulse" />
                <div className="h-4 w-full rounded-full bg-slate-800 animate-pulse" />
              </div>
            ) : (
              <div className="mt-8 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                  <thead>
                    <tr>
                      {["Product", "Category", "SKU", "Current", "Status", "Action"].map((header) => (
                        <th key={header} className="px-4 py-3 font-semibold text-slate-400">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pagedInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-950/80">
                        <td className="px-4 py-4">
                          <span className="font-medium text-white">{item.productName}</span>
                        </td>
                        <td className="px-4 py-4">{item.category}</td>
                        <td className="px-4 py-4 text-slate-400">{item.sku}</td>
                        <td className="px-4 py-4">
                          {editingId === item.id ? (
                            <input
                              type="number"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white"
                              placeholder="Qty"
                            />
                          ) : (
                            <span className="font-semibold">{item.currentStock}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColor(item.reorderStatus)}`}>
                            {getStatusLabel(item.reorderStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {editingId === item.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStock(item.id)}
                                disabled={isUpdating}
                                className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditQuantity("");
                                }}
                                className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditQuantity(String(item.currentStock));
                              }}
                              className="rounded-full border border-emerald px-3 py-1 text-xs font-semibold text-emerald transition hover:bg-emerald/10"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 disabled:opacity-60"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">Page {page}</span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page * PAGE_SIZE >= filteredInventory.length}
                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </section>

          {/* Stock Adjustment Section */}
          {editingId && (
            <section className="rounded-[32px] border border-emerald/20 bg-slate-900/95 p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white">Stock Adjustment Reason</h2>
              <div className="mt-4 space-y-3">
                <select
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/20"
                >
                  <option>Manual adjustment</option>
                  <option>Stock received</option>
                  <option>Damaged goods</option>
                  <option>Return from customer</option>
                  <option>Inventory count correction</option>
                  <option>Transfer</option>
                </select>
              </div>
            </section>
          )}

          {/* Info Box */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
            <p className="text-sm text-slate-400">
              💡 <strong>Tip:</strong> Click "Edit" to adjust stock quantities. Low stock items are automatically flagged when stock falls below 5 units.
            </p>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
