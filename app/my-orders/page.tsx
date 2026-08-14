"use client";

import { useEffect, useState } from "react";
import { fetchOrders, OrderRecord, OrderStatus } from "../lib/orders";
import { OrderTimeline } from "../components/OrderTimeline";
import { getCustomerContact } from "../lib/auth";
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
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<{ phone: string; email?: string } | null>(null);

  async function loadOrders(phone?: string) {
    setLoading(true);
    const results = phone ? await fetchOrders({ phone }) : [];
    setOrders(results);
    setLoading(false);
  }

  useEffect(() => {
    const saved = getCustomerContact();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setContact(saved);
    loadOrders(saved?.phone);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[32px] border border-emerald/20 bg-slate-900/95 p-8 shadow-2xl shadow-emerald/10">
          <h1 className="text-4xl font-semibold">My Orders</h1>
          <p className="mt-3 text-slate-400">Track your order history and view live delivery status.</p>
        </header>

        {!contact ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-slate-300">
            <p className="text-lg">No customer contact saved yet.</p>
            <p className="mt-2">Place an order first, then visit this page to see your orders.</p>
            <Link href="/" className="mt-6 inline-flex rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-emerald-900 shadow-lg shadow-emerald/20 transition hover:bg-emerald-600 hover:text-white">
              Start shopping
            </Link>
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8">
            <div className="h-4 w-3/4 rounded-full bg-slate-700 animate-pulse" />
            <div className="mt-3 h-4 w-1/2 rounded-full bg-slate-700 animate-pulse" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-slate-300">
            <p className="text-lg">No orders found for {contact.phone}.</p>
            <Link href="/" className="mt-6 inline-flex rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-emerald-900 shadow-lg shadow-emerald/20 transition hover:bg-emerald-600 hover:text-white">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="rounded-[32px] border border-slate-800 bg-slate-900/95 p-6 shadow-xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-emerald-300">Order #{order.invoiceNumber}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">₹{order.total}</h2>
                  </div>
                  <div className="rounded-full border border-emerald/20 bg-slate-950 px-4 py-2 text-sm text-slate-300">{statusLabel(order.status)}</div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-400">Ordered on</p>
                        <p className="mt-1 text-white">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Delivery estimate</p>
                        <p className="mt-1 text-white">3-5 business days</p>
                      </div>
                    </div>
                  </div>

                  <OrderTimeline current={order.status} />
                </div>

                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <h3 className="text-lg font-semibold text-white">Items</h3>
                  <div className="mt-4 space-y-3">
                    {order.cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-4">
                        <div className="h-16 w-16 overflow-hidden rounded-3xl bg-slate-800">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.name}</div>
                          <div className="mt-1 text-sm text-slate-400">Qty {item.quantity}</div>
                        </div>
                        <div className="text-sm text-slate-300">₹{item.price}</div>
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
  );
}
