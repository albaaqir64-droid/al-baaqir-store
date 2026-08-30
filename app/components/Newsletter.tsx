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
    <div className="relative z-10 text-center max-w-[600px] mx-auto">
      <div className="eyebrow mb-4">Newsletter</div>
      <h3 className="text-[34px] md:text-[42px] serif font-medium text-white mb-4">Join the club</h3>
      <p className="text-[#aaa] text-[15px] mb-10">Get early access to new collections, exclusive events, and luxury insights.</p>

      {submitted ? (
        <div className="inline-flex items-center gap-3 border border-brand-green bg-brand-green/10 px-8 py-4 text-[12px] font-bold text-brand-green uppercase tracking-widest">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
          You&apos;re on the list
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-0 border border-white/20">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Your email address"
            className="flex-1 bg-transparent px-6 py-5 text-white focus:outline-none placeholder:text-white/30 text-[14px]"
            required
          />
          <button className="bg-white text-[#111] px-10 py-5 text-[12px] font-bold uppercase tracking-widest transition-all hover:bg-brand-gold hover:text-white">
            Subscribe
          </button>
        </form>
      )}
      <p className="mt-10 text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Indian soul. Modern luxury.</p>
    </div>
  );
}
