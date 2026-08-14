"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Men", href: "/men" },
  { label: "Women", href: "/women" },
  { label: "Shirts", href: "/shirts" },
  { label: "T-Shirts", href: "/t-shirts" },
  { label: "Pants", href: "/pants" },
  { label: "Jeans", href: "/jeans" },
  { label: "Belts", href: "/belts" },
  { label: "Bags", href: "/bags" },
  { label: "Kurti", href: "/kurti" },
  { label: "Karachi Suit", href: "/karachi-suit" },
  { label: "Earrings", href: "/earrings" },
  { label: "Jhumka", href: "/jhumka" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Sale", href: "/sale" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateCount = () => {
      const stored = window.localStorage.getItem('albaaqir_cart');
      if (!stored) return setCartCount(0);
      try {
        const items = JSON.parse(stored) as Array<{ qty: number }>;
        setCartCount(items.reduce((sum, item) => sum + (item.qty || 0), 0));
      } catch {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener('albaaqir-cart-updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('albaaqir-cart-updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  return (
    <header className="w-full border-b border-emerald-200 bg-white/90 backdrop-blur">
      <div className="bg-gradient-to-r from-gold-400 via-gold-500 to-emerald-500 text-emerald-950 text-center text-sm py-2 font-medium">Free shipping on orders over ₹10,000</div>

      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-semibold tracking-tight text-emerald-700">Al Baaqir</Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-emerald-900/80">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-emerald-600">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-emerald-900/80">
          <Link href="/search" className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 transition hover:bg-emerald-50">
            <span className="sr-only">Search</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </Link>
          <Link href="/account" className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 transition hover:bg-emerald-50">
            <span className="sr-only">Account</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </Link>
          <Link href="/wishlist" className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 transition hover:bg-emerald-50">
            <span className="sr-only">Wishlist</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>
          </Link>
          <Link href="/cart" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 transition hover:bg-emerald-50">
            <span className="sr-only">Cart</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h15l-1.5 9h-12L6 6Z"/><path d="M6 6 4 2H2"/></svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[11px] font-semibold text-emerald-950">{cartCount}</span>
            )}
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 text-emerald-900">
          <span className="sr-only">Open menu</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-emerald-200 px-6 pb-6">
          <div className="py-4 flex flex-col gap-3 text-base text-emerald-900">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="block rounded-xl px-4 py-3 transition hover:bg-emerald-50">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-emerald-200 pt-4 text-emerald-900">
            <Link href="/search" className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-emerald-50"><span className="w-6 text-center">🔍</span> Search</Link>
            <Link href="/account/login" className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-emerald-50"><span className="w-6 text-center">👤</span> Account</Link>
            <Link href="/wishlist" className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-emerald-50"><span className="w-6 text-center">♡</span> Wishlist</Link>
            <Link href="/cart" className="flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-emerald-50"><span className="w-6 text-center">🛒</span> Cart{cartCount > 0 ? ` ${cartCount}` : ''}</Link>
          </div>
        </div>
      )}
    </header>
  );
}
