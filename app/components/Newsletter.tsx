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
    <section id="newsletter" className="max-w-4xl mx-auto mt-12 px-6 py-12 brand-card rounded-[32px]">
      <h3 className="text-2xl font-semibold text-emerald-900">Join our Newsletter</h3>
      <p className="mt-2 text-sm text-emerald-900/70">Get early access to new releases and exclusive offers.</p>

      {submitted ? (
        <div className="mt-4 text-sm font-medium text-emerald-700">Thanks — you’re subscribed!</div>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email address"
            className="flex-1 border border-emerald-200 rounded-full px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald/30"
          />
          <button className="rounded-full bg-emerald px-6 py-3 text-emerald-900 font-semibold transition hover:bg-emerald-600 hover:text-white">Subscribe</button>
        </form>
      )}
    </section>
  );
}
