import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-brand-light bg-brand-light/5 pb-12 pt-16 text-brand-teal/80">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-brand-dark tracking-tight">Al Baaqir</h4>
            <p className="text-sm leading-relaxed max-w-xs text-brand-teal">
              Curating premium essentials with a focus on timeless design and handcrafted quality.
            </p>
          </div>

          {/* Shop Column */}
          <div className="space-y-4">
            <h5 className="text-[11px] font-bold uppercase tracking-widest text-brand-teal">Shop</h5>
            <ul className="space-y-3 text-sm font-bold">
              <li><Link href="/men" className="hover:text-brand-green transition-colors">Men</Link></li>
              <li><Link href="/women" className="hover:text-brand-green transition-colors">Women</Link></li>
              <li><Link href="/accessories" className="hover:text-brand-green transition-colors">Accessories</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-brand-green transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-4">
            <h5 className="text-[11px] font-bold uppercase tracking-widest text-brand-teal">Support</h5>
            <ul className="space-y-3 text-sm font-bold">
              <li><Link href="/shipping" className="hover:text-brand-green transition-colors">Shipping Policy</Link></li>
              <li><Link href="/returns" className="hover:text-brand-green transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-green transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h5 className="text-[11px] font-bold uppercase tracking-widest text-brand-teal">Contact Us</h5>
            <ul className="space-y-3 text-sm font-bold">
              <li>
                <a href="tel:+917041396464" className="flex items-center gap-2 hover:text-brand-green transition-colors">
                  <span className="text-brand-light">P:</span> +91 7041396464
                </a>
              </li>
              <li>
                <a href="mailto:albaaqir64@gmail.com" className="flex items-center gap-2 hover:text-brand-green transition-colors">
                  <span className="text-brand-light">E:</span> albaaqir64@gmail.com
                </a>
              </li>
              <li className="pt-2 flex gap-4">
                <a href="#" className="hover:text-brand-dark transition-colors" aria-label="Instagram">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="#" className="hover:text-brand-dark transition-colors" aria-label="Facebook">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-brand-light flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] font-medium text-brand-teal/40">
          <p>© {currentYear} Al Baaqir. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Handcrafted in India</span>
            <span className="text-brand-dark">Premium Quality Since 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
