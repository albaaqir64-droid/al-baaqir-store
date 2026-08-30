"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#151515]">
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="mb-12">
          <div className="eyebrow">Contact</div>
          <h1 className="text-[34px] md:text-[42px] serif font-medium mt-2">Get in touch</h1>
          <p className="mt-4 text-[#777] max-w-[500px]">
            Have questions about our premium products or your order? Our team is here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-12">
            <div>
              <h3 className="eyebrow mb-4">Our Studio</h3>
              <p className="text-[19px] serif text-[#151515] leading-relaxed">
                AL BAAQIR Designs,<br />
                Crafting Luxury in India.
              </p>
            </div>
            <div>
              <h3 className="eyebrow mb-4">Inquiries</h3>
              <div className="space-y-2">
                <p className="text-[17px] font-bold text-[#151515]">support@albaaqir.com</p>
                <p className="text-[17px] font-bold text-[#151515]">+91 70413 96464</p>
              </div>
            </div>
            <div>
              <h3 className="eyebrow mb-4">Operating Hours</h3>
              <p className="text-[15px] text-[#777]">Monday — Saturday: 9:00 AM – 7:00 PM IST</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="border border-[#e8e2d9] bg-white p-8 md:p-12">
            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <div className="mb-6 h-12 w-12 flex items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-[25px] serif font-medium text-[#151515]">Message Sent</h3>
                <p className="mt-2 text-[#777]">We&apos;ll get back to you as soon as possible.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-8 text-[11px] font-bold uppercase tracking-widest text-[#151515] hover:text-brand-gold"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#151515] block mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-[#ccc] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#111]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#151515] block mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-[#ccc] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#111]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#151515] block mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full border border-[#ccc] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#111]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#151515] block mb-2">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border border-[#ccc] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#111]"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#111] text-white py-4 text-[12px] font-bold uppercase tracking-widest hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
