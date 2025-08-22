"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogIn, UserPlus, X, ChevronDown } from "lucide-react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  // const { user } = useAuth() // Uncomment if useAuth is implemented and needed

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: "Events", href: "/#events" },
    { label: "Rules", href: "/rules" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Contact Us", href: "/#contact" },
    { label: "About", href: "/about" },
  ]

  return (
    <header className="w-full fixed top-0 z-50 transition-all duration-300">
      {/* Main Navigation Container */}
      <div className={`transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-lg' 
          : 'bg-white border-b border-gray-100 shadow-sm'
      }`}>
        <div className="container mx-auto max-w-7xl">
          <div className="flex h-20 items-center justify-between px-6">
            {/* Logo Section */}
            <div className="flex items-center">
              <a
                href="https://www.etlonline.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center group transition-all duration-300"
                aria-label="Empowerment Through Learning Homepage"
              >
                <div className="relative rounded-xl p-2 group-hover:shadow-md transition-all duration-300 overflow-hidden">
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src="/images/Logo-for-Picton-Blue.png"
                    alt="Empowerment Through Learning Logo"
                    width={150}
                    height={120}
                    className="object-contain"
                    priority
                  />
                </div>
              </a>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center" aria-label="Main Navigation">
              <div className="flex items-center">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="relative px-5 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 group"
                  >
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Auth Buttons & Mobile Menu */}
            <div className="flex items-center gap-4">
              {/* Desktop Auth Buttons */}
              <div className="hidden lg:flex items-center gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="gap-2 px-6 py-2.5 text-sm font-medium rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <Link href="/auth/login">
                    <LogIn className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    Login
                  </Link>
                </Button>

                <Button
                  asChild
                  className="gap-2 px-6 py-2.5 text-sm font-medium rounded-xl bg-gray-700 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  <Link href="/auth/register">
                    <UserPlus className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
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
                    className="p-2.5 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                  >
                    <Menu className="h-5 w-5 text-gray-600 transition-transform duration-200 group-hover:scale-110" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>

                {/* Mobile Menu Content */}
                <SheetContent
                  side="right"
                  className="bg-white/98 backdrop-blur-xl w-80 p-0 overflow-hidden"
                >
                  {/* Decorative background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20"></div>
                  
                  {/* Mobile Header */}
                  <div className="relative flex items-center justify-between p-6 bg-white/50">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2.5">
                        <Image
                          src="/images/Logo-for-Picton-Blue.png"
                          alt="ETL Logo"
                          width={120}
                          height={52}
                          className="h-7 w-auto"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600">Menu</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/80 rounded-xl transition-all duration-200"
                      aria-label="Close Menu"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="relative p-6 space-y-6">
                    {/* Navigation Links */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Navigation</h2>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                      <nav className="space-y-2" aria-label="Mobile Navigation">
                        {navItems.map((item, index) => (
                          <Link
                            key={index}
                            href={item.href}
                            className="flex items-center px-4 py-3.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-white/80 hover:text-gray-900 hover:shadow-sm transition-all duration-200 group"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                            {item.label}
                          </Link>
                        ))}
                      </nav>
                    </div>

                    {/* Mobile Auth Section */}
                    <div className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                          Account
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full justify-start gap-4 px-4 py-4 text-sm font-medium rounded-xl text-gray-700 hover:bg-white/80 hover:shadow-sm transition-all duration-200 group"
                        >
                          <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-blue-50 group-hover:to-indigo-50 transition-all duration-200">
                              <LogIn className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
                            </div>
                            <div>
                              <p className="font-medium">Login</p>
                              <p className="text-xs text-gray-500">Access your account</p>
                            </div>
                          </Link>
                        </Button>

                        <Button
                          asChild
                          className="w-full justify-start gap-4 px-4 py-4 text-sm font-medium rounded-xl bg-gray-700 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 group"
                        >
                          <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200">
                              <UserPlus className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">Sign Up</p>
                              <p className="text-xs text-blue-100">Create new account</p>
                            </div>
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Footer */}
                    <div className="pt-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">
                          © 2024 Empowerment Through Learning
                        </p>
                        <div className="flex justify-center">
                          <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
                        </div>
                      </div>
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