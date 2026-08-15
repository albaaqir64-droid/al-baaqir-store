"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // In a real app, you would send this to your backend
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <main className="brand-page min-h-screen px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-semibold text-emerald-900">Contact Us</h1>
        <p className="mt-4 text-lg text-emerald-900/60">
          Have questions about our products or your order? We&apos;re here to help.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900/40">Our Location</h3>
              <p className="mt-2 text-lg font-medium text-emerald-900">
                123 Al Baaqir Street, <br />
                New Delhi, India 110001
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900/40">Email Us</h3>
              <p className="mt-2 text-lg font-medium text-emerald-900">support@albaaqir.com</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900/40">Call Us</h3>
              <p className="mt-2 text-lg font-medium text-emerald-900">+91 98765 43210</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900/40">Operating Hours</h3>
              <p className="mt-2 text-lg font-medium text-emerald-900">Mon - Sat: 9:00 AM - 7:00 PM</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-sm">
            {success ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-emerald-900">Message Sent!</h3>
                <p className="mt-2 text-emerald-600">We&apos;ll get back to you as soon as possible.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-6 text-sm font-semibold text-emerald-600 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-emerald-100 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-emerald-100 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-emerald-100 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-emerald-100 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
