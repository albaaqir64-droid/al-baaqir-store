"use client";

import CustomerGuard from "../../components/CustomerGuard";
import { useAuth } from "../../hooks/useAuth";
import Link from "next/link";

export default function WishlistPage() {
  const { profile } = useAuth();
  const wishlist = profile?.wishlist || [];

  return (
    <CustomerGuard>
      <main className="min-h-screen brand-page px-6 py-20">
        <div className="mx-auto max-w-6xl space-y-8">
          <header>
            <h1 className="text-4xl font-semibold text-emerald-900">My Wishlist</h1>
            <p className="mt-2 text-emerald-900/60">Items you've saved for later.</p>
          </header>

          {wishlist.length === 0 ? (
            <div className="rounded-[32px] border border-emerald-100 bg-white p-12 text-center text-emerald-900/60 shadow-sm">
              <div className="text-4xl mb-4">♡</div>
              <p className="text-lg">Your wishlist is empty.</p>
              <Link href="/" className="mt-6 inline-flex rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-emerald-900 shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:text-white transition">
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {/* Product cards would go here, fetched by ID */}
               <p className="text-emerald-900/60 col-span-full italic">Wishlist functionality is being synced with your account.</p>
            </div>
          )}

          <div className="pt-8">
            <Link href="/account" className="text-emerald-600 font-semibold hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </CustomerGuard>
  );
}
