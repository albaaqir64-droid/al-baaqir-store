"use client";
import React, { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <section id="newsletter" className="max-w-4xl mx-auto mt-24 px-8 py-16 brand-card rounded-[48px] border border-emerald-100 bg-white shadow-xl shadow-emerald-500/5 relative overflow-hidden">
      {/* Decorative gradient background elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-100/20 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-orange-100/20 blur-3xl" />

      <div className="relative z-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500">Stay Connected</p>
        <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Join our newsletter</h3>
        <p className="mt-3 text-lg text-slate-600">Get early access to new collections and exclusive invitations.</p>

        {submitted ? (
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-600 border border-emerald-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
            You&apos;re on the list!
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
              className="flex-1 border border-emerald-100 rounded-full px-8 py-4 bg-emerald-50/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-slate-400 text-slate-900"
              required
            />
            <button className="rounded-full bg-emerald-500 px-10 py-4 text-slate-900 font-bold shadow-lg shadow-emerald-500/20 transition-all hover:bg-orange-500 hover:text-white hover:scale-[1.02] active:scale-95">
              Subscribe
            </button>
          </form>
        )}
        <p className="mt-6 text-[10px] text-slate-400 uppercase tracking-widest">Minimalist Essentials. Uncompromising Quality.</p>
      </div>
    </section>
  );
}
