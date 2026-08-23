/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartItem, clearCart, loadCartItems } from "../lib/cart";
import { generateInvoiceNumber } from "../lib/orders";
import { getCurrentUserId, saveCustomerContact } from "../lib/auth";
import { useAuth } from "../hooks/useAuth";
import { fetchPincodeLocation } from "../lib/pincode";
import { sanitizeCartItems, sanitizeFirestoreData, sanitizeShipping } from "../lib/firestore";
import { requestOrderStatusNotifications } from "../lib/pushNotifications";
import { readApiJson } from "../lib/api/client";

const defaultForm = {
  fullName: "",
  mobile: "",
  email: "",
  customerGSTIN: "",
  house: "",
  street: "",
  landmark: "",
  pincode: "",
  city: "",
  state: "",
  paymentMethod: "cod",
};

import { formatCurrency, sanitizeText } from "../lib/utils";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CheckoutPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchItems = async () => {
      try {
        const loaded = await loadCartItems();
        if (active) setItems(loaded || []);
      } catch (err) {
        console.error("Checkout load error:", err);
      }
    };
    fetchItems();
    return () => {
      active = false;
    };
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items]
  );

  const onlineDiscount = useMemo(() => {
    if (form.paymentMethod === 'online') {
      return Math.round(total * 0.10); // 10% Discount
    }
    return 0;
  }, [total, form.paymentMethod]);

  const finalTotal = total - onlineDiscount;


  function validateOrderPayload(order: any) {
    if (!order || typeof order !== 'object') return false;
    if (!Array.isArray(order.cartItems) || order.cartItems.length === 0) return false;
    return order.cartItems.every((item: any) =>
      item &&
      typeof item.id === 'string' &&
      item.id.length > 0 &&
      typeof item.name === 'string' &&
      item.name.length > 0 &&
      typeof item.price === 'number' &&
      !Number.isNaN(item.price) &&
      typeof item.quantity === 'number' &&
      !Number.isNaN(item.quantity) &&
      typeof item.image === 'string'
    );
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!/^[6-9][0-9]{9}$/.test(form.mobile)) nextErrors.mobile = "Enter a valid 10-digit mobile number.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (form.customerGSTIN && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(form.customerGSTIN.trim())) nextErrors.customerGSTIN = "Enter a valid 15-character GSTIN.";
    if (!form.house.trim()) nextErrors.house = "House / flat number is required.";
    if (!form.street.trim()) nextErrors.street = "Street / area is required.";
    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) nextErrors.pincode = "Enter a valid 6-digit pincode.";
    if (!form.city.trim()) nextErrors.city = "City is required.";
    if (!form.state.trim()) nextErrors.state = "State is required.";
    if (!items.length) nextErrors.cart = "Your cart is empty. Add items before placing an order.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleInput(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function checkPincode() {
    if (!/^[1-9][0-9]{5}$/.test(form.pincode.trim())) {
      setErrors((current) => ({ ...current, pincode: "Enter a valid 6-digit pincode." }));
      return;
    }

    setPincodeLoading(true);
    setErrors((current) => ({ ...current, pincode: "" }));

    try {
      const location = await fetchPincodeLocation(form.pincode);
      setForm((current) => ({
        ...current,
        city: location.city,
        state: location.state,
      }));
    } catch {
      // Lookup is only a convenience. A correctly formatted pincode remains
      // valid for checkout and the customer can enter city/state themselves.
    } finally {
      setPincodeLoading(false);
    }
  }

  async function placeOrder() {
    if (!validate()) {
      setSubmitted(false);
      return;
    }

    setSubmitting(true);
    setSaveError("");

    const cartItems = sanitizeCartItems(items);
    const shipping = sanitizeShipping({
      name: form.fullName.trim(),
      phone: form.mobile.trim(),
      address: `${form.house.trim()}, ${form.street.trim()}`,
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    });

    const shippingCharge = 0;
    const orderTotal = Number(finalTotal) + shippingCharge;
    const invoiceNumber = generateInvoiceNumber();

    const orderMeta = {
      customerName: String(form.fullName.trim()),
      phone: String(form.mobile.trim()),
      email: String(form.email.trim()),
      customerGSTIN: String(form.customerGSTIN.trim().toUpperCase()),
      paymentMethod: String(form.paymentMethod),
      subtotal: Number(total) || 0,
      discount: onlineDiscount,
      shippingCharge,
      total: orderTotal,
      invoiceNumber,
      status: "pending",
      shipping,
      cartItems,
      customerId: getCurrentUserId() || "",
    };

    if (!validateOrderPayload(orderMeta)) {
      setSaveError('Unable to prepare your order. Please try again.');
      setSubmitting(false);
      return;
    }

    saveCustomerContact({ phone: orderMeta.phone, email: orderMeta.email });

    if (form.paymentMethod === 'online') {
      const amountPaise = Math.round(orderTotal * 100);
      const createRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: invoiceNumber }),
      });
      const createParsed = await readApiJson<{ order?: { amount: number; currency: string; id: string }; keyId?: string; error?: string }>(createRes);
      if (!createParsed.ok || !createParsed.data?.order || !createParsed.data?.keyId) {
        setSaveError(createParsed.error || 'Unable to initiate payment. Please try again later.');
        setSubmitting(false);
        return;
      }
      const razorpayOrder = createParsed.data.order;
      const razorpayKeyId = createParsed.data.keyId;

      if (typeof window !== 'undefined' && !(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(s);
        });
      }

      const rzpOptions: any = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Al Baaqir',
        description: `Order ${invoiceNumber}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.mobile,
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                orderMeta,
              }),
            });
            const verifyParsed = await readApiJson<{ orderId?: string; error?: string }>(verifyRes);
            if (!verifyParsed.ok || !verifyParsed.data?.orderId) {
              setSaveError(verifyParsed.error || 'Payment verification failed. Please contact support.');
              setSubmitting(false);
              return;
            }
            const verifiedOrderId = verifyParsed.data.orderId;

            clearCart();
            setItems([]);
            setSubmitted(true);
            setForm(defaultForm);
            setErrors({});

            window.location.href = `/order-success?orderId=${encodeURIComponent(verifiedOrderId)}`;
          } catch {
            setSaveError('Payment verification failed. Please contact support.');
          } finally {
            setSubmitting(false);
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
      return;
    }

    const payloadForSave = {
      customerName: String(orderMeta.customerName ?? ""),
      phone: String(orderMeta.phone ?? ""),
      email: String(orderMeta.email ?? ""),
      customerGSTIN: String(orderMeta.customerGSTIN ?? ""),
      customerId: String(orderMeta.customerId ?? ""),
      shipping: orderMeta.shipping,
      cartItems: cartItems,
      subtotal: Number(orderMeta.subtotal) || 0,
      discount: Number(orderMeta.discount) || 0,
      shippingCharge: Number(orderMeta.shippingCharge) || 0,
      total: Number(orderMeta.total) || 0,
      invoiceNumber: String(orderMeta.invoiceNumber ?? ""),
      status: String(orderMeta.status ?? "pending"),
      paymentMethod: String(orderMeta.paymentMethod ?? "cod"),
      paymentStatus: String(orderMeta.status ?? "pending"),
    };

    // Final guard for the entire document: removes undefined values at every
    // nested object level and converts undefined array entries to null before
    // the Firestore SDK sees the order payload.
    const firestoreOrder = sanitizeFirestoreData(payloadForSave);
    const orderResponse = await fetch("/api/orders/create", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(firestoreOrder),
    });
    const orderParsed = await readApiJson<{ orderId?: string; error?: string }>(orderResponse);
    if (!orderParsed.ok || !orderParsed.data?.orderId) {
      setSaveError(orderParsed.error || "Unable to create your order. Please try again.");
      setSubmitting(false);
      return;
    }
    const orderId = String(orderParsed.data.orderId);
    void requestOrderStatusNotifications();

    try {
      await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
    } catch (invoiceError) {
      console.warn('Invoice generation failed after order placement:', invoiceError);
    }

    clearCart();
    setItems([]);
    setSubmitted(true);
    setForm(defaultForm);
    setErrors({});

    window.location.href = `/order-success?orderId=${encodeURIComponent(orderId)}`;
    return;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-500 selection:text-slate-900">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Checkout</h1>
          <p className="mt-4 text-lg text-slate-600">Securely finalize your curated essentials.</p>
        </div>

        {submitted && (
          <div className="mb-8 rounded-[32px] bg-emerald-50 border border-emerald-100 p-8 text-emerald-900">
            <h2 className="text-xl font-bold">Order placed successfully!</h2>
            <p className="mt-2 text-sm text-emerald-700">Your order request has been received. We will contact you shortly to confirm shipping and payment.</p>
          </div>
        )}

        <div className="grid gap-16 lg:grid-cols-[1fr_420px]">
          <section className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Shipping Address</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-[13px] font-bold uppercase tracking-widest text-slate-900 block mb-3">Full Name</label>
                  <input
                    value={form.fullName}
                    onChange={(event) => handleInput("fullName", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Enter your name"
                  />
                  {errors.fullName && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="text-[13px] font-bold uppercase tracking-widest text-slate-900 block mb-3">Mobile</label>
                  <input
                    value={form.mobile}
                    onChange={(event) => handleInput("mobile", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="10-digit number"
                    inputMode="numeric"
                  />
                  {errors.mobile && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.mobile}</p>}
                </div>
                <div>
                  <label className="text-[13px] font-bold uppercase tracking-widest text-slate-900 block mb-3">Email</label>
                  <input
                    value={form.email}
                    onChange={(event) => handleInput("email", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[13px] font-bold uppercase tracking-widest text-slate-900 block mb-3">House / Street</label>
                  <div className="space-y-4">
                    <input
                      value={form.house}
                      onChange={(event) => handleInput("house", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      placeholder="House / Flat No."
                    />
                    <input
                      value={form.street}
                      onChange={(event) => handleInput("street", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      placeholder="Street / Area / Colony"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-bold uppercase tracking-widest text-slate-900 block mb-3">Pincode</label>
                  <div className="flex gap-2">
                    <input
                      value={form.pincode}
                      onChange={(event) => handleInput("pincode", event.target.value)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      placeholder="6-digit PIN"
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      onClick={() => void checkPincode()}
                      className="rounded-2xl bg-emerald-500 px-6 py-4 text-[13px] font-bold text-slate-900 shadow-sm transition-all hover:bg-orange-500 hover:text-white disabled:opacity-50"
                      disabled={pincodeLoading}
                    >
                      Check
                    </button>
                  </div>
                  {errors.pincode && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.pincode}</p>}
                </div>
                <div>
                  <label className="text-[13px] font-bold uppercase tracking-widest text-slate-900 block mb-3">City</label>
                  <input
                    value={form.city}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-[#F5F5F7] px-6 py-4 text-sm text-slate-500"
                    placeholder="Auto-filled"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Payment</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-4 rounded-[32px] border border-emerald-100 bg-emerald-50/30 p-8 cursor-pointer transition-all hover:border-emerald-500 group">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={form.paymentMethod === "cod"}
                    onChange={() => handleInput("paymentMethod", "cod")}
                    className="h-5 w-5 border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-[15px] font-bold text-slate-900">Cash on Delivery</span>
                    <p className="mt-1 text-sm text-slate-600">Securely pay in cash when your order is delivered to your doorstep.</p>
                  </div>
                </label>

                <label className="flex items-center gap-4 rounded-[32px] border border-slate-100 bg-white p-8 cursor-pointer transition-all hover:border-emerald-500 group">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={form.paymentMethod === "online"}
                    onChange={() => handleInput("paymentMethod", "online")}
                    className="h-5 w-5 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-[15px] font-bold text-slate-900">Online Payment</span>
                    <p className="mt-1 text-sm text-slate-600">Pay securely via Cards, UPI, or Netbanking using Razorpay.</p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <aside>
            <div className="sticky top-24 rounded-[32px] bg-emerald-50 p-8 border border-emerald-100">
              <h2 className="text-2xl font-bold text-slate-900">Order Summary</h2>

              <div className="mt-8 space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-white border border-emerald-100">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{sanitizeText(item.name)}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">Qty {item.qty}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4 border-t border-emerald-200 pt-8">
                <div className="flex justify-between text-[15px] font-medium text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {onlineDiscount > 0 && (
                  <div className="flex justify-between text-[15px] font-medium text-emerald-600">
                    <span>Online Payment Discount (10%)</span>
                    <span>-{formatCurrency(onlineDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[15px] font-medium text-slate-600">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-bold uppercase tracking-widest text-[11px]">Free</span>
                </div>
                <div className="mt-4 flex justify-between text-xl font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={submitting || !items.length}
                className="mt-8 w-full rounded-full bg-emerald-500 py-5 text-[15px] font-bold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:bg-orange-500 hover:text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Place Order"}
              </button>

              {saveError && <p className="mt-4 text-center text-xs font-semibold text-rose-600">{saveError}</p>}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
