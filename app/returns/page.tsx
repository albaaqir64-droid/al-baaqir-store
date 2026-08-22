import React from 'react';

export default function ReturnsPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight">Returns & Exchanges</h1>

      <div className="prose prose-slate prose-lg max-w-none space-y-8 text-slate-600">
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">7-Day Return Policy</h2>
          <p>
            We want you to love what you ordered! If you're not completely satisfied,
            you can return or exchange any item within 7 days of delivery.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Eligibility for Returns</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Items must be unworn, unwashed, and in their original condition.</li>
            <li>All original tags and packaging must be intact.</li>
            <li>Innerwear and sale items are not eligible for return due to hygiene and clearance reasons.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Refund Process</h2>
          <p>
            Once we receive and inspect your return, the refund will be processed within 5-7 business days.
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Prepaid Orders:</strong> Refund will be credited to the original payment method.</li>
            <li><strong>COD Orders:</strong> Refund will be provided as store credit or via bank transfer.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">How to Initiate a Return?</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Log in to your account and go to "My Orders".</li>
            <li>Select the item you wish to return and click "Request Return".</li>
            <li>Alternatively, WhatsApp us at +91 7041396464 with your Order ID.</li>
          </ol>
        </section>

        <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <p className="text-sm font-medium">
            Note: A reverse shipping fee of ₹99 will be deducted from the refund amount for returns,
            unless the item was received damaged or incorrect.
          </p>
        </section>
      </div>
    </div>
  );
}
