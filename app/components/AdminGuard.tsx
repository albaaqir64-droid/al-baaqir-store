"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "../lib/auth";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/account/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-emerald-50 text-emerald-900 grid place-items-center px-6">
        <div className="max-w-md rounded-3xl border border-emerald-200 bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="mt-3 text-emerald-900">Redirecting you to the login page...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
