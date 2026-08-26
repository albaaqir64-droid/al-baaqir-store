"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminGuard from "../components/AdminGuard";
import { fetchOrders, OrderRecord } from "../lib/orders";
import { readApiJson } from "../lib/api/client";

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

  async function loadProductCount() {
    try {
      const response = await fetch("/api/products");
      const parsed = await readApiJson<unknown[]>(response);
      setProductCount(parsed.ok && Array.isArray(parsed.data) ? parsed.data.length : 0);
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

  async function loadDashboard() {
    setLoading(true);
    await Promise.all([loadProductCount(), loadOrders()]);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <AdminGuard>
      <main className="admin-theme min-h-screen bg-brand-off-white text-brand-dark">
        <div className="mx-auto grid min-h-screen max-w-[1900px] grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-[32px] border border-brand-light bg-white p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-3xl bg-brand-teal text-2xl font-semibold text-white shadow-inner">AB</div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-brand-green">Al Baaqir</p>
                <h2 className="text-2xl font-semibold text-brand-dark">Admin HQ</h2>
              </div>
            </div>

            <nav className="mt-10 space-y-2 text-brand-dark">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-3xl border px-4 py-3 transition hover:border-brand-teal/30 hover:bg-brand-light/20 ${link.href === "/admin" ? "border-brand-teal/20 bg-brand-teal text-white" : "border-brand-light bg-white text-brand-dark"}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-10 rounded-[28px] border border-brand-light bg-brand-off-white p-5 shadow-lg">
              <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">Team</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-teal to-brand-green text-lg font-semibold text-white">AL</div>
                <div>
                  <p className="font-semibold text-brand-dark">Aaliya</p>
                  <p className="text-sm text-brand-teal">Store manager</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-brand-light bg-brand-dark p-6 shadow-2xl text-white backdrop-blur-sm md:flex md:items-center md:justify-between md:gap-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-brand-light">Dashboard</p>
                <h1 className="text-4xl font-semibold">Premium store analytics</h1>
                <p className="max-w-2xl text-brand-light/80">View core metrics and jump directly to product, order, and inventory management.</p>
              </div>
              <Link href="/admin/products" className="inline-flex items-center justify-center rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-teal">
                Manage products
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Products", value: productCount, icon: "📦", accent: "bg-brand-teal/15" },
                { label: "Total Orders", value: orders.length, icon: "🛒", accent: "bg-brand-green/15" },
                { label: "Revenue", value: formatCurrency(totalRevenue), icon: "₹", accent: "bg-brand-teal/15" },
                { label: "Pending Orders", value: pendingOrders, icon: "⏳", accent: "bg-brand-light/30" },
              ].map((card) => (
                <div key={card.label} className="rounded-[28px] border border-brand-light bg-white px-6 py-5 shadow-xl transition hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-brand-teal">{card.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-brand-dark">{card.value}</p>
                    </div>
                    <div className={`${card.accent} grid h-14 w-14 place-items-center rounded-3xl text-2xl`}>{card.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[32px] border border-brand-light bg-white p-6 shadow-2xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-brand-dark">Recent orders</h2>
                  <p className="mt-2 text-brand-teal">Check recent sales and review order status at a glance.</p>
                </div>
                <Link href="/admin/orders" className="inline-flex items-center justify-center rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-teal">
                  View all orders
                </Link>
              </div>

              <div className="mt-6 overflow-x-auto rounded-[28px] border border-brand-light bg-brand-off-white">
                <table className="min-w-full divide-y divide-brand-light text-left text-sm text-brand-dark">
                  <thead className="bg-brand-off-white text-brand-teal">
                    <tr>
                      {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map((header) => (
                        <th key={header} className="px-5 py-4 font-semibold uppercase tracking-[0.16em]">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-light">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-brand-teal">Loading orders...</td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-brand-teal">No orders available yet.</td>
                      </tr>
                    ) : (
                      orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="transition hover:bg-brand-light/20">
                          <td className="px-5 py-4 text-brand-dark">{order.id.slice(-8).toUpperCase()}</td>
                          <td className="px-5 py-4 text-brand-teal">{order.customerName || 'Guest'}</td>
                          <td className="px-5 py-4 text-brand-dark">{formatCurrency(order.total)}</td>
                          <td className="px-5 py-4 text-brand-teal capitalize">{order.status.replace(/_/g, ' ')}</td>
                          <td className="px-5 py-4 text-brand-teal">{order.createdAt ? (order.createdAt.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()) : '-'}</td>
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
