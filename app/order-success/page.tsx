"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchOrderById, OrderRecord } from "../lib/orders";
import Link from "next/link";

function OrderSuccessPageContent() {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      router.replace("/");
      return;
    }

    const safeOrderId = orderId!;

    async function loadOrder() {
      setLoading(true);
      const fetched = await fetchOrderById(safeOrderId);
      if (!fetched) {
        setError("Order not found.");
      } else {
        setOrder(fetched);
        // Check if invoice already exists
        if (fetched.invoiceUrl) {
          setInvoiceUrl(fetched.invoiceUrl);
        }
      }
      setLoading(false);
    }

    loadOrder();
  }, [router, searchParams]);

  const generateInvoice = async () => {
    if (!order) return;
    
    setGeneratingInvoice(true);
    setInvoiceError("");
    
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

      setInvoiceUrl(data.invoiceUrl);
      // Update local order state
      if (order) {
        setOrder({
          ...order,
          invoiceNumber: data.invoiceNumber,
          invoiceUrl: data.invoiceUrl,
        });
      }
    } catch (err) {
      setInvoiceError("Failed to generate invoice. Please try again.");
      console.error("Invoice generation error:", err);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const downloadInvoice = () => {
    if (invoiceUrl) {
      const link = document.createElement("a");
      link.href = invoiceUrl;
      link.download = `invoice-${order?.invoiceNumber || order?.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-24 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-slate-50 p-12 shadow-lg">
          <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-white px-6 py-24 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-slate-50 p-12 shadow-lg text-center">
          <h1 className="text-2xl font-semibold">Unable to load order</h1>
          <p className="mt-4 text-slate-600">{error || "Please check your order link and try again."}</p>
          <Link href="/" className="mt-8 inline-flex rounded-full bg-emerald px-6 py-3 text-white shadow-lg shadow-emerald/20 transition hover:bg-emerald-600">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[32px] border border-emerald/20 bg-emerald-950/90 p-10 shadow-2xl shadow-emerald/20">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Order Placed Successfully</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Thank you, {order.customerName}.</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Your order has been received and is being processed. You can track status from your account.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald/20 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">Order ID</p>
              <p className="mt-2 text-xl font-semibold text-white">{order.id}</p>
            </div>
            <div className="rounded-3xl border border-emerald/20 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">Invoice</p>
              <p className="mt-2 text-xl font-semibold text-white">{order.invoiceNumber}</p>
            </div>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 rounded-[32px] border border-gray-800 bg-slate-900 p-8 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Order details</h2>
                <p className="mt-1 text-slate-400">A summary of your purchase and delivery details.</p>
              </div>
              <span className="rounded-full border border-emerald/20 bg-emerald-950/80 px-4 py-2 text-sm text-emerald-300">{order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">Customer</p>
                <p className="mt-2 text-lg font-semibold text-white">{order.customerName}</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">Phone</p>
                <p className="mt-2 text-lg font-semibold text-white">{order.phone}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-sm text-slate-400">Delivery Address</p>
              <p className="mt-3 text-slate-200">{order.shipping.address}</p>
              <p className="mt-2 text-slate-200">{order.shipping.city}, {order.shipping.state}, {order.shipping.pincode}</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
              <h3 className="text-lg font-semibold text-white">Products ordered</h3>
              <div className="mt-4 space-y-3">
                {order.cartItems.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-3xl bg-slate-800">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-400">Qty {item.quantity}</div>
                      </div>
                      <div className="text-right text-sm text-slate-300">₹{item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-emerald/20 bg-slate-900 p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white">Summary</h2>
              <div className="mt-6 space-y-4 text-sm text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>{order.shippingCharge === 0 ? "Free" : `₹${order.shippingCharge}`}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>Total</span>
                  <span>₹{order.total}</span>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-emerald/20 bg-emerald-950/70 p-4 text-slate-200">
                <p className="text-sm">Estimated delivery within 3-5 business days.</p>
              </div>

              {/* Invoice Section */}
              <div className="mt-6 space-y-3 border-t border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-white">Invoice</h3>
                {invoiceError && (
                  <div className="rounded-lg bg-red-950 p-3 text-sm text-red-200">
                    {invoiceError}
                  </div>
                )}
                {invoiceUrl ? (
                  <button
                    onClick={downloadInvoice}
                    className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    📄 Download Invoice
                  </button>
                ) : (
                  <button
                    onClick={generateInvoice}
                    disabled={generatingInvoice}
                    className="w-full rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600 disabled:opacity-50"
                  >
                    {generatingInvoice ? "Generating..." : "Generate Invoice"}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/my-orders" className="inline-flex w-full items-center justify-center rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald/20 transition hover:bg-emerald-600">
                My Orders
              </Link>
              <Link href="/" className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-gold/20 transition hover:bg-[#d4b229]">
                Continue Shopping
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-6 py-24 text-slate-900">
          <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-slate-50 p-12 shadow-lg">
            <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </main>
      }
    >
      <OrderSuccessPageContent />
    </Suspense>
  );
}
