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
    <div className="min-h-screen bg-[#faf8f4] text-[#151515]">
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="mb-12">
          <div className="eyebrow">Your Bag</div>
          <h1 className="text-[34px] md:text-[42px] serif font-medium mt-2">Shopping cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="bg-white p-12 text-center border border-[#e8e2d9]">
            <p className="text-[#777] mb-8">Your bag is empty. Add something beautiful.</p>
            <Link href="/" className="luxury-button inline-block uppercase text-[12px]">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
            <section className="space-y-0">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-[#e8e2d9] py-[14px] items-center">
                  <div className="relative aspect-square w-[65px] bg-[#eee] flex items-center justify-center">
                    <img
                      src={item.image || '/images/products/placeholder.svg'}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/products/placeholder.svg'; }}
                    />
                  </div>

                  <div className="flex flex-1 justify-between items-center">
                    <div>
                      <Link href={item.productUrl} className="font-bold text-[#151515] hover:text-brand-gold transition-colors">
                        {sanitizeText(item.name)}
                      </Link>
                      <div className="text-[14px] text-[#151515] mt-1">{formatCurrency(item.price)}</div>
                      <div className="flex items-center mt-2 border border-[#ccc] w-fit">
                        <button
                          onClick={() => void updateQty(item.id, item.qty - 1)}
                          className="w-[25px] h-[25px] flex items-center justify-center bg-white border-r border-[#ccc] hover:bg-[#eee]"
                        >
                          −
                        </button>
                        <span className="px-3 text-[13px]">{item.qty}</span>
                        <button
                          onClick={() => void updateQty(item.id, item.qty + 1)}
                          className="w-[25px] h-[25px] flex items-center justify-center bg-white border-l border-[#ccc] hover:bg-[#eee]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[20px] text-[#151515] hover:text-[#777]"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-8">
                <button
                  onClick={() => { clearCart(); setItems([]); }}
                  className="text-[12px] uppercase font-bold tracking-widest text-[#777] hover:text-[#151515] transition-colors"
                >
                  Clear all items
                </button>
              </div>
            </section>

            <aside>
              <div className="border border-[#e8e2d9] p-8 bg-white">
                <h2 className="text-[25px] serif font-medium border-b border-[#e8e2d9] pb-4">Summary</h2>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-[15px] font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <p className="text-[#777] text-[12px]">Shipping calculated at checkout.</p>
                </div>

                <Link
                  href="/checkout"
                  className="mt-6 block w-full bg-[#111] text-white text-center py-4 text-[12px] font-bold uppercase tracking-widest hover:bg-[#333] transition-colors"
                >
                  PROCEED TO CHECKOUT
                </Link>

                {stockMessage && (
                  <p className="mt-4 text-center text-[12px] font-medium text-rose-600">{stockMessage}</p>
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
