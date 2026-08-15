"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "../lib/auth";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local session first for immediate access
    if (isAdminAuthenticated()) {
      setAuthorized(true);
      setCheckingAuth(false);
      return;
    }

    // Fallback/Sync with Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isAdminAuthenticated()) {
        setAuthorized(true);
      } else if (user) {
        // If Firebase is authenticated but local storage isn't (e.g. after refresh)
        // we can potentially trust it, but for now we follow the existing local-first logic
        setAuthorized(false);
      } else {
        setAuthorized(false);
        if (!checkingAuth) {
          router.replace("/admin/login");
        }
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router, checkingAuth]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-emerald-50 text-emerald-900 grid place-items-center px-6">
        <div className="animate-pulse text-xl font-semibold">Verifying session...</div>
      </div>
    );
  }

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
