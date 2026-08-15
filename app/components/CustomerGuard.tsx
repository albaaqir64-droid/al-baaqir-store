"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function CustomerGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.replace("/account/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 text-emerald-900 grid place-items-center px-6">
        <div className="animate-pulse text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
