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
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

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
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('albaaqir-cart-updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  const isLoggedIn = user && !user.isAnonymous;

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-500 ${isScrolled ? "border-b border-emerald-100 bg-white/90 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className={`py-2 text-center text-[10px] font-bold tracking-[0.4em] text-white uppercase transition-colors duration-500 ${isScrolled ? "bg-emerald-600" : "bg-black/10 backdrop-blur-md"}`}>
        Free shipping on orders over ₹10,000
      </div>

      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className={`text-2xl font-black tracking-tighter transition-colors duration-500 ${isScrolled ? "text-slate-900" : "text-white"}`}>
            AL BAAQIR
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[12px] font-bold tracking-[0.2em] uppercase">
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
                    <Link href={group.href} className={`transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-emerald-600" : "text-white/70 hover:text-white"}`}>
                      {group.label}
                    </Link>
                  ) : (
                    <>
                      <button className={`flex items-center gap-1 transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-emerald-600" : "text-white/70 hover:text-white"}`}>
                        {group.label}
                        <svg className="transition-transform group-hover:rotate-180" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                      <div className="invisible absolute top-full left-0 w-56 rounded-[24px] border border-slate-100 bg-white p-3 shadow-2xl opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                        {filteredCategories?.map((cat) => (
                          <Link
                            key={cat}
                            href={`/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                            className="block rounded-xl px-4 py-3 text-[13px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
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

        <div className={`flex items-center gap-2 transition-colors duration-500 ${isScrolled ? "text-slate-600" : "text-white"}`}>
          <Link href="/search" className="p-2 hover:text-emerald-400 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </Link>

          <Link href="/account" className="hidden sm:flex items-center gap-3 p-2 hover:text-emerald-400 transition-colors text-[11px] font-bold uppercase tracking-widest">
            {isLoggedIn ? (
              <span className="max-w-[100px] truncate">{profile?.displayName || profile?.email?.split('@')[0]}</span>
            ) : (
              <span>Account</span>
            )}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </Link>

          <Link href="/cart" className="relative p-2 hover:text-emerald-400 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6h15l-1.5 9h-12L6 6Z"/><path d="M6 6 4 2H2"/></svg>
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-slate-900 shadow-lg shadow-emerald-500/20">
                {cartCount}
              </span>
            )}
          </Link>

          <button onClick={() => setOpen(!open)} className={`lg:hidden p-2 transition-colors ${isScrolled ? "text-slate-900" : "text-white"}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-6 py-8 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-8">
            {NAV_GROUPS.map((group) => {
              const filteredCategories = group.categories?.filter(cat =>
                activeCategories.includes(cat)
              );
              if (!group.href && (!filteredCategories || filteredCategories.length === 0)) return null;
              return (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">{group.label}</p>
                  <div className="flex flex-col gap-5">
                    {group.href ? (
                      <Link href={group.href} className="text-xl font-bold text-slate-900 tracking-tight" onClick={() => setOpen(false)}>{group.label}</Link>
                    ) : (
                      filteredCategories?.map((cat) => (
                        <Link key={cat} href={`/${cat.toLowerCase().replace(/\s+/g, '-')}`} className="text-xl font-bold text-slate-900 tracking-tight" onClick={() => setOpen(false)}>{cat}</Link>
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
