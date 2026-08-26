"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account/orders");
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center bg-brand-dark text-brand-teal">
      <div className="animate-pulse text-xl font-semibold">Redirecting to your orders...</div>
    </div>
  );
}
