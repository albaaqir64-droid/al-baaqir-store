"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOrders, OrderRecord, ORDER_STATUSES, OrderStatus, updateOrderStatus } from "../../lib/orders";
import { readApiJson } from "../../lib/api/client";
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
  const [shiprocketLoading, setShiprocketLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceSuccess, setInvoiceSuccess] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const results = await fetchOrders({
        search: search || undefined,
        status: statusFilter || undefined
      });
      setOrders(results || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
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

  const syncToShiprocket = async (order: OrderRecord) => {
    setShiprocketLoading(true);
    setInvoiceError("");
    setInvoiceSuccess("");

    try {
      const response = await fetch("/api/admin/shiprocket/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const parsed = await readApiJson<{ error?: string; message?: string; shiprocketOrderId?: string }>(response);

      if (!parsed.ok) {
        setInvoiceError(parsed.error || "Failed to sync with Shiprocket");
        return;
      }

      setInvoiceSuccess(parsed.data?.message || "Synced to Shiprocket successfully!");
      loadOrders();
    } catch (err) {
      setInvoiceError("Failed to sync with Shiprocket. Please try again.");
      console.error("Shiprocket sync error:", err);
    } finally {
      setShiprocketLoading(false);
    }
  };

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

      const parsed = await readApiJson<{ error?: string; invoiceNumber?: string; invoiceUrl?: string }>(response);

      if (!parsed.ok) {
        setInvoiceError(parsed.error || "Failed to generate invoice");
        return;
      }

      const data = parsed.data ?? {};
      setInvoiceSuccess("Invoice generated and email sent successfully!");
      setSelectedOrder({ ...order, invoiceNumber: data.invoiceNumber ?? "", invoiceUrl: data.invoiceUrl });
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

      const parsed = await readApiJson<{ error?: string; message?: string }>(response);

      if (!parsed.ok) {
        setInvoiceError(parsed.error || "Failed to resend invoice email");
        return;
      }

      setInvoiceSuccess(parsed.data?.message || "Invoice email resent successfully!");
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

  const downloadShippingLabel = (order: OrderRecord) => {
    const link = document.createElement("a");
    link.href = `/api/shipping-label?orderId=${encodeURIComponent(order.id)}`;
    link.download = `shipping-label-${order.invoiceNumber || order.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminGuard>
      <main className="admin-theme min-h-screen bg-brand-off-white text-brand-dark px-6 py-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="rounded-[32px] border border-brand-light bg-brand-dark p-8 shadow-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-brand-light">Admin Dashboard</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Order management</h1>
              </div>
              <div className="flex gap-3">
                <Link href="/admin/inventory" className="inline-flex rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-green">
                  📦 Inventory
                </Link>
                <Link href="/" className="inline-flex rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-teal">
                  View store
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              {['Total orders', 'Revenue', 'Pending', 'Delivered', 'Cancelled'].map((label) => (
                <div key={label} className="rounded-3xl border border-brand-teal/20 bg-brand-teal/10 p-6 backdrop-blur-sm">
                  <p className="text-sm text-brand-light/70">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {label === 'Total orders' && orders.length}
                    {label === 'Revenue' && `₹${orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0).toLocaleString('en-IN')}`}
                    {label === 'Pending' && orders.filter((order) => order.status === 'pending').length}
                    {label === 'Delivered' && orders.filter((order) => order.status === 'delivered').length}
                    {label === 'Cancelled' && orders.filter((order) => order.status === 'cancelled').length}
                  </p>
                </div>
              ))}
            </div>
          </header>

          <section className="rounded-[32px] border border-brand-light bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search orders, phone, invoice"
                  className="rounded-full border border-brand-light bg-brand-off-white px-4 py-3 text-sm text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "")}
                  className="rounded-full border border-brand-light bg-brand-off-white px-4 py-3 text-sm text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                >
                  <option value="">All statuses</option>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-brand-teal">Showing {pagedOrders.length} of {orders.length} orders</p>
            </div>

            {loading ? (
              <div className="mt-8 space-y-3">
                <div className="h-4 w-full rounded-full bg-brand-off-white animate-pulse" />
                <div className="h-4 w-full rounded-full bg-brand-off-white animate-pulse" />
                <div className="h-4 w-full rounded-full bg-brand-off-white animate-pulse" />
              </div>
            ) : (
              <div className="mt-8 overflow-x-auto">
                <table className="min-w-full divide-y divide-brand-light text-left text-sm text-brand-dark">
                  <thead>
                    <tr>
                      {['Invoice', 'Customer', 'Phone', 'Status', 'Total', 'Created', 'Actions'].map((header) => (
                        <th key={header} className="px-4 py-3 font-semibold text-brand-teal uppercase tracking-wider">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-light">
                    {pagedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-brand-off-white transition">
                        <td className="px-4 py-4"><span className="font-medium text-brand-dark">{order.invoiceNumber}</span></td>
                        <td className="px-4 py-4">{order.customerName}</td>
                        <td className="px-4 py-4">{order.phone}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex rounded-full bg-brand-light/20 px-3 py-1 text-xs text-brand-green font-medium">{statusLabel(order.status)}</span>
                            {order.shiprocketOrderId && (
                              <span className="text-[10px] font-bold text-brand-teal uppercase tracking-tighter">🚀 Synced</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-brand-dark">₹{(Number(order.total) || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-brand-teal">
                          {order.createdAt?.toDate
                            ? new Date(order.createdAt.toDate()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : order.createdAt instanceof Date
                              ? order.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : "-"}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setActionStatus(order.status);
                              setInvoiceError("");
                              setInvoiceSuccess("");
                            }}
                            className="rounded-full border border-brand-teal px-4 py-2 text-xs font-semibold text-brand-teal transition hover:bg-brand-teal hover:text-white"
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
                className="rounded-full border border-brand-light bg-white px-4 py-2 text-sm text-brand-dark transition hover:border-brand-teal disabled:opacity-40"
              >Previous</button>
              <span className="text-sm text-brand-teal font-medium">Page {page}</span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page * PAGE_SIZE >= orders.length}
                className="rounded-full border border-brand-light bg-white px-4 py-2 text-sm text-brand-dark transition hover:border-brand-teal disabled:opacity-40"
              >Next</button>
            </div>
          </section>

          {selectedOrder && (
            <section className="rounded-[32px] border border-brand-teal bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between gap-3 border-b border-brand-light pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-brand-dark">Order details</h2>
                  <p className="mt-1 text-brand-teal">Update status, notes and shipping information.</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full border border-brand-light px-4 py-2 text-sm text-brand-dark hover:bg-brand-off-white transition"
                >Close</button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-brand-light bg-brand-off-white p-4">
                  <p className="text-sm font-semibold text-brand-teal uppercase tracking-wider">Customer</p>
                  <p className="mt-2 text-lg font-medium text-brand-dark">{selectedOrder.customerName}</p>
                  <p className="mt-1 text-brand-teal">{selectedOrder.phone}</p>
                </div>
                <div className="rounded-3xl border border-brand-light bg-brand-off-white p-4">
                  <p className="text-sm font-semibold text-brand-teal uppercase tracking-wider">Address</p>
                  <p className="mt-2 text-brand-dark">{selectedOrder.shipping.address}</p>
                  <p className="mt-1 text-brand-teal">{selectedOrder.shipping.city}, {selectedOrder.shipping.state} {selectedOrder.shipping.pincode}</p>
                </div>
              </div>

              <div className="mt-6">
                <OrderTimeline current={selectedOrder.status} />
              </div>

              {/* Invoice & Shipping Section */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-brand-light bg-white p-6 shadow-md">
                  <h3 className="text-lg font-semibold text-brand-dark mb-4">Invoice Management</h3>

                  {invoiceError && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                      {invoiceError}
                    </div>
                  )}

                  {invoiceSuccess && (
                    <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-600">
                      {invoiceSuccess}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadShippingLabel(selectedOrder)}
                      className="rounded-full border border-brand-dark px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white"
                    >
                      Download Shipping Label
                    </button>
                    {selectedOrder.invoiceUrl ? (
                      <>
                        <button
                          onClick={() => downloadInvoice(selectedOrder)}
                          className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                        >
                          📄 Download Invoice
                        </button>
                        <button
                          onClick={() => resendInvoiceEmail(selectedOrder)}
                          disabled={invoiceLoading}
                          className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-teal disabled:opacity-50"
                        >
                          {invoiceLoading ? "Sending..." : "📧 Resend Email"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => generateInvoice(selectedOrder)}
                        disabled={invoiceLoading}
                        className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-teal disabled:opacity-50"
                      >
                        {invoiceLoading ? "Generating..." : "⚡ Generate Invoice"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-brand-light bg-white p-6 shadow-md">
                  <h3 className="text-lg font-semibold text-brand-dark mb-4">Shiprocket Logistics</h3>

                  {selectedOrder.shiprocketOrderId ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-brand-green">
                        <span className="h-2 w-2 rounded-full bg-brand-green" />
                        <span className="text-sm font-bold uppercase tracking-wider">Synced with Shiprocket</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-brand-teal font-semibold">SR Order ID</p>
                          <p className="font-mono text-brand-dark">{selectedOrder.shiprocketOrderId}</p>
                        </div>
                        <div>
                          <p className="text-brand-teal font-semibold">SR Shipment ID</p>
                          <p className="font-mono text-brand-dark">
                            {selectedOrder.shiprocketShipmentId && selectedOrder.shiprocketShipmentId !== "null" && selectedOrder.shiprocketShipmentId !== "undefined" ? (
                              selectedOrder.shiprocketShipmentId
                            ) : (
                              <span className="text-brand-light italic">Awaiting shipment...</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                         disabled
                         className="w-full rounded-full border border-brand-light px-4 py-2 text-xs text-brand-teal font-medium"
                      >
                         Already Synced
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-brand-teal">This order has not been synced to Shiprocket yet.</p>
                      {selectedOrder.shiprocketError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                          <strong>Error:</strong> {selectedOrder.shiprocketError}
                        </div>
                      )}
                      <button
                        onClick={() => syncToShiprocket(selectedOrder)}
                        disabled={shiprocketLoading}
                        className="w-full rounded-full bg-brand-teal px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-dark disabled:opacity-50"
                      >
                        {shiprocketLoading ? "Syncing..." : "🚀 Sync to Shiprocket"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-4 pt-6 border-t border-brand-light">
                <div>
                  <label className="block text-sm font-bold text-brand-dark uppercase tracking-wider">Internal notes</label>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-3xl border border-brand-light bg-brand-off-white px-4 py-3 text-sm text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                    placeholder="Add a note for the fulfillment team"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={actionStatus}
                    onChange={(event) => setActionStatus(event.target.value as OrderStatus)}
                    className="rounded-full border border-brand-light bg-brand-off-white px-4 py-3 text-sm text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => updateOrder(selectedOrder, actionStatus)}
                    className="rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-dark"
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
