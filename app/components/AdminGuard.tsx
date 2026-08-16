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
    let mounted = true;

    // Start sync with Firebase Auth immediately
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (user) {
        setAuthorized(true);
      } else if (isAdminAuthenticated()) {
        // Local session exists but Firebase doesn't, sync it
        try {
          const { signInAnonymously } = await import("firebase/auth");
          await signInAnonymously(auth);
        } catch (e) {
          console.error("AdminGuard: Firebase auto-sync failed", e);
        }
      } else {
        setAuthorized(false);
        if (!checkingAuth) {
          router.replace("/admin/login");
        }
      }
      setCheckingAuth(false);
    });

    // Fallback: If local session is active, show UI but continue auth sync in background
    if (isAdminAuthenticated()) {
      setAuthorized(true);
      // We don't set checkingAuth false here yet to ensure Firebase is ready if possible
      // but we can if we want "instant" feel. Let's wait a bit for Firebase.
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
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
