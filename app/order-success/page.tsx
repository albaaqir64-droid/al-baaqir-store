"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchOrderById, OrderRecord } from "../lib/orders";
import { readApiJson } from "../lib/api/client";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatCurrency, sanitizeText } from "../lib/utils";

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
      <div className="min-h-screen bg-[#faf8f4] text-[#151515]">
        <Header />
        <main className="mx-auto max-w-[1200px] px-5 py-24">
          <div className="border border-[#e8e2d9] bg-white p-12 text-center h-[400px] flex flex-col items-center justify-center">
             <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#faf8f4] text-[#151515]">
        <Header />
        <main className="mx-auto max-w-[1200px] px-5 py-24">
          <div className="border border-[#e8e2d9] bg-white p-12 text-center">
            <h1 className="text-2xl serif font-medium">Unable to load order</h1>
            <p className="mt-4 text-[#777]">{error || "Please check your order link and try again."}</p>
            <Link href="/" className="luxury-button inline-block mt-8 uppercase text-[12px]">
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#151515]">
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="mb-12">
          <div className="eyebrow">Confirmation</div>
          <h1 className="text-[34px] md:text-[42px] serif font-medium mt-2">Thank you, {order.customerName.split(' ')[0]}.</h1>
          <p className="mt-4 text-[#777] max-w-[600px]">Your order has been received and is being processed. A confirmation email and tracking details will be sent shortly.</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-12">
            <div className="border border-[#e8e2d9] bg-white p-8">
              <h2 className="text-[25px] serif font-medium border-b border-[#e8e2d9] pb-4 mb-8">Order Details</h2>

              <div className="grid gap-8 sm:grid-cols-2 mb-12">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mb-1">Order ID</h4>
                  <p className="font-bold text-[#151515]">#{order.invoiceNumber || order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mb-1">Payment Method</h4>
                  <p className="font-bold text-[#151515] uppercase tracking-wider text-[12px]">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid Online"}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mb-1">Customer</h4>
                  <p className="font-bold text-[#151515]">{order.customerName}</p>
                  <p className="text-[13px] text-[#777]">{order.phone}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#888] mb-1">Shipping Address</h4>
                  <p className="text-[13px] font-medium text-[#151515] leading-relaxed">
                    {order.shipping.address}<br />
                    {order.shipping.city}, {order.shipping.state} {order.shipping.pincode}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#151515] mb-4">Items Ordered</h4>
                {order.cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b border-[#f0f0f0] pb-4 last:border-0">
                    <div className="h-20 w-20 bg-[#eee] overflow-hidden">
                      <img
                        src={item.image || '/images/products/placeholder.svg'}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/products/placeholder.svg'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#151515]">{sanitizeText(item.name)}</p>
                      <p className="text-[12px] text-[#888]">Quantity {item.quantity}</p>
                    </div>
                    <p className="font-bold text-[#151515]">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-8">
            <div className="border border-[#e8e2d9] bg-white p-8">
              <h2 className="text-[25px] serif font-medium border-b border-[#e8e2d9] pb-4 mb-6">Summary</h2>
              <div className="space-y-4 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[#777]">Subtotal</span>
                  <span className="font-bold">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777]">Shipping</span>
                  <span className="text-brand-green font-bold uppercase text-[11px] tracking-widest">
                    {order.shippingCharge === 0 ? "FREE" : formatCurrency(order.shippingCharge)}
                  </span>
                </div>
                {order.discount > 0 && (
                   <div className="flex justify-between text-brand-green font-bold">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[19px] font-bold pt-4 border-t border-[#e8e2d9]">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>

              <div className="mt-10">
                {invoiceError && (
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-rose-600">{invoiceError}</p>
                )}
                {invoiceUrl ? (
                  <button
                    onClick={downloadInvoice}
                    className="w-full bg-[#111] text-white py-4 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#333]"
                  >
                    Download Invoice
                  </button>
                ) : (
                  <button
                    onClick={generateInvoice}
                    disabled={generatingInvoice}
                    className="w-full bg-[#111] text-white py-4 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#333] disabled:opacity-50"
                  >
                    {generatingInvoice ? "Generating..." : "Generate Invoice"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Link href="/account/orders" className="luxury-button text-center uppercase text-[12px]">
                View My Orders
              </Link>
              <Link href="/" className="w-full border border-[#111] text-[#111] text-center py-4 text-[12px] font-bold uppercase tracking-widest hover:bg-[#faf8f4] transition-colors">
                Back to Home
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
        </div>
      }
    >
      <OrderSuccessPageContent />
    </Suspense>
  );
}
