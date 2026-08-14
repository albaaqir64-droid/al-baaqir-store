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
    if (loginAdmin(password)) {
      router.push("/admin");
      return;
    }
    setError("Invalid password. Please try again.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-md rounded-[32px] border border-slate-800 bg-slate-900/95 p-10 shadow-2xl shadow-emerald/10">
        <h1 className="text-3xl font-semibold">Admin login</h1>
        <p className="mt-3 text-slate-400">Enter the admin password to manage orders and products.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-200">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/20"
            placeholder="Admin password"
          />
          {error && <p className="text-sm text-rose-500">{error}</p>}

          <button className="w-full rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-600 hover:text-white" type="submit">
            Sign in
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          <Link href="/account" className="text-emerald-300 hover:underline">← Back to Account</Link>
        </p>
      </div>
    </main>
  );
}
