"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";

import { NAVIGATION_GROUPS } from "../lib/utils";

const NAV_GROUPS = NAVIGATION_GROUPS;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const { user, profile } = useAuth();

  useEffect(() => {
    // Fetch active categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setActiveCategories(data);
        }
      })
      .catch(err => console.error("Failed to fetch categories", err));

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

  const isLoggedIn = user && !user.isAnonymous;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/80 backdrop-blur-xl">
      <div className="bg-emerald-600 py-2 text-center text-[11px] font-bold tracking-widest text-white uppercase">
        Free shipping on orders over ₹10,000
      </div>

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-emerald-600 transition-colors">
            Al Baaqir
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-slate-600">
            {NAV_GROUPS.map((group) => {
              const filteredCategories = group.categories?.filter(cat =>
                activeCategories.includes(cat)
              );

              if (!group.href && (!filteredCategories || filteredCategories.length === 0)) {
                return null;
              }

              return (
                <div key={group.label} className="group relative py-4">
                  {group.href ? (
                    <Link href={group.href} className="hover:text-slate-900 transition-colors">
                      {group.label}
                    </Link>
                  ) : (
                    <>
                      <button className="flex items-center gap-1 hover:text-slate-900 transition-colors">
                        {group.label}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                      <div className="invisible absolute top-full left-0 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                        {filteredCategories?.map((cat) => (
                          <Link
                            key={cat}
                            href={`/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                            className="block rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
                          >
                            {cat}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <Link href="/search" className="p-2 hover:text-slate-900 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </Link>

          <Link href="/account" className="hidden sm:flex items-center gap-2 p-2 hover:text-slate-900 transition-colors text-[13px] font-medium">
            {isLoggedIn ? (
              <span className="max-w-[80px] truncate">{profile?.displayName || profile?.email?.split('@')[0]}</span>
            ) : (
              <span>Login</span>
            )}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </Link>

          <Link href="/cart" className="relative p-2 text-slate-600 hover:text-emerald-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6h15l-1.5 9h-12L6 6Z"/><path d="M6 6 4 2H2"/></svg>
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>

          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-slate-900">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-100 bg-white/95 px-6 py-8 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-6">
            {NAV_GROUPS.map((group) => {
              const filteredCategories = group.categories?.filter(cat =>
                activeCategories.includes(cat)
              );

              if (!group.href && (!filteredCategories || filteredCategories.length === 0)) {
                return null;
              }

              return (
                <div key={group.label}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">{group.label}</p>
                  <div className="flex flex-col gap-4">
                    {group.href ? (
                      <Link href={group.href} className="text-lg font-medium" onClick={() => setOpen(false)}>{group.label}</Link>
                    ) : (
                      filteredCategories?.map((cat) => (
                        <Link key={cat} href={`/${cat.toLowerCase().replace(/\s+/g, '-')}`} className="text-lg font-medium" onClick={() => setOpen(false)}>{cat}</Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
