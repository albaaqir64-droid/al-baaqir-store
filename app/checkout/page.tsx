/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartItem, clearCart, loadCartItems } from "../lib/cart";
import { generateInvoiceNumber } from "../lib/orders";
import { getCurrentUserId, saveCustomerContact } from "../lib/auth";
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

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const loaded = await loadCartItems();
      if (!active) return;
      setItems(loaded);
    })();
    return () => {
      active = false;
    };
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items]
  );

  function formatINR(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

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

    const shippingCharge = total >= 10000 ? 0 : 240;
    const orderTotal = Number(total) + shippingCharge;
    const invoiceNumber = generateInvoiceNumber();

    const orderMeta = {
      customerName: String(form.fullName.trim()),
      phone: String(form.mobile.trim()),
      email: String(form.email.trim()),
      customerGSTIN: String(form.customerGSTIN.trim().toUpperCase()),
      paymentMethod: String(form.paymentMethod),
      subtotal: Number(total) || 0,
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
    <main className="min-h-screen brand-page text-slate-900 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Checkout</h1>
            <p className="mt-2 text-slate-600">Complete your shipping details and confirm your order.</p>
          </div>
          <Link href="/cart" className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
            Back to cart
          </Link>
        </div>

        {submitted && (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
            <h2 className="text-xl font-semibold">Order placed successfully!</h2>
            <p className="mt-2 text-sm text-emerald-900/90">Your order request has been received. We will contact you shortly to confirm shipping and payment.</p>
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[1.75fr_1fr]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-emerald-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Shipping information</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-900">Full Name *</label>
                  <input
                    value={form.fullName}
                    onChange={(event) => handleInput("fullName", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="mt-2 text-sm text-rose-600">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900">Mobile Number *</label>
                  <input
                    value={form.mobile}
                    onChange={(event) => handleInput("mobile", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                  />
                  {errors.mobile && <p className="mt-2 text-sm text-rose-600">{errors.mobile}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-900">Email (optional)</label>
                  <input
                    value={form.email}
                    onChange={(event) => handleInput("email", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                    placeholder="you@example.com"
                    type="email"
                  />
                  {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-900">GSTIN (optional)</label>
                  <input
                    value={form.customerGSTIN}
                    onChange={(event) => handleInput("customerGSTIN", event.target.value.toUpperCase())}
                    className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                    placeholder="15-character GSTIN"
                    maxLength={15}
                  />
                  {errors.customerGSTIN && <p className="mt-2 text-sm text-rose-600">{errors.customerGSTIN}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900">House / Flat No. *</label>
                  <input
                    value={form.house}
                    onChange={(event) => handleInput("house", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                    placeholder="e.g. 402B"
                  />
                  {errors.house && <p className="mt-2 text-sm text-rose-600">{errors.house}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900">Street / Area *</label>
                  <input
                    value={form.street}
                    onChange={(event) => handleInput("street", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                    placeholder="e.g. Jubilee Hills"
                  />
                  {errors.street && <p className="mt-2 text-sm text-rose-600">{errors.street}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-900">Landmark (optional)</label>
                  <input
                    value={form.landmark}
                    onChange={(event) => handleInput("landmark", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                    placeholder="e.g. Near the temple"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900">Pincode *</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={form.pincode}
                      onChange={(event) => handleInput("pincode", event.target.value)}
                      className="flex-1 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                      placeholder="e.g. 500081"
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      onClick={() => void checkPincode()}
                      className="rounded-2xl bg-emerald px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={pincodeLoading}
                    >
                      {pincodeLoading ? "Checking…" : "Auto-fill"}
                    </button>
                  </div>
                  {errors.pincode && <p className="mt-2 text-sm text-rose-600">{errors.pincode}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900">City *</label>
                  <input
                    value={form.city}
                    onChange={(event) => handleInput("city", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                    placeholder="e.g. Hyderabad"
                  />
                  {errors.city && <p className="mt-2 text-sm text-rose-600">{errors.city}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900">State *</label>
                  <input
                    value={form.state}
                    onChange={(event) => handleInput("state", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
                    placeholder="e.g. Telangana"
                  />
                  {errors.state && <p className="mt-2 text-sm text-rose-600">{errors.state}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Payment method</h2>
              <div className="mt-6 space-y-4">
                <label className="flex items-center gap-3 rounded-3xl border border-emerald/20 bg-white p-4 text-sm transition hover:border-emerald/40">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={form.paymentMethod === "cod"}
                    onChange={() => handleInput("paymentMethod", "cod")}
                    className="h-4 w-4 text-emerald focus:ring-emerald"
                  />
                  <div>
                    <div className="font-semibold text-slate-950">Cash on Delivery</div>
                    <div className="mt-1 text-slate-600">Pay when your order arrives.</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-slate-100 p-4 text-sm text-slate-500">
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={form.paymentMethod === "online"}
                    onChange={() => handleInput("paymentMethod", "online")}
                    disabled
                    className="h-4 w-4 text-emerald focus:ring-emerald"
                  />
                  <div>
                    <div className="font-semibold">Online Payment</div>
                    <div className="mt-1 text-slate-500">Coming soon. Select Cash on Delivery for now.</div>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-emerald-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Order summary</h2>
                  <p className="mt-1 text-sm text-slate-600">Review the items you are about to order.</p>
                </div>
                <div className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">{items.length} item{items.length === 1 ? "" : "s"}</div>
              </div>

              <div className="mt-6 space-y-4">
                {items.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-6 text-sm text-slate-600">
                    Your cart is empty. Add items from the store to continue.
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4 rounded-3xl border border-emerald-200 bg-white p-4">
                      <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-950">{item.name}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span>Qty {item.qty}</span>
                          <span>•</span>
                          <span>{formatINR(item.price)}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-slate-900">{formatINR(item.price * item.qty)}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 space-y-3 rounded-3xl bg-white p-4 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatINR(total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>{total >= 10000 ? "Free" : "₹240"}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-950">
                  <span>Total</span>
                  <span>{formatINR(total >= 10000 ? total : total + 240)}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                className="mt-4 w-full rounded-full bg-emerald px-6 py-4 text-base font-semibold text-emerald-900 shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting || !items.length}
              >
                {submitting ? "Placing order..." : "Place Order"}
              </button>

              {saveError && <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveError}</p>}
              {errors.cart && <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errors.cart}</p>}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
