"use client";

import { useEffect, useState } from "react";
import { fetchOrders, OrderRecord, OrderStatus } from "../../lib/orders";
import { OrderTimeline } from "../../components/OrderTimeline";
import { getCustomerContact } from "../../lib/auth";
import { useAuth } from "../../hooks/useAuth";
import CustomerGuard from "../../components/CustomerGuard";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { formatCurrency } from "../../lib/utils";

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

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadOrders(identifier?: { phone?: string; customerId?: string; email?: string }) {
    setLoading(true);
    const results = identifier ? await fetchOrders(identifier) : [];
    setOrders(results);
    setLoading(false);
  }

  async function handleUpdateStatus(orderId: string, status: OrderStatus) {
    if (!confirm(`Are you sure you want to ${status.replace('_', ' ')} this order?`)) return;

    setActionLoading(orderId);
    try {
      const { updateOrderStatus } = await import("../../lib/orders");
      await updateOrderStatus(orderId, status);
      // Refresh orders
      if (user && !user.isAnonymous) {
        await loadOrders({ customerId: user.uid });
      } else {
        const saved = getCustomerContact();
        if (saved) await loadOrders({ phone: saved.phone });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    if (authLoading) return;

    if (user && !user.isAnonymous) {
      loadOrders({ customerId: user.uid });
    } else {
      const saved = getCustomerContact();
      if (saved) {
        loadOrders({ phone: saved.phone });
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  return (
    <CustomerGuard>
      <div className="min-h-screen bg-[#faf8f4] text-[#151515]">
        <Header />
        <main className="mx-auto max-w-[1200px] px-5 py-20">
          <div className="mb-12">
            <div className="eyebrow">Account</div>
            <h1 className="text-[34px] md:text-[42px] serif font-medium mt-2">My orders</h1>
            <p className="mt-4 text-[#777]">Track your order history and view live delivery status.</p>
          </div>

          {loading || authLoading ? (
            <div className="border border-[#e8e2d9] bg-white p-8">
              <div className="h-4 w-3/4 bg-[#eee] animate-pulse" />
              <div className="mt-4 h-4 w-1/2 bg-[#eee] animate-pulse" />
            </div>
          ) : orders.length === 0 ? (
            <div className="border border-[#e8e2d9] bg-white p-12 text-center">
              <p className="text-[#777] mb-8 text-lg">No orders found.</p>
              <Link href="/" className="luxury-button inline-block uppercase text-[12px]">
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {orders.map((order) => (
                <div key={order.id} className="border border-[#e8e2d9] bg-white p-6 md:p-8">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[#e8e2d9] pb-6 mb-8">
                    <div>
                      <div className="eyebrow text-[10px] mb-1">Order ID</div>
                      <p className="font-bold text-[#151515]">#{order.invoiceNumber}</p>
                    </div>
                    <div>
                      <div className="eyebrow text-[10px] mb-1 text-right">Amount</div>
                      <h2 className="text-2xl serif font-medium">{formatCurrency(order.total)}</h2>
                    </div>
                    <div>
                      <div className="px-4 py-2 bg-[#111] text-white text-[10px] font-bold uppercase tracking-widest">{statusLabel(order.status)}</div>
                    </div>
                  </div>

                  <div className="grid gap-12 lg:grid-cols-[1fr_350px]">
                    <div>
                      <div className="grid gap-6 sm:grid-cols-2 mb-8">
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mb-1">Ordered on</h4>
                          <p className="font-bold text-[#151515]">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : "-"}</p>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mb-1">Delivery estimate</h4>
                          <p className="font-bold text-[#151515]">3-5 business days</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#151515] mb-4">Items</h4>
                        {order.cartItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 border-b border-[#f0f0f0] pb-4">
                            <div className="h-16 w-16 bg-[#eee] overflow-hidden">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] italic">No image</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-[#151515]">{item.name}</div>
                              <div className="text-[12px] text-[#888]">Quantity {item.quantity}</div>
                            </div>
                            <div className="font-bold text-[#151515]">{formatCurrency(item.price)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#faf8f4] p-6 border border-[#e8e2d9]">
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#151515] mb-6">Live Status</h4>
                      <OrderTimeline current={order.status} />

                      <div className="mt-8 pt-6 border-t border-[#e8e2d9] space-y-3">
                        {/* Action Buttons */}
                        {(order.status === 'pending' || order.status === 'confirmed') && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            disabled={actionLoading === order.id}
                            className="w-full py-3 border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === order.id ? 'Processing...' : 'Cancel Order'}
                          </button>
                        )}

                        {order.status === 'delivered' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'return_requested')}
                            disabled={actionLoading === order.id}
                            className="w-full py-3 border border-[#151515] text-[#151515] text-[10px] font-bold uppercase tracking-widest hover:bg-[#151515] hover:text-white transition-colors disabled:opacity-50"
                          >
                            {actionLoading === order.id ? 'Processing...' : 'Request Return'}
                          </button>
                        )}

                        {(order.status === 'cancelled' || order.status === 'returned' || order.status === 'return_requested') && (
                          <div className="text-center py-2 px-4 bg-gray-100 text-[#777] text-[10px] font-bold uppercase tracking-widest">
                            No further actions available
                          </div>
                        )}

                        <Link
                          href={`https://wa.me/917041396464?text=Hi, I need help with my order #${order.invoiceNumber}`}
                          target="_blank"
                          className="block w-full py-3 text-center border border-[#e8e2d9] text-[#777] text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors"
                        >
                          Need Help? Contact Us
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </CustomerGuard>
  );
}
