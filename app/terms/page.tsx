import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight">Terms of Service</h1>

      <div className="prose prose-slate prose-lg max-w-none space-y-8 text-slate-600">
        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using this website, you accept and agree to be bound by the terms and provision
            of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Intellectual Property</h2>
          <p>
            The Site and its original content, features, and functionality are owned by Al Baaqir
            and are protected by international copyright, trademark, patent, trade secret, and other
            intellectual property or proprietary rights laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide us information that is accurate,
            complete, and current at all times. Failure to do so constitutes a breach of the Terms,
            which may result in immediate termination of your account on our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Limitation of Liability</h2>
          <p>
            In no event shall Al Baaqir, nor its directors, employees, partners, agents, suppliers,
            or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of India,
            without regard to its conflict of law provisions.
          </p>
        </section>
      </div>
    </div>
  );
}
