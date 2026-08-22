"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCartItems, loadCartItems, removeCartItem, updateCartItemQty, clearCart } from "../lib/cart";
import { fetchProductById } from "../lib/products";

import { formatCurrency, sanitizeText } from "../lib/utils";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Page() {
  const [items, setItems] = useState<ReturnType<typeof getCartItems>>([]);
  const [stockMessage, setStockMessage] = useState("");
  useEffect(() => {
    let active = true;
    const fetchItems = async () => {
      try {
        const loaded = await loadCartItems();
        if (active) setItems(loaded || []);
      } catch (err) {
        console.error("Cart load error:", err);
        // Fallback to local items if firestore fails
        if (active) setItems(getCartItems());
      }
    };
    fetchItems();
    return () => {
      active = false;
    };
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);

  async function updateQty(id: string, qty: number) {
    const product = await fetchProductById(id);
    const available = Math.max(0, Number(product?.stock ?? 0));
    if (qty > available) {
      setStockMessage(`Only ${available} item${available === 1 ? "" : "s"} are available.`);
      return;
    }
    setStockMessage("");
    const next = updateCartItemQty(id, qty);
    setItems(next);
  }

  function removeItem(id: string) {
    const next = removeCartItem(id);
    setItems(next);
  }

  return (
    <div className="min-h-screen bg-white selection:bg-emerald-500 selection:text-slate-900">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Your Bag</h1>
          <p className="mt-4 text-lg text-slate-600">Review your curated essentials.</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[40px] bg-emerald-50 p-16 text-center border border-emerald-100">
            <h2 className="text-2xl font-bold text-slate-900">Your bag is empty</h2>
            <p className="mt-4 text-slate-600">Discover something new and build your collection.</p>
            <Link href="/" className="mt-8 inline-block rounded-full bg-emerald-500 px-8 py-4 text-[15px] font-bold text-slate-900 transition-all hover:bg-orange-500 hover:text-white hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            <section className="space-y-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-6 border-b border-slate-100 pb-8">
                  <div className="relative aspect-square w-32 overflow-hidden rounded-2xl bg-[#F5F5F7]">
                    <img
                      src={item.image || '/images/products/placeholder.svg'}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/products/placeholder.svg'; }}
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={item.productUrl} className="text-xl font-bold text-slate-900 hover:opacity-70 transition-opacity">
                          {sanitizeText(item.name)}
                        </Link>
                        {item.hsnSac && (
                          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{item.hsnSac}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-slate-900">{formatCurrency(item.price * item.qty)}</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-slate-200 p-1">
                        <button
                          onClick={() => void updateQty(item.id, item.qty - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-sm font-bold">{item.qty}</span>
                        <button
                          onClick={() => void updateQty(item.id, item.qty + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <button
                  onClick={() => { clearCart(); setItems([]); }}
                  className="text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Clear all items
                </button>
              </div>
            </section>

            <aside>
              <div className="sticky top-24 rounded-[32px] bg-emerald-50 p-8 border border-emerald-100">
                <h2 className="text-2xl font-bold text-slate-900">Summary</h2>

                <div className="mt-8 space-y-4">
                  <div className="flex justify-between text-[15px] font-medium text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[15px] font-medium text-slate-600">
                    <span>Shipping</span>
                    <span className="text-emerald-600 font-bold uppercase tracking-widest text-[11px]">
                      {subtotal >= 10000 ? 'FREE' : 'Calculated at next step'}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-emerald-200 pt-4 flex justify-between text-xl font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-8 block w-full rounded-full bg-emerald-500 py-4 text-center text-[15px] font-bold text-slate-900 transition-all hover:bg-orange-500 hover:text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                >
                  Checkout
                </Link>

                {stockMessage && (
                  <p className="mt-4 text-center text-sm font-medium text-rose-600">{stockMessage}</p>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
