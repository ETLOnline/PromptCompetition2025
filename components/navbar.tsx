"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogIn, UserPlus, X } from "lucide-react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  // const { user } = useAuth() // Uncomment if useAuth is implemented and needed

  const navItems = [
    { label: "Events", href: "/#events" },
    { label: "Rules", href: "/rules" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Contact Us", href: "/#contact" },
    { label: "About", href: "/about" },
  ]

  return (
    <header className="w-full relative">
      {/* Main Navigation Container */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="flex h-20 items-center justify-between px-4">
            {/* Logo Section */}
            <div className="flex items-center">
              <a
                href="https://www.etlonline.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center transition-all duration-200 hover:opacity-80"
                aria-label="Empowerment Through Learning Homepage"
              >
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                  <Image
                    src="/images/Logo-for-Picton-Blue.png"
                    alt="Empowerment Through Learning Logo"
                    width={300}
                    height={130}
                    className="h-10 w-auto"
                    priority
                  />
                </div>
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="px-6 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons & Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Desktop Auth Buttons */}
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  asChild
                  className="gap-2 px-6 py-3 text-sm font-medium rounded-lg border-gray-200 text-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <Link href="/auth/login">
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                </Button>

                <Button
                  asChild
                  className="gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-600 hover:to-gray-500 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Link href="/auth/register">
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
              </div>

              {/* Mobile Menu Trigger */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Open Menu"
                    className="p-2 border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    <Menu className="h-4 w-4 text-gray-600" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>

                {/* Mobile Menu Content */}
                <SheetContent
                  side="right"
                  className="bg-white border-l border-gray-200 w-80 p-0"
                >
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <Image
                          src="/images/Logo-for-Picton-Blue.png"
                          alt="ETL Logo"
                          width={120}
                          height={52}
                          className="h-6 w-auto"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg"
                      aria-label="Close Menu"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">Navigation</h2>
                      <nav className="space-y-1" aria-label="Mobile Navigation">
                        {navItems.map((item, index) => (
                          <Link
                            key={index}
                            href={item.href}
                            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                            onClick={() => setIsOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </nav>
                    </div>

                    {/* Mobile Auth Section */}
                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                        Account
                      </h3>
                      <div className="space-y-3">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start gap-3 px-4 py-3 text-sm font-medium rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        >
                          <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <LogIn className="h-4 w-4 text-gray-600" />
                            </div>
                            Login to your account
                          </Link>
                        </Button>

                        <Button
                          asChild
                          className="w-full justify-start gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-600 hover:to-gray-500 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <UserPlus className="h-4 w-4 text-white" />
                            </div>
                            Create new account
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Footer */}
                    <div className="pt-6 mt-6 border-t border-gray-100">
                      <p className="text-xs text-gray-500 text-center">
                        © 2024 Empowerment Through Learning
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}