import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight">Privacy Policy</h1>

      <div className="prose prose-slate prose-lg max-w-none space-y-8 text-slate-600">
        <p>
          At Al Baaqir, accessible from al-baaqir.com, one of our main priorities is the privacy of our visitors.
          This Privacy Policy document contains types of information that is collected and recorded by Al Baaqir
          and how we use it.
        </p>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Information We Collect</h2>
          <p>
            When you visit the site, we collect certain information about your device, your interaction with the site,
            and information necessary to process your purchases. We may also collect additional information if you
            contact us for customer support.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our Service, including to monitor the usage of our Service.</li>
            <li>To manage your Account: to manage your registration as a user of the Service.</li>
            <li>For the performance of a contract: the development, compliance and undertaking of the purchase contract for the products you have purchased.</li>
            <li>To contact you by email, telephone calls, SMS, or other equivalent forms of electronic communication.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Security</h2>
          <p>
            The security of your Personal Data is important to us, but remember that no method of transmission
            over the Internet, or method of electronic storage is 100% secure. While we strive to use
            commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
          </p>
        </section>

        <footer className="pt-10 border-t border-slate-100 mt-10">
          <p className="text-sm">Last updated: May 2024</p>
        </footer>
      </div>
    </div>
  );
}
