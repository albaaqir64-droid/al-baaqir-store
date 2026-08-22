import React from 'react';

export default function ShippingPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight">Shipping Policy</h1>

      <div className="prose prose-slate prose-lg max-w-none space-y-8 text-slate-600">
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Delivery Timeline</h2>
          <p>
            At Al Baaqir, we strive to deliver your handcrafted essentials as quickly as possible.
            Standard shipping typically takes 5-7 business days across India.
            Remote locations might take up to 10 business days.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Shipping Charges</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Free standard shipping on all orders above ₹1,999.</li>
            <li>A flat shipping fee of ₹99 is applicable for orders below ₹1,999.</li>
            <li>Cash on Delivery (COD) is available for an additional charge of ₹50.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Order Tracking</h2>
          <p>
            Once your order is dispatched, you will receive a tracking link via email and WhatsApp.
            You can also track your order status in the "My Orders" section of your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Shipping Partners</h2>
          <p>
            We partner with reliable courier services like BlueDart, Delhivery, and Xpressbees
            to ensure your package reaches you safely.
          </p>
        </section>

        <section className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
          <h3 className="text-emerald-900 font-bold mb-2">Need Help?</h3>
          <p className="text-emerald-800 text-sm">
            If your order is delayed or you have any delivery concerns, reach out to us at
            <a href="mailto:albaaqir64@gmail.com" className="ml-1 font-bold underline">albaaqir64@gmail.com</a> or
            call/WhatsApp at <span className="font-bold">+91 7041396464</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
