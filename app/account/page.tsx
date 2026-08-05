import Link from "next/link";

export default function Page() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold">Account</h1>
      <p className="mt-4 text-slate-600">Account dashboard placeholder.</p>
      <p className="mt-6"><Link href="/account/login">Go to Login</Link></p>
    </main>
  );
}
