export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">SC</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Affordable Sports Cars
              </span>
            </div>
            <p className="text-gray-600 text-sm max-w-md">
              Find the best sports cars under $200k — fast. Clean filters, specs at a glance, 
              and market insights to help you make the perfect choice.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/cars" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Browse Cars
                </a>
              </li>
              <li>
                <a href="/" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Coming Soon */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Coming Soon</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-400 text-sm">Price Alerts</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Trend Charts</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Saved Lists</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">ETL Imports</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2024 Affordable Sports Cars. All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0 flex space-x-6">
              <a href="/" className="text-gray-400 hover:text-gray-500 text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="/" className="text-gray-400 hover:text-gray-500 text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
