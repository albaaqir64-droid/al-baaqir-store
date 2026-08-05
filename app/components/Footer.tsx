export default function Footer() {
  return (
    <footer className="mt-16 bg-white border-t pt-12">
      <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-emerald">Al Baaqir</h4>
          <p className="mt-3 text-sm text-gray-600">Premium belts and bags crafted with care.</p>
        </div>

        <div>
          <h5 className="font-medium text-gray-800">Shop</h5>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>Belts</li>
            <li>Bags</li>
            <li>New Arrivals</li>
          </ul>
        </div>

        <div>
          <h5 className="font-medium text-gray-800">Contact</h5>
          <p className="mt-3 text-sm text-gray-600">hello@albaaqir.example</p>
          <p className="mt-2 text-sm text-gray-600">© {new Date().getFullYear()} Al Baaqir</p>
        </div>
      </div>
      <div className="border-t pt-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-600">
          <div>Designed in India</div>
          <div className="text-gold font-medium">Handcrafted Quality</div>
        </div>
      </div>
    </footer>
  );
}
