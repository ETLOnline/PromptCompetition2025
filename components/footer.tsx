import Link from "next/link"
import { Linkedin, Instagram, Facebook, Youtube, Github, MessageCircle } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-slate-100 to-slate-150 border-t border-gray-200 py-12 md:py-16 relative shadow-lg">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-60" />

      <div className="container mx-auto max-w-6xl px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Competition Info */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">All Pakistan Prompt Engineering Competition</h3>
            <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">
              The premier national competition for prompt engineering skills, organized by ETL Online. 
              Empowering the next generation of AI professionals across Pakistan.
            </p>
            <div className="pt-2">
              <a 
                href="https://www.etlonline.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                Visit ETL Online →
              </a>
            </div>
          </div>

          {/* Competition Links */}
          <div className="space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Competition</h3>
            <nav aria-label="Competition Navigation">
              <ul className="space-y-3 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/#events"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-blue-600/20 rounded-md px-1 py-1"
                  >
                    Competition Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rules"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-blue-600/20 rounded-md px-1 py-1"
                  >
                    Rules & Guidelines
                  </Link>
                </li>
                <li>
                  <Link
                    href="/judge-info"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-blue-600/20 rounded-md px-1 py-1"
                  >
                    Judges
                  </Link>
                </li>
                {/* <li>
                  <Link
                    href="/leaderboard"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-blue-600/20 rounded-md px-1 py-1"
                  >
                    Leaderboard
                  </Link>
                </li> */}
              </ul>
            </nav>
          </div>

          {/* Support & Info Links */}
          <div className="space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Support & Info</h3>
            <nav aria-label="Support Navigation">
              <ul className="space-y-3 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/about"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-blue-600/20 rounded-md px-1 py-1"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sponsors"
                    className="font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-blue-600/20 rounded-md px-1 py-1"
                  >
                    Sponsors
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-xs sm:text-sm font-medium text-gray-700">
              © {currentYear} ETL Online. All rights reserved.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="https://www.linkedin.com/company/etlonline/"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600 group-hover:text-blue-800 transition-colors duration-200" />
            </Link>

            <Link
              href="https://chat.whatsapp.com/Dy8uKSyedZ19o70wLOxs6y"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-600/20"
              aria-label="WhatsApp Group"
            >
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600 group-hover:text-green-700 transition-colors duration-200" />
            </Link>

            <Link
              href="https://www.instagram.com/etlonline.official?igsh=ZDR6dmdjcTVtcjBi"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-pink-600/20"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-pink-600 group-hover:text-pink-700 transition-colors duration-200" />
            </Link>

            <Link
              href="https://www.facebook.com/share/1A1L82Yqmi/"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-700 group-hover:text-blue-800 transition-colors duration-200" />
            </Link>

            <Link
              href="https://www.youtube.com/@etlonline"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-600/20"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-red-600 group-hover:text-red-700 transition-colors duration-200" />
            </Link>

            <Link
              href="https://github.com/etlonline"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-700/20"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-gray-800 group-hover:text-black transition-colors duration-200" />
            </Link>
          </div>

        </div>
      </div>
    </footer>
  )
}