"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated, loginAdmin } from "../../lib/auth";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.replace("/admin");
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const success = await loginAdmin(password);
    if (success) {
      router.push("/admin");
      return;
    }
    setError("Invalid password. Please try again.");
  }

  return (
    <main className="min-h-screen brand-page px-6 py-24">
      <div className="mx-auto max-w-md rounded-[32px] border border-emerald-200 bg-white p-10 shadow-2xl shadow-gold/10">
        <h1 className="text-3xl font-semibold text-emerald-900">Admin login</h1>
        <p className="mt-3 text-emerald-900/70">Enter the admin password to manage orders and products.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-emerald-900">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-emerald-200 bg-gold-50 px-4 py-3 text-sm text-emerald-900 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/20"
            placeholder="Admin password"
          />
          {error && <p className="text-sm text-rose-500">{error}</p>}

          <button className="w-full rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-600 hover:text-white" type="submit">
            Sign in
          </button>
        </form>

        <p className="mt-6 text-sm text-emerald-900/70">
          <Link href="/" className="text-emerald-700 hover:underline">← Back to Store</Link>
        </p>
      </div>
    </main>
  );
}
