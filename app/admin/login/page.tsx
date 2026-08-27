"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated, loginAdmin } from "../../lib/auth";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.replace("/admin");
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const success = await loginAdmin(password);
      if (success) {
        router.push("/admin");
        return;
      }
      setError("Invalid password. Please try again.");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-off-white flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md rounded-[40px] border border-brand-light/30 bg-white p-10 shadow-2xl shadow-brand-dark/5">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-brand-dark rounded-3xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
            AB
          </div>
          <h1 className="text-3xl font-bold text-brand-dark">Admin Login</h1>
          <p className="mt-2 text-brand-teal/70 font-medium">Restricted Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-brand-teal mb-2 ml-1">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-brand-light bg-brand-off-white px-6 py-4 text-sm text-brand-dark outline-none transition-all focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/5"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm font-semibold text-rose-600 animate-in fade-in zoom-in duration-200">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-full bg-brand-dark py-4 text-[15px] font-bold text-white shadow-xl shadow-brand-dark/20 transition-all hover:bg-brand-teal hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
            type="submit"
          >
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-brand-light/20 text-center">
          <Link href="/" className="text-sm font-bold text-brand-teal hover:text-brand-green transition-colors">
            ← Back to Store
          </Link>
        </div>
      </div>
    </main>
  );
}
