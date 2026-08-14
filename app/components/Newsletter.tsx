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
    <section id="newsletter" className="max-w-4xl mx-auto mt-12 px-6 py-12 bg-white border rounded-lg">
      <h3 className="text-2xl font-semibold">Join our Newsletter</h3>
      <p className="mt-2 text-sm text-gray-600">Get early access to new releases and exclusive offers.</p>

      {submitted ? (
        <div className="mt-4 text-sm text-emerald">Thanks — you’re subscribed!</div>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email address"
            className="flex-1 border border-gray-200 rounded-md px-4 py-2"
          />
          <button className="rounded-md bg-emerald px-5 py-2 text-emerald-900 transition hover:bg-emerald-600 hover:text-white">Subscribe</button>
        </form>
      )}
    </section>
  );
}
