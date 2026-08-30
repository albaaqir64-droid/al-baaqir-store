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
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? "bg-brand-off-white/95 border-b border-brand-line backdrop-blur-md" : "bg-brand-off-white/80 border-b border-transparent backdrop-blur-md"}`}>
      <div className="bg-[#111] py-2 text-center text-[11px] font-bold tracking-[0.14em] text-white uppercase">
        FREE SHIPPING ABOVE ₹999 · COD AVAILABLE · PREMIUM INDIAN LIFESTYLE
      </div>

      <div className="max-w-[1200px] mx-auto px-5 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => setOpen(!open)} className="lg:hidden text-2xl text-brand-dark">
            ☰
          </button>

          <Link href="/" className="text-[25px] font-bold tracking-[0.18em] text-brand-dark serif">
            AL BAAQIR
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-[22px] text-[12px] font-normal tracking-[0.05em] uppercase">
          <Link href="/#shop" className="text-brand-dark hover:text-brand-gold transition-colors">SHOP</Link>
          <Link href="/#story" className="text-brand-dark hover:text-brand-gold transition-colors">OUR STORY</Link>
          <Link href="/contact" className="text-brand-dark hover:text-brand-gold transition-colors">CONTACT</Link>
        </nav>

        <div className="flex items-center gap-4 text-brand-dark">
          <Link href="/search" className="text-[20px] hover:text-brand-gold transition-colors">
            ⌕
          </Link>

          <Link href="/account" className="hidden sm:flex items-center text-[20px] hover:text-brand-gold transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </Link>

          <Link href="/cart" className="relative text-[20px] hover:text-brand-gold transition-colors">
            🛍
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-dark text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-brand-line bg-brand-off-white px-6 py-8 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-8">
            {NAV_GROUPS.map((group) => {
              const filteredCategories = group.categories?.filter(cat =>
                activeCategories.includes(cat)
              );
              if (!group.href && (!filteredCategories || filteredCategories.length === 0)) return null;
              return (
                <div key={group.label}>
                  <p className="eyebrow mb-6">{group.label}</p>
                  <div className="flex flex-col gap-5">
                    {group.href ? (
                      <Link href={group.href} className="text-2xl serif font-medium text-brand-dark" onClick={() => setOpen(false)}>{group.label}</Link>
                    ) : (
                      filteredCategories?.map((cat) => (
                        <Link key={cat} href={`/${cat.toLowerCase().replace(/\s+/g, '-')}`} className="text-2xl serif font-medium text-brand-dark" onClick={() => setOpen(false)}>{cat}</Link>
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
