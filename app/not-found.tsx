"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* <header className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <a href="https://www.etlonline.org/" target="_blank" rel="noreferrer" className="flex items-center">
            <div className="rounded-xl p-2">
              <Image
                src="/images/Logo-for-Picton-Blue.png"
                alt="Empowerment Through Learning Logo"
                width={140}
                height={56}
                className="object-contain"
                priority
              />
            </div>
          </a>
        </div>
      </header> */}

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl w-full text-center py-20">
          <div className="inline-flex items-center justify-center mb-6 w-40 h-40 rounded-full bg-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1M12 8h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
          </div>

          <h1 className="text-6xl font-extrabold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Oops! The page you're looking for doesn't exist.</h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto mb-8">
            It might have been removed, had its name changed, or is temporarily unavailable. Try returning home or logging in if you expected to see content here.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Empowerment Through Learning
        </div>
      </footer>
    </div>
  )
}
