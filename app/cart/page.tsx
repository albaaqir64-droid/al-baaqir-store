"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCartItems, loadCartItems, removeCartItem, updateCartItemQty, clearCart } from "../lib/cart";

export default function Page() {
  const [items, setItems] = useState<ReturnType<typeof getCartItems>>([]);
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

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);

  function updateQty(id: string, qty: number) {
    const next = updateCartItemQty(id, qty);
    setItems(next);
  }

  function removeItem(id: string) {
    const next = removeCartItem(id);
    setItems(next);
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Cart</h1>
            <p className="mt-2 text-slate-600">Review your order and proceed to checkout.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold">Continue shopping</Link>
            <button onClick={() => { clearCart(); setItems([]); }} className="rounded-full border border-rose-500 px-5 py-3 text-sm font-semibold text-rose-600">Clear cart</button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-medium">Your cart is empty.</p>
            <p className="mt-3 text-slate-600">Add products from the store to continue.</p>
            <Link href="/" className="mt-6 inline-flex rounded-full bg-emerald px-6 py-3 text-white">Shop now</Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <section className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex gap-4">
                    <img src={item.image} alt={item.name} className="h-28 w-28 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <Link href={item.productUrl} className="text-lg font-semibold text-slate-950 hover:underline">{item.name}</Link>
                      <p className="mt-2 text-sm text-slate-600">{item.qty} × {item.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="rounded-full border border-gray-200 px-3 py-1">−</button>
                        <span className="w-10 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="rounded-full border border-gray-200 px-3 py-1">+</button>
                        <button onClick={() => removeItem(item.id)} className="rounded-full border border-gray-200 px-3 py-1 text-rose-600">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <aside className="rounded-3xl border border-gray-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Order Summary</h2>
              <div className="mt-6 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-slate-600">
                    <span>{item.name} × {item.qty}</span>
                    <span>{(item.price * item.qty).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-gray-200 pt-4 text-lg font-semibold text-slate-950">
                Subtotal: {subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
              </div>
              <Link href="/checkout" className="mt-6 block w-full rounded-full bg-emerald px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald/20">Proceed to Checkout</Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
