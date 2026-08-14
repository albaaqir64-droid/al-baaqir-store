export default function Footer() {
  return (
    <footer className="mt-16 border-t border-emerald-200 bg-gradient-to-b from-gold-50 to-emerald-50 pt-12">
      <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-emerald-700">Al Baaqir</h4>
          <p className="mt-3 text-sm text-emerald-900/70">Premium belts and bags crafted with care.</p>
        </div>

        <div>
          <h5 className="font-medium text-emerald-900">Shop</h5>
          <ul className="mt-3 space-y-2 text-sm text-emerald-900/70">
            <li>Belts</li>
            <li>Bags</li>
            <li>New Arrivals</li>
          </ul>
        </div>

        <div>
          <h5 className="font-medium text-emerald-900">Contact</h5>
          <p className="mt-3 text-sm text-emerald-900/70">hello@albaaqir.example</p>
          <p className="mt-2 text-sm text-emerald-900/70">© {new Date().getFullYear()} Al Baaqir</p>
        </div>
      </div>
      <div className="border-t border-emerald-200 pt-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-emerald-900/70">
          <div>Designed in India</div>
          <div className="text-gold-600 font-semibold">Handcrafted Quality</div>
        </div>
      </div>
    </footer>
  );
}
