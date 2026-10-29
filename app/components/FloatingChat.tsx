"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePublicStoreSettings } from "../lib/storeSettings.client";

export default function FloatingChat() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");
  const settings = usePublicStoreSettings(!isAdminPage);

  if (isAdminPage || !settings.whatsappEnabled) return null;

  const whatsappNumber = settings.whatsappNumber.replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(settings.whatsappMessage);

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${settings.storeName} on WhatsApp`}
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1fa855] text-white shadow-[0_8px_24px_rgba(20,120,65,0.3)] ring-4 ring-white/80 transition duration-200 hover:-translate-y-1 hover:bg-[#168b45] hover:shadow-[0_12px_30px_rgba(20,120,65,0.38)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 sm:bottom-7 sm:right-7 sm:h-16 sm:w-16"
    >
      <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-300" />
      <MessageCircle size={25} strokeWidth={2.2} aria-hidden="true" />
      <span className="pointer-events-none absolute right-[calc(100%+12px)] whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Chat with us
      </span>
    </a>
  );
}
