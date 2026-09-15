"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "../lib/auth";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          if (idTokenResult.claims.admin === true) {
            setAuthorized(true);
          } else {
            // Not an admin, sign out
            await signOut(auth);
            localStorage.removeItem("albaaqir_admin_session");
            setAuthorized(false);
            router.replace("/admin/login");
          }
        } catch (error) {
          console.error("AdminGuard verification error:", error);
          setAuthorized(false);
          router.replace("/admin/login");
        } finally {
          setCheckingAuth(false);
        }
      } else {
        setAuthorized(false);
        setCheckingAuth(false);
        router.replace("/admin/login");
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-brand-off-white text-brand-dark grid place-items-center px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" />
          <p className="text-xl font-semibold animate-pulse">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-brand-off-white text-brand-dark grid place-items-center px-6">
        <div className="max-w-md rounded-[32px] border border-brand-light bg-white p-8 shadow-2xl text-center">
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="mt-3 text-brand-teal">Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
