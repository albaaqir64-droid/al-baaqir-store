"use client";

import { useState } from "react";
import CustomerGuard from "../../components/CustomerGuard";
import { useAuth } from "../../hooks/useAuth";
import { addAddress } from "../../lib/auth";
import Link from "next/link";

export default function AddressesPage() {
  const { profile, user } = useAuth();
  const addresses = profile?.addresses || [];
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    house: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addAddress(user.uid, formData);
      setIsAdding(false);
      setFormData({
        name: "",
        phone: "",
        house: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        type: "Home",
      });
      window.location.reload();
    } catch (error) {
      console.error("Error adding address:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerGuard>
      <main className="brand-page min-h-screen px-6 py-20">
        <div className="mx-auto max-w-4xl space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-semibold text-brand-dark">Saved Addresses</h1>
              <p className="mt-2 text-brand-dark/60">Manage your delivery locations for faster checkout.</p>
            </div>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="rounded-full bg-brand-teal px-6 py-3 font-semibold text-white shadow-lg shadow-brand-teal/20 transition hover:bg-brand-dark"
              >
                Add New Address
              </button>
            )}
          </header>

          {isAdding ? (
            <div className="rounded-[32px] border border-brand-light/20 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-brand-dark">Add New Address</h2>
              <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/40">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-light/20 px-4 py-2 focus:border-brand-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/40">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-light/20 px-4 py-2 focus:border-brand-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/40">House / Flat No.</label>
                  <input
                    type="text"
                    required
                    value={formData.house}
                    onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-light/20 px-4 py-2 focus:border-brand-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/40">Street / Area</label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-light/20 px-4 py-2 focus:border-brand-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/40">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-light/20 px-4 py-2 focus:border-brand-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/40">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-light/20 px-4 py-2 focus:border-brand-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/40">Pincode</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-light/20 px-4 py-2 focus:border-brand-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-dark/40">Address Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-brand-light/20 px-4 py-2 focus:border-brand-teal focus:outline-none"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex gap-4 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 rounded-full border border-brand-light/20 px-6 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand-off-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-[32px] border border-brand-light/20 bg-white p-12 text-center text-brand-dark/60 shadow-sm">
              <div className="mb-4 text-4xl">📍</div>
              <p className="text-lg">You haven&apos;t saved any addresses yet.</p>
              <p className="mt-2 text-sm">Save your addresses here to use them during checkout.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {addresses.map((addr: any, idx: number) => (
                <div key={idx} className="rounded-[32px] border border-brand-light/20 bg-white p-6 shadow-sm transition hover:shadow-md">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="rounded-md bg-brand-light/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-brand-teal">
                      {addr.type || "Home"}
                    </span>
                  </div>
                  <p className="font-semibold text-brand-dark">{addr.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-dark/70">
                    {addr.house}, {addr.street}
                    <br />
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="mt-4 text-sm font-medium text-brand-dark">Phone: {addr.phone}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-8">
            <Link href="/account" className="font-semibold text-brand-teal hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </CustomerGuard>
  );
}
