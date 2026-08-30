"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOrders, OrderRecord, ORDER_STATUSES, OrderStatus, updateOrderStatus } from "../../lib/orders";
import { readApiJson } from "../../lib/api/client";
import { OrderTimeline } from "../../components/OrderTimeline";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  FileText,
  Truck,
  Mail,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  ArrowUpRight
} from "lucide-react";

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
    return_requested: "Return Requested",
    returned: "Returned",
  };
  return labels[status];
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors: Record<OrderStatus, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    packed: "bg-sky-100 text-sky-700 border-sky-200",
    shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
    out_for_delivery: "bg-purple-100 text-purple-700 border-purple-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    return_requested: "bg-orange-100 text-orange-700 border-orange-200",
    returned: "bg-slate-200 text-slate-800 border-slate-300",
  };

  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${colors[status]}`}>
      {statusLabel(status)}
    </span>
  );
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
    void loadOrders();
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

  const exportOrders = () => {
    if (orders.length === 0) return;

    const headers = ["Order ID", "Date", "Customer", "Email", "Phone", "Amount", "Payment", "Status", "Shiprocket ID"];
    const rows = orders.map(o => [
      o.invoiceNumber || o.id,
      o.createdAt?.toDate ? new Date(o.createdAt.toDate()).toLocaleDateString() : new Date(o.createdAt).toLocaleDateString(),
      o.customerName,
      o.email,
      o.phone,
      o.total,
      o.paymentMethod || 'COD',
      o.status,
      o.shiprocketOrderId || ''
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(value => {
        const str = String(value ?? "");
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `baaqir-orders-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track all customer orders from here.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadOrders()}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={exportOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            <Download size={18} />
            Export Orders
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatusFilterCard label="Total" count={orders.length} active={statusFilter === ""} onClick={() => setStatusFilter("")} color="slate" />
        <StatusFilterCard label="New" count={orders.filter(o => o.status === "pending").length} active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} color="amber" />
        <StatusFilterCard label="Ready" count={orders.filter(o => o.status === "packed").length} active={statusFilter === "packed"} onClick={() => setStatusFilter("packed")} color="sky" />
        <StatusFilterCard label="Shipped" count={orders.filter(o => o.status === "shipped").length} active={statusFilter === "shipped"} onClick={() => setStatusFilter("shipped")} color="indigo" />
        <StatusFilterCard label="Delivered" count={orders.filter(o => o.status === "delivered").length} active={statusFilter === "delivered"} onClick={() => setStatusFilter("delivered")} color="emerald" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Customer, Phone..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">
               <Filter size={14} />
               Filter
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
               Showing {pagedOrders.length} of {orders.length}
             </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shiprocket</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-10 bg-slate-100 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : pagedOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">No orders found matching your criteria.</td></tr>
              ) : (
                pagedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-slate-900">#{order.invoiceNumber || order.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] text-slate-400 font-bold mt-1">
                          {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{order.customerName}</span>
                        <span className="text-xs text-slate-500">{order.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">₹{order.total?.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{order.paymentMethod || 'COD'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       {order.shiprocketOrderId ? (
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-sky-50 text-sky-700 rounded-lg border border-sky-100 w-fit">
                           <Truck size={12} />
                           <span className="text-[10px] font-bold uppercase">Synced</span>
                         </div>
                       ) : (
                         <span className="text-[10px] font-bold text-slate-300 uppercase italic">Not Synced</span>
                       )}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setActionStatus(order.status);
                          setInvoiceError("");
                          setInvoiceSuccess("");
                        }}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-500">Page {page} of {Math.ceil(orders.length / PAGE_SIZE) || 1}</p>
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
                disabled={page * PAGE_SIZE >= orders.length}
                className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors"
             >
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </div>

      {/* Order Detail Overlay/Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
           <div className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
                   <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">#{selectedOrder.invoiceNumber || selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <XCircle size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                 {/* Top Status & Quick Actions */}
                 <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                    <div className="flex gap-4">
                       <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                          <Package size={32} />
                       </div>
                       <div>
                          <div className="flex items-center gap-3">
                             <StatusBadge status={selectedOrder.status} />
                             {selectedOrder.shiprocketOrderId && (
                               <span className="flex items-center gap-1 text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                                 <Truck size={10} /> SHIPROCKET SYNCED
                               </span>
                             )}
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{selectedOrder.total?.toLocaleString('en-IN')}</h3>
                          <p className="text-xs text-slate-500 font-medium">Placed on {selectedOrder.createdAt?.toDate ? new Date(selectedOrder.createdAt.toDate()).toLocaleString() : new Date(selectedOrder.createdAt).toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                       <button onClick={() => downloadShippingLabel(selectedOrder)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                          <Truck size={16} /> Label
                       </button>
                       {selectedOrder.invoiceUrl ? (
                         <>
                           <button onClick={() => downloadInvoice(selectedOrder)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                              <FileText size={16} /> Invoice
                           </button>
                           <button onClick={() => resendInvoiceEmail(selectedOrder)} className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors">
                              <Mail size={20} />
                           </button>
                         </>
                       ) : (
                         <button onClick={() => generateInvoice(selectedOrder)} disabled={invoiceLoading} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50">
                            <FileText size={16} /> {invoiceLoading ? "Generating..." : "Generate Invoice"}
                         </button>
                       )}
                    </div>
                 </div>

                 {invoiceError && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-3 animate-in shake duration-300"><XCircle size={18} /> {invoiceError}</div>}
                 {invoiceSuccess && <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2"><CheckCircle2 size={18} /> {invoiceSuccess}</div>}

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Customer & Items */}
                    <div className="lg:col-span-2 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Details</h4>
                             <p className="text-lg font-bold text-slate-900">{selectedOrder.customerName}</p>
                             <p className="text-sm text-slate-600 mt-1">{selectedOrder.phone}</p>
                             <p className="text-sm text-slate-600">{selectedOrder.email}</p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Shipping Address</h4>
                             <p className="text-sm font-semibold text-slate-900 leading-relaxed">{selectedOrder.shipping.address}</p>
                             <p className="text-sm text-slate-600 mt-1">{selectedOrder.shipping.city}, {selectedOrder.shipping.state} - {selectedOrder.shipping.pincode}</p>
                          </div>
                       </div>

                       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Items</h4>
                          </div>
                          <div className="divide-y divide-slate-100">
                             {selectedOrder.cartItems.map((item: any, idx: number) => (
                               <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50/30 transition-colors">
                                  <div className="h-14 w-14 rounded-xl border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0">
                                     {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-full w-full p-3 text-slate-300" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                                     <p className="text-xs text-slate-500 mt-1 font-medium">SKU: {item.sku || 'N/A'} • Qty: {item.quantity}</p>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-sm font-bold text-slate-900">₹{item.price * item.quantity}</p>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">₹{item.price} each</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                          <div className="p-6 bg-slate-50/50 space-y-2">
                             <div className="flex justify-between text-xs font-bold text-slate-500"><span>Subtotal</span><span>₹{selectedOrder.subtotal?.toLocaleString()}</span></div>
                             <div className="flex justify-between text-xs font-bold text-slate-500"><span>Shipping</span><span>₹{selectedOrder.shippingCharge?.toLocaleString()}</span></div>
                             {selectedOrder.discount > 0 && <div className="flex justify-between text-xs font-bold text-rose-500"><span>Discount</span><span>-₹{selectedOrder.discount?.toLocaleString()}</span></div>}
                             <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200 mt-2"><span>Total</span><span>₹{selectedOrder.total?.toLocaleString()}</span></div>
                          </div>
                       </div>
                    </div>

                    {/* Right Col: Logistics & Status */}
                    <div className="space-y-6">
                       <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                          <h4 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Truck size={14} /> Logistics Panel</h4>

                          {selectedOrder.shiprocketOrderId ? (
                            <div className="space-y-4">
                               <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">SR Order ID</p>
                                  <p className="font-mono text-sm font-bold mt-1 text-sky-300">{selectedOrder.shiprocketOrderId}</p>
                               </div>
                               <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Shipment ID</p>
                                  <p className="font-mono text-sm font-bold mt-1">{selectedOrder.shiprocketShipmentId || "Pending..."}</p>
                               </div>
                               <button onClick={() => syncToShiprocket(selectedOrder)} disabled={shiprocketLoading} className="w-full py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                  <RefreshCw size={14} className={shiprocketLoading ? "animate-spin" : ""} /> Resync with Shiprocket
                               </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                               <p className="text-xs text-slate-400 leading-relaxed italic">Ready to fulfill? Syncing will send order data to Shiprocket and generate shipment details.</p>
                               <button onClick={() => syncToShiprocket(selectedOrder)} disabled={shiprocketLoading} className="w-full py-4 bg-sky-500 hover:bg-sky-400 transition-all rounded-2xl text-sm font-bold shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2">
                                  {shiprocketLoading ? <RefreshCw className="animate-spin" size={18} /> : <Truck size={18} />}
                                  {shiprocketLoading ? "Syncing..." : "Sync to Shiprocket"}
                               </button>
                            </div>
                          )}
                       </div>

                       <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6">
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Status Transition</h4>
                            <div className="grid grid-cols-1 gap-3">
                               <select
                                 value={actionStatus}
                                 onChange={(e) => setActionStatus(e.target.value as OrderStatus)}
                                 className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                               >
                                 {ORDER_STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                               </select>
                               <button onClick={() => updateOrder(selectedOrder, actionStatus)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                  Update Order Status
                               </button>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Internal Memo</h4>
                             <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add private notes here..."
                                className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none resize-none"
                             ></textarea>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function StatusFilterCard({ label, count, active, onClick, color }: any) {
  const colors: any = {
    slate: active ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
    amber: active ? "bg-amber-600 border-amber-600 text-white" : "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100",
    sky: active ? "bg-sky-600 border-sky-600 text-white" : "bg-sky-50 border-sky-100 text-sky-700 hover:bg-sky-100",
    indigo: active ? "bg-indigo-600 border-indigo-600 text-white" : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100",
    emerald: active ? "bg-emerald-600 border-emerald-600 text-white" : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100",
  };

  return (
    <button onClick={onClick} className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-1 shadow-sm ${colors[color]}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</span>
      <span className="text-xl font-bold">{count}</span>
    </button>
  );
}
