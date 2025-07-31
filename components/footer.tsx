import Link from "next/link"
import { Linkedin, Twitter, Github } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-slate-100 to-slate-150 border-t border-gray-200 py-12 md:py-16 relative shadow-lg">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 opacity-20" />

      <div className="container mx-auto max-w-6xl px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">ETL Online</h3>
            <p className="text-sm font-medium text-gray-700 leading-relaxed">
              Official website for the All Pakistan Prompt Engineering Competition, hosted by ETL Online.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Product</h3>
            <nav aria-label="Product Navigation">
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="#features"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#security"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="#enterprise"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Enterprise
                  </Link>
                </li>
                <li>
                  <Link
                    href="#government"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Government
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Resources</h3>
            <nav aria-label="Resources Navigation">
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/documentation"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/case-studies"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Company</h3>
            <nav aria-label="Company Navigation">
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-md px-1 py-1"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm font-medium text-gray-700 text-center md:text-left">
            © {currentYear} ETL Online. All rights reserved. Prompt Engineering Competition.
          </p>

          {/* Social Links with Gradient Containers */}
          <div className="flex gap-3">
            <Link
              href="https://linkedin.com"
              className="group transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-lg"
              aria-label="LinkedIn"
            >
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-2 shadow-sm hover:shadow-md transition-all duration-200">
                <Linkedin className="h-4 w-4 text-white" />
              </div>
            </Link>

            <Link
              href="https://twitter.com"
              className="group transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-lg"
              aria-label="Twitter"
            >
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-2 shadow-sm hover:shadow-md transition-all duration-200">
                <Twitter className="h-4 w-4 text-white" />
              </div>
            </Link>

            <Link
              href="https://github.com"
              className="group transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-900/10 rounded-lg"
              aria-label="GitHub"
            >
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-2 shadow-sm hover:shadow-md transition-all duration-200">
                <Github className="h-4 w-4 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
