"use client";

import { useEffect, useState } from "react";
import { fetchOrders, OrderRecord, OrderStatus } from "../../lib/orders";
import { OrderTimeline } from "../../components/OrderTimeline";
import { getCustomerContact } from "../../lib/auth";
import { useAuth } from "../../hooks/useAuth";
import CustomerGuard from "../../components/CustomerGuard";
import Link from "next/link";

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

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders(identifier?: { phone?: string; customerId?: string; email?: string }) {
    setLoading(true);
    const results = identifier ? await fetchOrders(identifier) : [];
    setOrders(results);
    setLoading(false);
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
      <main className="min-h-screen brand-page px-6 py-20">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-sm">
            <h1 className="text-4xl font-semibold text-emerald-900">My Orders</h1>
            <p className="mt-3 text-emerald-900/60">Track your order history and view live delivery status.</p>
          </header>

          {loading || authLoading ? (
            <div className="rounded-3xl border border-emerald-100 bg-white p-8">
              <div className="h-4 w-3/4 rounded-full bg-emerald-50 animate-pulse" />
              <div className="mt-3 h-4 w-1/2 rounded-full bg-emerald-50 animate-pulse" />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-emerald-900/60">
              <p className="text-lg">No orders found.</p>
              <Link href="/" className="mt-6 inline-flex rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-emerald-900 shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 hover:text-white">
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-600">Order #{order.invoiceNumber}</p>
                      <h2 className="mt-2 text-2xl font-semibold text-emerald-900">₹{order.total}</h2>
                    </div>
                    <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900">{statusLabel(order.status)}</div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                    <div className="rounded-3xl border border-emerald-50 bg-slate-50 p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-emerald-900/40 font-medium uppercase tracking-wider">Ordered on</p>
                          <p className="mt-1 font-semibold text-emerald-900">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-emerald-900/40 font-medium uppercase tracking-wider">Delivery estimate</p>
                          <p className="mt-1 font-semibold text-emerald-900">3-5 business days</p>
                        </div>
                      </div>
                    </div>

                    <OrderTimeline current={order.status} />
                  </div>

                  <div className="mt-6 rounded-3xl border border-emerald-50 bg-slate-50 p-5">
                    <h3 className="text-lg font-semibold text-emerald-900">Items</h3>
                    <div className="mt-4 space-y-3">
                      {order.cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-white p-4">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400 italic">No image</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-emerald-900">{item.name}</div>
                            <div className="mt-1 text-sm text-emerald-900/60">Qty {item.quantity}</div>
                          </div>
                          <div className="text-sm font-semibold text-emerald-900">₹{item.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </CustomerGuard>
  );
}
