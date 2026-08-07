"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminGuard from "../components/AdminGuard";
import { fetchOrders, OrderRecord } from "../lib/orders";

const NAV_LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Inventory", href: "/admin/inventory" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminPage() {
  const [productCount, setProductCount] = useState(0);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total ?? 0), 0),
    [orders]
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders]
  );

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    await Promise.all([loadProductCount(), loadOrders()]);
    setLoading(false);
  }

  async function loadProductCount() {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProductCount(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error("Failed to load product count:", error);
      setProductCount(0);
    }
  }

  async function loadOrders() {
    try {
      const data = await fetchOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrders([]);
    }
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto grid min-h-screen max-w-[1900px] grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-[32px] border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-emerald/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-3xl bg-emerald-500 text-2xl font-semibold text-slate-950 shadow-inner shadow-emerald/20">AB</div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Al Baaqir</p>
                <h2 className="text-2xl font-semibold text-white">Admin HQ</h2>
              </div>
            </div>

            <nav className="mt-10 space-y-2 text-slate-300">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-3xl border px-4 py-3 transition hover:border-emerald/30 hover:bg-slate-900/80 ${link.href === "/admin" ? "border-emerald/20 bg-emerald-500/10 text-white" : "border-slate-800 bg-slate-900 text-slate-300"}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-10 rounded-[28px] border border-slate-800 bg-slate-900 p-5 shadow-lg">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Team</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-lg font-semibold text-slate-950">AL</div>
                <div>
                  <p className="font-semibold text-white">Aaliya</p>
                  <p className="text-sm text-slate-500">Store manager</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm md:flex md:items-center md:justify-between md:gap-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Dashboard</p>
                <h1 className="text-4xl font-semibold text-white">Premium store analytics</h1>
                <p className="max-w-2xl text-slate-400">View core metrics and jump directly to product, order, and inventory management.</p>
              </div>
              <Link href="/admin/products" className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400">
                Manage products
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Products", value: productCount, icon: "📦", accent: "bg-emerald-500/15" },
                { label: "Total Orders", value: orders.length, icon: "🛒", accent: "bg-gold/15" },
                { label: "Revenue", value: formatCurrency(totalRevenue), icon: "₹", accent: "bg-emerald-500/15" },
                { label: "Pending Orders", value: pendingOrders, icon: "⏳", accent: "bg-rose-500/10" },
              ].map((card) => (
                <div key={card.label} className="rounded-[28px] border border-slate-800 bg-slate-900 px-6 py-5 shadow-xl shadow-emerald/5 transition hover:-translate-y-1 hover:shadow-emerald/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                    </div>
                    <div className={`${card.accent} grid h-14 w-14 place-items-center rounded-3xl text-2xl`}>{card.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[32px] border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/30">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Recent orders</h2>
                  <p className="mt-2 text-slate-400">Check recent sales and review order status at a glance.</p>
                </div>
                <Link href="/admin/orders" className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400">
                  View all orders
                </Link>
              </div>

              <div className="mt-6 overflow-x-auto rounded-[28px] border border-slate-800 bg-slate-950/90">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/90 text-slate-400">
                    <tr>
                      {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map((header) => (
                        <th key={header} className="px-5 py-4 font-semibold uppercase tracking-[0.16em]">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-500">Loading orders...</td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-slate-400">No orders available yet.</td>
                      </tr>
                    ) : (
                      orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="transition hover:bg-slate-900/80">
                          <td className="px-5 py-4 text-slate-200">{order.id.slice(-8).toUpperCase()}</td>
                          <td className="px-5 py-4 text-slate-300">{order.customerName || 'Guest'}</td>
                          <td className="px-5 py-4 text-slate-200">{formatCurrency(order.total)}</td>
                          <td className="px-5 py-4 text-slate-300 capitalize">{order.status.replace(/_/g, ' ')}</td>
          <td className="px-5 py-4 text-slate-300">{new Date(order.createdAt || Date.now()).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}
