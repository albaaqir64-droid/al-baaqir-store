"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import CustomerGuard from "../components/CustomerGuard";
import { logoutCustomer } from "../lib/auth";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AccountDashboard() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logoutCustomer();
    router.push("/account/login");
  }

  return (
    <CustomerGuard>
      <main className="brand-page min-h-screen px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <header className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-semibold text-brand-dark">My Account</h1>
              <p className="mt-2 text-brand-dark/60">Welcome back, {profile?.displayName || profile?.email || "Guest"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 rounded-full border border-brand-dark/10 text-brand-dark/60 font-medium hover:bg-brand-dark hover:text-white transition"
            >
              Logout
            </button>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              title="My Orders"
              desc="View and track your current and past orders."
              href="/account/orders"
              icon="📦"
            />
            <DashboardCard
              title="My Profile"
              desc="Update your name, email, and contact details."
              href="/account/profile"
              icon="👤"
            />
            <DashboardCard
              title="Saved Addresses"
              desc="Manage your shipping and billing addresses."
              href="/account/addresses"
              icon="📍"
            />
            <DashboardCard
              title="Wishlist"
              desc="Your saved items ready for purchase."
              href="/account/wishlist"
              icon="♡"
            />
            <DashboardCard
              title="Cart"
              desc="Check items in your shopping cart."
              href="/cart"
              icon="🛒"
            />
            <DashboardCard
              title="Help & Support"
              desc="Contact us for assistance with your orders."
              href="/contact"
              icon="💬"
            />
          </div>
        </div>
      </main>
    </CustomerGuard>
  );
}

function DashboardCard({ title, desc, href, icon }: { title: string; desc: string; href: string; icon: string }) {
  return (
    <Link href={href} className="group block p-8 rounded-[32px] border border-brand-light/20 bg-white shadow-sm hover:shadow-xl hover:shadow-brand-dark/5 hover:-translate-y-1 transition-all duration-300">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-brand-dark group-hover:text-brand-teal transition">{title}</h3>
      <p className="mt-2 text-sm text-brand-dark/60 leading-relaxed">{desc}</p>
    </Link>
  );
}
