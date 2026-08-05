"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOrders, OrderRecord, ORDER_STATUSES, OrderStatus, updateOrderStatus } from "../../lib/orders";
import AdminGuard from "../../components/AdminGuard";
import { OrderTimeline } from "../../components/OrderTimeline";
import Link from "next/link";

const PAGE_SIZE = 10;

function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    packed: "Packed",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status];
}

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [note, setNote] = useState("");
  const [actionStatus, setActionStatus] = useState<OrderStatus>("pending");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceSuccess, setInvoiceSuccess] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    const results = await fetchOrders({ search: search || undefined, status: statusFilter || undefined });
    setOrders(results);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [search, statusFilter]);

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  }, [orders, page]);

  async function updateOrder(order: OrderRecord, nextStatus: OrderStatus) {
    await updateOrderStatus(order.id, nextStatus, { internalNotes: note });
    setSelectedOrder(null);
    setNote("");
    loadOrders();
  }

  const generateInvoice = async (order: OrderRecord) => {
    setInvoiceLoading(true);
    setInvoiceError("");
    setInvoiceSuccess("");

    try {
      const response = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInvoiceError(data.error || "Failed to generate invoice");
        return;
      }

      setInvoiceSuccess("Invoice generated and email sent successfully!");
      setSelectedOrder({ ...order, invoiceNumber: data.invoiceNumber, invoiceUrl: data.invoiceUrl });
      loadOrders();
    } catch (err) {
      setInvoiceError("Failed to generate invoice. Please try again.");
      console.error("Invoice generation error:", err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const resendInvoiceEmail = async (order: OrderRecord) => {
    if (!order.invoiceUrl) {
      setInvoiceError("No invoice found. Please generate invoice first.");
      return;
    }

    setInvoiceLoading(true);
    setInvoiceError("");
    setInvoiceSuccess("");

    try {
      const response = await fetch("/api/invoices/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInvoiceError(data.error || "Failed to resend invoice email");
        return;
      }

      setInvoiceSuccess("Invoice email resent successfully!");
    } catch (err) {
      setInvoiceError("Failed to resend invoice email. Please try again.");
      console.error("Invoice resend error:", err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const downloadInvoice = (order: OrderRecord) => {
    if (order.invoiceUrl) {
      const link = document.createElement("a");
      link.href = order.invoiceUrl;
      link.download = `invoice-${order.invoiceNumber || order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="rounded-[32px] border border-emerald/20 bg-slate-900/90 p-8 shadow-2xl shadow-emerald/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Admin Dashboard</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Order management</h1>
              </div>
              <div className="flex gap-3">
                <Link href="/admin/inventory" className="inline-flex rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-700">
                  📦 Inventory
                </Link>
                <Link href="/" className="inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-gold/20 transition hover:bg-[#d4b229]">
                  View store
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              {['Total orders', 'Revenue', 'Pending', 'Delivered', 'Cancelled'].map((label, index) => (
                <div key={label} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {label === 'Total orders' && orders.length}
                    {label === 'Revenue' && `₹${orders.reduce((sum, order) => sum + order.total, 0)}`}
                    {label === 'Pending' && orders.filter((order) => order.status === 'pending').length}
                    {label === 'Delivered' && orders.filter((order) => order.status === 'delivered').length}
                    {label === 'Cancelled' && orders.filter((order) => order.status === 'cancelled').length}
                  </p>
                </div>
              ))}
            </div>
          </header>

          <section className="rounded-[32px] border border-slate-800 bg-slate-900/95 p-6 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search orders, phone, invoice"
                  className="rounded-full border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/20"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "")}
                  className="rounded-full border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/20"
                >
                  <option value="">All statuses</option>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-slate-400">Showing {pagedOrders.length} of {orders.length} orders</p>
            </div>

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
                      {['Invoice', 'Customer', 'Phone', 'Status', 'Total', 'Created', 'Actions'].map((header) => (
                        <th key={header} className="px-4 py-3 font-semibold text-slate-400">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pagedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-950/80">
                        <td className="px-4 py-4"><span className="font-medium text-white">{order.invoiceNumber}</span></td>
                        <td className="px-4 py-4">{order.customerName}</td>
                        <td className="px-4 py-4">{order.phone}</td>
                        <td className="px-4 py-4"><span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{statusLabel(order.status)}</span></td>
                        <td className="px-4 py-4">₹{order.total}</td>
                        <td className="px-4 py-4">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : "-"}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setActionStatus(order.status);
                              setInvoiceError("");
                              setInvoiceSuccess("");
                            }}
                            className="rounded-full border border-emerald px-4 py-2 text-xs font-semibold text-emerald transition hover:bg-emerald/10"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 disabled:opacity-60"
              >Previous</button>
              <span className="text-sm text-slate-400">Page {page}</span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page * PAGE_SIZE >= orders.length}
                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 disabled:opacity-60"
              >Next</button>
            </div>
          </section>

          {selectedOrder && (
            <section className="rounded-[32px] border border-emerald/20 bg-slate-900/95 p-6 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">Order details</h2>
                  <p className="mt-1 text-slate-400">Update status, notes and shipping information.</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
                >Close</button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Customer</p>
                  <p className="mt-2 text-white">{selectedOrder.customerName}</p>
                  <p className="mt-1 text-slate-400">{selectedOrder.phone}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm text-slate-400">Address</p>
                  <p className="mt-2 text-white">{selectedOrder.shipping.address}</p>
                  <p className="mt-1 text-slate-400">{selectedOrder.shipping.city}, {selectedOrder.shipping.state} {selectedOrder.shipping.pincode}</p>
                </div>
              </div>

              <div className="mt-6">
                <OrderTimeline current={selectedOrder.status} />
              </div>

              {/* Invoice Section */}
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Invoice Management</h3>
                
                {invoiceError && (
                  <div className="mb-4 rounded-lg bg-red-950 p-3 text-sm text-red-200">
                    {invoiceError}
                  </div>
                )}
                
                {invoiceSuccess && (
                  <div className="mb-4 rounded-lg bg-green-950 p-3 text-sm text-green-200">
                    {invoiceSuccess}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {selectedOrder.invoiceUrl ? (
                    <>
                      <button
                        onClick={() => downloadInvoice(selectedOrder)}
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        📄 Download Invoice
                      </button>
                      <button
                        onClick={() => resendInvoiceEmail(selectedOrder)}
                        disabled={invoiceLoading}
                        className="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                      >
                        {invoiceLoading ? "Sending..." : "📧 Resend Email"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => generateInvoice(selectedOrder)}
                      disabled={invoiceLoading}
                      className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                    >
                      {invoiceLoading ? "Generating..." : "⚡ Generate Invoice"}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200">Internal notes</label>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/20"
                    placeholder="Add a note for the fulfillment team"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={actionStatus}
                    onChange={(event) => setActionStatus(event.target.value as OrderStatus)}
                    className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/20"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => updateOrder(selectedOrder, actionStatus)}
                    className="rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald/20 transition hover:bg-emerald-600"
                  >
                    Update status
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}
