"use client";

import Link from "next/link";
import { usePublicStoreSettings } from "../lib/storeSettings.client";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const settings = usePublicStoreSettings();
  const whatsappNumber = settings.whatsappNumber.replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(settings.whatsappMessage);

  return (
    <footer className="bg-[#111] text-white py-[50px] px-5 sm:px-0" id="contact">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[30px]">
        <div>
          <div className="text-[25px] font-bold tracking-[0.18em] serif mb-4">{settings.storeName.toUpperCase()}</div>
          <p className="text-[#aaa] text-sm leading-relaxed">
            {settings.storeDescription}<br />Style × Utility × Character.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-[#aaa] text-[13px]">
            <a href={`mailto:${settings.storeEmail}`} className="hover:text-white transition-colors">{settings.storeEmail}</a>
            <a href={`tel:${settings.storePhone.replace(/[^\d+]/g, "")}`} className="hover:text-white transition-colors">{settings.storePhone}</a>
          </div>
        </div>

        <div>
          <b className="block text-white mb-4 uppercase text-[12px] tracking-widest">SHOP</b>
          <div className="flex flex-col gap-2">
            <Link href="/#shop" className="text-[#aaa] text-[13px] hover:text-white transition-colors">New Collection</Link>
            <Link href="/men" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Men</Link>
            <Link href="/women" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Women</Link>
            <Link href="/karachi-suit" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Karachi Suits</Link>
            <Link href="/kurti" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Kurtis</Link>
          </div>
        </div>

        <div>
          <b className="block text-white mb-4 uppercase text-[12px] tracking-widest">ACCESSORIES</b>
          <div className="flex flex-col gap-2">
            <Link href="/bags" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Luxury Bags</Link>
            <Link href="/belts" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Premium Belts</Link>
            <Link href="/jhumka" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Jhumkas</Link>
            <Link href="/earrings" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Earrings</Link>
          </div>
        </div>

        <div>
          <b className="block text-white mb-4 uppercase text-[12px] tracking-widest">FOLLOW</b>
          <div className="flex flex-col gap-2">
            <a href="https://www.instagram.com/baaqirlifestyle/" target="_blank" rel="noopener noreferrer" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Instagram</a>
            <a href="https://www.facebook.com/profile.php?id=61594035410728" target="_blank" rel="noopener noreferrer" className="text-[#aaa] text-[13px] hover:text-white transition-colors">Facebook</a>
            {settings.whatsappEnabled && (
              <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="text-[#aaa] text-[13px] hover:text-white transition-colors">WhatsApp</a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto mt-[35px] pt-[15px] border-t border-[#333] text-[#777] text-[12px]">
        © {currentYear} AL BAAQIR. All rights reserved.
      </div>
    </footer>
  );
}
