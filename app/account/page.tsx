import Link from "next/link";

export default function Page() {
  return (
    <main className="brand-page max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-emerald-900">Account</h1>
      <p className="mt-4 text-emerald-900/70">Account dashboard placeholder.</p>
      <p className="mt-6"><Link href="/account/login" className="text-emerald-700 font-semibold hover:underline">Go to Login</Link></p>
    </main>
  );
}
