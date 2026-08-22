"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchOrderById, OrderRecord } from "../lib/orders";
import { readApiJson } from "../lib/api/client";
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

    const safeOrderId = orderId.trim();

    async function loadOrder(id: string) {
      setLoading(true);
      setError("");
      try {
        const fetched = await fetchOrderById(id);
        if (!fetched) {
          setError("Order not found.");
        } else {
          setOrder(fetched);
          if (fetched.invoiceUrl) {
            setInvoiceUrl(fetched.invoiceUrl);
          }
        }
      } catch (err) {
        console.error("Failed to load order", err);
        setError("Unable to load your order. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadOrder(safeOrderId);
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

      const parsed = await readApiJson<{ error?: string; invoiceUrl?: string; invoiceNumber?: string }>(response);
      if (!parsed.ok) {
        setInvoiceError(parsed.error || "Failed to generate invoice");
        return;
      }

      const data = parsed.data;
      if (!data?.invoiceUrl) {
        setInvoiceError("Invoice was generated but no download link was returned.");
        return;
      }

      setInvoiceUrl(data.invoiceUrl);
      if (order) {
        setOrder({
          ...order,
          invoiceNumber: data.invoiceNumber || order.invoiceNumber,
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
        <div className="mx-auto max-w-3xl rounded-[40px] border border-emerald-100 bg-emerald-50/30 p-12 shadow-sm">
          <div className="h-72 animate-pulse rounded-[32px] bg-emerald-100/50" />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-white px-6 py-24 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-[40px] border border-emerald-100 bg-emerald-50 p-12 text-center">
          <h1 className="text-2xl font-bold">Unable to load order</h1>
          <p className="mt-4 text-slate-600">{error || "Please check your order link and try again."}</p>
          <Link href="/" className="mt-8 inline-flex rounded-full bg-emerald-500 px-8 py-4 text-[15px] font-bold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:bg-orange-500 hover:text-white hover:scale-105">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white selection:bg-emerald-500 selection:text-slate-900 px-6 py-20">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[40px] border border-emerald-100 bg-emerald-50 p-10 shadow-lg shadow-emerald-500/5">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-700">Order Placed Successfully</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Thank you, {order.customerName}.</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">Your order has been received and is being processed. We&apos;ll notify you when it&apos;s on its way.</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[32px] border border-emerald-200/50 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Order ID</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{order.id.toUpperCase()}</p>
            </div>
            <div className="rounded-[32px] border border-emerald-200/50 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Invoice Number</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{order.invoiceNumber || 'Pending'}</p>
            </div>
          </div>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8 rounded-[40px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
                <p className="mt-1 text-slate-500">A summary of your purchase.</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid Online"}
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-[24px] border border-slate-100 bg-slate-50/50 p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Customer</p>
                <p className="mt-2 font-bold text-slate-900">{order.customerName}</p>
                <p className="mt-1 text-sm text-slate-500">{order.phone}</p>
              </div>
              <div className="rounded-[24px] border border-slate-100 bg-slate-50/50 p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Delivery Address</p>
                <p className="mt-2 text-sm font-medium text-slate-900 leading-relaxed">
                  {order.shipping.address}<br />
                  {order.shipping.city}, {order.shipping.state} {order.shipping.pincode}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Items</h3>
              <div className="space-y-3">
                {order.cartItems.map((item) => (
                  <div key={item.id} className="group flex items-center gap-4 rounded-[24px] border border-slate-100 bg-white p-4 transition-all hover:border-emerald-200">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-emerald-50">
                      <img
                        src={item.image || '/images/products/placeholder.svg'}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/products/placeholder.svg'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">Qty {item.quantity}</p>
                    </div>
                    <p className="font-bold text-slate-900">₹{item.price.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[40px] bg-emerald-50 p-8 border border-emerald-100 shadow-lg shadow-emerald-500/5">
              <h2 className="text-2xl font-bold text-slate-900">Summary</h2>
              <div className="mt-8 space-y-4">
                <div className="flex justify-between text-[15px] font-medium text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[15px] font-medium text-slate-600">
                  <span>Shipping</span>
                  <span className="text-emerald-700 font-bold uppercase tracking-widest text-[11px]">
                    {order.shippingCharge === 0 ? "FREE" : `₹${order.shippingCharge.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="mt-4 border-t border-emerald-200 pt-4 flex justify-between text-xl font-bold text-slate-900">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Invoice Section */}
              <div className="mt-12 pt-8 border-t border-emerald-200">
                {invoiceError && (
                  <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-600 border border-rose-100">
                    {invoiceError}
                  </div>
                )}
                {invoiceUrl ? (
                  <button
                    onClick={downloadInvoice}
                    className="w-full rounded-full bg-emerald-500 py-4 text-[15px] font-bold text-slate-900 shadow-md shadow-emerald-500/10 transition-all hover:bg-orange-500 hover:text-white"
                  >
                    Download Invoice
                  </button>
                ) : (
                  <button
                    onClick={generateInvoice}
                    disabled={generatingInvoice}
                    className="w-full rounded-full bg-emerald-500 py-4 text-[15px] font-bold text-slate-900 shadow-md shadow-emerald-500/10 transition-all hover:bg-orange-500 hover:text-white disabled:opacity-50"
                  >
                    {generatingInvoice ? "Generating..." : "Generate Invoice"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Link href="/account/orders" className="flex w-full items-center justify-center rounded-full bg-slate-900 py-4 text-[15px] font-bold text-white transition-all hover:bg-slate-800">
                View My Orders
              </Link>
              <Link href="/" className="flex w-full items-center justify-center rounded-full border border-emerald-200 bg-white py-4 text-[15px] font-bold text-slate-900 transition-all hover:bg-emerald-50">
                Back to Home
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
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-200 bg-slate-50 p-12 shadow-lg">
            <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </main>
      }
    >
      <OrderSuccessPageContent />
    </Suspense>
  );
}
