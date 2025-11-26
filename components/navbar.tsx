"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
    { label: "Events", href: "/#events" },
    { label: "Rules", href: "/rules" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Contact Us", href: "/#contact" },
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
      <div className={`transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-lg' 
          : 'bg-white border-b border-gray-100 shadow-sm'
      }`}>
        <div className="container mx-auto max-w-7xl">
          <div className="flex h-20 items-center justify-between px-6">
            {/* Logo Section - Left Aligned */}
            <div className="flex items-center">
              <a
                href="https://www.etlonline.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center transition-opacity duration-300 hover:opacity-80"
                aria-label="Empowerment Through Learning Homepage"
              >
                <div className="relative rounded-xl p-2">
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

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center flex-1 justify-center" aria-label="Main Navigation">
              <div className="flex items-center">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="relative px-5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 group overflow-hidden rounded-lg"
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

            {/* Auth Buttons & Mobile Menu - Right Aligned */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Desktop Auth Buttons */}
              <div className="hidden lg:flex items-center gap-3">
                <SignedOut>
                  <Link href="/auth/login">
                    <Button
                      variant="outline"
                      className="gap-2 px-6 py-2.5 text-sm font-medium rounded-lg border-gray-200 text-gray-700 hover:border-gray-300 transition-all duration-300 group relative overflow-hidden"
                    >
                      {/* Subtle slide-up background */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <LogIn className="h-4 w-4 transition-all duration-300 group-hover:scale-105 relative z-10" />
                      <span className="relative z-10 group-hover:text-gray-900 transition-colors duration-300">Login</span>
                    </Button>
                  </Link>

                  <Link href="/auth/register">
                    <Button
                      className="gap-2 px-6 py-2.5 text-sm font-medium rounded-lg text-white shadow-lg transition-all duration-300 group relative overflow-hidden"
                      style={{ backgroundColor: '#10142c' }}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Light shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                      <UserPlus className="h-4 w-4 transition-all duration-300 group-hover:scale-105 relative z-10" />
                      <span className="relative z-10 transition-all duration-300 group-hover:text-white">Sign Up</span>
                    </Button>
                  </Link>
                </SignedOut>

                <SignedIn>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: {
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#0f172a",
                        },
                        userButtonPopoverCard: "shadow-xl",
                        userButtonPopoverActionButton: "hover:bg-gray-100",
                      },
                    }}
                  />

                  <Link href={getDashboardUrl()}>
                    <Button
                      disabled={loading}
                      className="gap-2 px-6 py-2.5 text-sm font-medium rounded-lg text-white shadow-lg transition-all duration-300 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#10142c' }}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Light shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                      <LayoutDashboard className="h-4 w-4 transition-all duration-300 group-hover:scale-105 relative z-10" />
                      <span className="relative z-10 transition-all duration-300 group-hover:text-white">Go to Dashboard</span>
                    </Button>
                  </Link>
                </SignedIn>
              </div>

              {/* Mobile Menu Trigger */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Open Menu"
                    className="p-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gray-50 transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"></div>
                    <Menu className="h-5 w-5 text-gray-600 transition-all duration-300 group-hover:scale-110 relative z-10" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>

                {/* Mobile Menu Content */}
                <SheetContent
                  id="mobile-sheet"
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
                            className="flex items-center px-4 py-3.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-white/80 hover:text-gray-900 hover:shadow-sm transition-all duration-200 group relative overflow-hidden"
                            onClick={() => setIsOpen(false)}
                          >
                            {/* Slide-in background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-125 relative z-10"></div>
                            <span className="relative z-10">{item.label}</span>
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
                        <SignedOut>
                          <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                            <Button
                              variant="outline"
                              className="w-full justify-start gap-4 px-4 py-4 text-sm font-medium rounded-lg text-gray-700 hover:bg-white/80 hover:shadow-sm transition-all duration-300 group relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group-hover:from-blue-50 group-hover:to-indigo-50 transition-all duration-300 relative z-10">
                                <LogIn className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                              </div>
                              <div className="relative z-10">
                                <p className="font-medium">Login</p>
                                <p className="text-xs text-gray-500">Access your account</p>
                              </div>
                            </Button>
                          </Link>

                          <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                            <Button
                              className="w-full justify-start gap-4 px-4 py-4 text-sm font-medium rounded-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                              style={{ backgroundColor: '#10142c' }}
                            >
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 relative z-10">
                                <UserPlus className="h-5 w-5 text-white" />
                              </div>
                              <div className="relative z-10">
                                <p className="font-medium">Sign Up</p>
                                <p className="text-xs text-blue-100">Create new account</p>
                              </div>
                            </Button>
                          </Link>
                        </SignedOut>

                        <SignedIn>
                          <Link href={getDashboardUrl()} onClick={() => setIsOpen(false)}>
                            <Button
                              disabled={loading}
                              className="w-full justify-start gap-4 px-4 py-4 text-sm font-medium rounded-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                              style={{ backgroundColor: '#10142c' }}
                            >
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 relative z-10">
                                <LayoutDashboard className="h-5 w-5 text-white" />
                              </div>
                              <div className="relative z-10">
                                <p className="font-medium">Go to Dashboard</p>
                                <p className="text-xs text-blue-100">Access your workspace</p>
                              </div>
                            </Button>
                          </Link>

                          <div className="flex flex-col items-center justify-center p-6 bg-white/60 rounded-lg border border-gray-200">
                            <UserButton 
                              afterSignOutUrl="/"
                              appearance={{
                                elements: {
                                  avatarBox: {
                                    width: "64px",
                                    height: "64px",
                                    backgroundColor: "#0f172a",
                                  },
                                  userButtonPopoverCard: "shadow-xl",
                                  userButtonPopoverActionButton: "hover:bg-gray-100",
                                },
                              }}
                            />
                            <p className="mt-3 text-sm text-gray-600 font-medium">
                              Click to manage your account
                            </p>
                          </div>
                        </SignedIn>
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