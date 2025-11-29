"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Menu, LogIn, UserPlus, X, ChevronDown, LayoutDashboard } from "lucide-react"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { useAuth } from "@/components/auth-provider"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { role, loading } = useAuth()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Tutorials", href: "/tutorial" },
    { label: "Rules", href: "/rules" },
    { label: "Judges", href: "/judge-info" },
    // { label: "Leaderboard", href: "/leaderboard" },
    { label: "Sponsors", href: "/sponsors" },
  ]

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!role) return "/profile-setup"
    
    switch (role) {
      case "admin":
      case "superadmin":
        return "/admin"
      case "judge":
        return "/judge"
      case "participant":
        return "/participant"
      default:
        return "/profile-setup"
    }
  }

  return (
    <header className="w-full fixed top-0 z-50 transition-all duration-300">
      {/* Main Navigation Container */}
      <div className="transition-all duration-300 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto max-w-7xl">
          <div className="flex h-14 sm:h-20 items-center justify-between px-2 sm:px-6">
            {/* Left Section: Mobile Trigger + Logo */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Menu Trigger (left) */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Open Menu"
                    className="p-1.5 sm:p-2 rounded-lg transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gray-50 transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"></div>
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 transition-all duration-300 group-hover:scale-110 relative z-10" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                {/* Mobile Menu Content */}
                <SheetContent
                  id="mobile-sheet"
                  side="left"
                  className="bg-white w-80 p-0 overflow-y-auto"
                >
                  {/* Decorative background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20 pointer-events-none"></div>
                  {/* Mobile Header with accessible title */}
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="relative flex items-center justify-center p-6 bg-white/50 border-b border-gray-100">
                    <a
                      href="https://www.etlonline.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center transition-opacity duration-300 hover:opacity-80"
                    >
                      <Image
                        src="/images/Logo-for-Picton-Blue.png"
                        alt="Empowerment Through Learning Logo"
                        width={120}
                        height={96}
                        className="object-contain"
                      />
                    </a>
                  </div>
                  {/* Mobile Navigation */}
                  <div className="relative p-6 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-base font-bold text-gray-900">Navigation</h2>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <nav className="space-y-2" aria-label="Mobile Navigation">
                        {navItems.map((item, index) => (
                          <Link
                            key={index}
                            href={item.href}
                            className="flex items-center px-3 py-2.5 text-xs sm:text-sm font-medium text-gray-700 rounded-lg hover:bg-white/80 hover:text-gray-900 hover:shadow-sm transition-all duration-200 group relative overflow-hidden"
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mr-2 sm:mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-125 relative z-10"></div>
                            <span className="relative z-10">{item.label}</span>
                          </Link>
                        ))}
                      </nav>
                    </div>
                    <div className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Account</h3>
                      </div>
                      <div className="space-y-3">
                        <SignedOut>
                          <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                            <Button
                              variant="outline"
                              className="w-full gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg border-gray-200 text-gray-700 hover:border-gray-300 transition-all duration-300 group relative overflow-hidden mb-3"
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 group-hover:scale-105 relative z-10" />
                              <span className="relative z-10 group-hover:text-gray-900 transition-colors duration-300">Login</span>
                            </Button>
                          </Link>
                          <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                            <Button
                              className="w-full gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg text-white shadow-lg transition-all duration-300 group relative overflow-hidden"
                              style={{ backgroundColor: '#0f172a' }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                              <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 group-hover:scale-105 relative z-10" />
                              <span className="relative z-10 transition-all duration-300 group-hover:text-white">Sign Up</span>
                            </Button>
                          </Link>
                        </SignedOut>
                        <SignedIn>
                          <div className="flex items-center justify-center mb-3">
                            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: { width: "40px", height: "40px", backgroundColor: "#0f172a" }, userButtonPopoverCard: "shadow-xl", userButtonPopoverActionButton: "hover:bg-gray-100" } }} />
                          </div>
                          <Link href={getDashboardUrl()} onClick={() => setIsOpen(false)}>
                            <Button
                              disabled={loading}
                              className="w-full gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg text-white shadow-lg transition-all duration-300 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ backgroundColor: '#0f172a' }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                              <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 group-hover:scale-105 relative z-10" />
                              <span className="relative z-10 transition-all duration-300 group-hover:text-white">Dashboard</span>
                            </Button>
                          </Link>
                        </SignedIn>
                      </div>
                    </div>
                    <div className="pt-6">
                      <div className="text-center">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-2">© 2024 Empowerment Through Learning</p>
                        <div className="flex justify-center">
                          <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <a
                href="https://www.etlonline.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center transition-opacity duration-300 hover:opacity-80"
                aria-label="Empowerment Through Learning Homepage"
              >
                <div className="relative rounded-xl p-0.5 sm:p-1">
                  <Image
                    src="/images/Logo-for-Picton-Blue.png"
                    alt="Empowerment Through Learning Logo"
                    width={120}
                    height={96}
                    className="object-contain w-[70px] sm:w-[100px] lg:w-[150px] h-auto"
                    priority
                  />
                </div>
              </a>
            </div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center flex-1 justify-center" aria-label="Main Navigation">
              <div className="flex items-center">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="relative px-3 lg:px-5 py-2 lg:py-2.5 text-xs lg:text-sm font-medium text-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 group overflow-hidden rounded-lg"
                  >
                    {/* Subtle background that slides in */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-lg"></div>
                    {/* Bottom border indicator */}
                    <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform -translate-x-1/2 group-hover:w-3/4 transition-all duration-300"></div>
                    <span className="relative z-10 group-hover:text-gray-900 transition-colors duration-300">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Auth Buttons - Right Aligned (mobile + desktop) */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2">
              {/* Auth Buttons - Visible on all screen sizes */}
              <SignedOut>
                {/* Login Button - Compact on mobile with text, full on larger screens */}
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 px-2 py-1.5 sm:px-4 lg:gap-2 lg:px-6 lg:py-2.5 text-xs sm:text-sm font-medium rounded-lg border-gray-200 text-gray-700 hover:border-gray-300 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 group-hover:scale-105 relative z-10" />
                    <span className="relative z-10 group-hover:text-gray-900 transition-colors duration-300">Login</span>
                  </Button>
                </Link>

                {/* Sign Up Button - Compact on mobile with text, full on larger screens */}
                <Link href="/auth/register">
                  <Button
                    size="sm"
                    className="gap-1 px-2 py-1.5 sm:px-4 lg:gap-2 lg:px-6 lg:py-2.5 text-xs sm:text-sm font-medium rounded-lg text-white shadow-lg transition-all duration-300 group relative overflow-hidden"
                    style={{ backgroundColor: '#0f172a' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                    <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 group-hover:scale-105 relative z-10" />
                    <span className="relative z-10 transition-all duration-300 group-hover:text-white">Register Now</span>
                  </Button>
                </Link>
              </SignedOut>

              <SignedIn>
                {/* User Avatar Button */}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: "28px",
                        height: "28px",
                        backgroundColor: "#0f172a",
                      },
                      userButtonPopoverCard: "shadow-xl",
                      userButtonPopoverActionButton: "hover:bg-gray-100",
                    },
                  }}
                />

                {/* Dashboard Button - Compact on mobile with text, full on larger screens */}
                <Link href={getDashboardUrl()}>
                  <Button
                    disabled={loading}
                    size="sm"
                    className="gap-1 px-2 py-1.5 sm:px-4 lg:gap-2 lg:px-6 lg:py-2.5 text-xs sm:text-sm font-medium rounded-lg text-white shadow-lg transition-all duration-300 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#0f172a' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                    <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 group-hover:scale-105 relative z-10" />
                    <span className="relative z-10 transition-all duration-300 group-hover:text-white">Dashboard</span>
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}