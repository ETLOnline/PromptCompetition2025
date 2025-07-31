"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogIn, UserPlus } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const navItems = [
    { label: "Events", href: "/#events" },
    { label: "Rules", href: "/rules" },
    { label: "Contact Us", href: "/#contact" },
    { label: "About", href: "/about" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full relative overflow-hidden">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-[-2] opacity-60"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      >
        <source src="https://cocoon.ae/wp-content/uploads/2024/10/gradient-template-kit.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/80 z-[-1]" />

      {/* Main Navigation Container */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 shadow-lg">
        <div className="container mx-auto max-w-6xl">
          <div className="flex h-20 items-center justify-between px-4">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                aria-label="Competition Homepage"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <Image
                    src="/images/ETL-White-logo.png"
                    alt="Empowerment Through Learning Logo"
                    width={200}
                    height={48}
                    className="h-12 w-auto"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-white/90 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Auth Buttons & Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <Button
                  asChild
                  variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/10 border border-white/20 rounded-lg transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-white/20"
                >
                  <Link href="/auth/login">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-md p-1 mr-2">
                      <LogIn className="h-3 w-3 text-white" />
                    </div>
                    Login
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-gray-900/10"
                >
                  <Link href="/auth/register">
                    <div className="bg-white/20 rounded-md p-1 mr-2">
                      <UserPlus className="h-3 w-3" />
                    </div>
                    Sign Up
                  </Link>
                </Button>
              </div>

              {/* Mobile Menu Trigger */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open Menu"
                    className="text-white/90 hover:text-white hover:bg-white/10 border border-white/20 rounded-lg transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-white/20"
                  >
                    <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-md p-1">
                      <Menu className="h-4 w-4 text-white" />
                    </div>
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>

                {/* Mobile Menu Content */}
                <SheetContent
                  side="right"
                  className="bg-gradient-to-b from-slate-100 to-slate-150 border-l border-gray-200 shadow-xl w-80"
                >
                  <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Navigation</h2>

                    <nav className="flex flex-col gap-2" aria-label="Mobile Navigation">
                      {navItems.map((item, index) => (
                        <Link
                          key={index}
                          href={item.href}
                          className="px-4 py-3 text-base font-medium text-gray-700 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>

                    {/* Mobile Auth Buttons */}
                    <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-gray-200">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200 hover:shadow-sm focus:ring-2 focus:ring-gray-900/10 bg-transparent"
                      >
                        <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                          <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-md p-1 mr-3">
                            <LogIn className="h-3 w-3 text-white" />
                          </div>
                          Login
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-gray-900/10"
                      >
                        <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                          <div className="bg-white/20 rounded-md p-1 mr-3">
                            <UserPlus className="h-3 w-3" />
                          </div>
                          Sign Up
                        </Link>
                      </Button>
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
