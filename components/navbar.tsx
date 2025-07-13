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
    { label: "Events", href: "/events" },
    { label: "Rules", href: "/rules" },
    { label: "Contact Us", href: "/contact" },
    { label: "About", href: "/about" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full relative overflow-hidden">
      <video className="absolute inset-0 w-full h-full object-cover z-[-1] opacity-70" autoPlay loop muted playsInline>
        <source src="https://cocoon.ae/wp-content/uploads/2024/10/gradient-template-kit.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2" aria-label="Competition Homepage">
            <Image
              src="/images/ETL-White-logo.png"
              alt="Empowerment Through Learning Logo"
              width={250}
              height={60}
              className="h-16 w-auto"
              priority
            />
          </Link>
        </div>

        <nav className="hidden md:flex gap-6" aria-label="Main Navigation">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="text-sm font-medium text-white transition-colors hover:text-[#56ffbc]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Button
              asChild
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#56ffbc] hover:bg-[#56ffbc]/90 text-[#07073a] rounded-xl border-0 h-auto font-medium"
            >
              <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>Dashboard</Link>
            </Button>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" className="text-white hover:text-[#56ffbc] hover:bg-[#56ffbc]/10">
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
              <Button asChild className="bg-[#56ffbc] hover:bg-[#56ffbc]/90 text-[#07073a] rounded-xl font-medium">
                <Link href="/auth/register">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Sign Up
                </Link>
              </Button>
            </div>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open Menu"
                className="text-white hover:text-[#56ffbc] hover:bg-[#56ffbc]/10"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#07073a] border-[#56ffbc]/20">
              <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile Navigation">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="text-lg font-medium text-white transition-colors hover:text-[#56ffbc]"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 mt-6">
                  {user ? (
                    <Button
                      asChild
                      className="w-full bg-[#56ffbc] hover:bg-[#56ffbc]/90 text-[#07073a] rounded-xl font-medium"
                    >
                      <Link href={user.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full text-white hover:text-[#56ffbc] hover:bg-[#56ffbc]/10 justify-start"
                      >
                        <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                          <LogIn className="h-4 w-4 mr-2" />
                          Login
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full bg-[#56ffbc] hover:bg-[#56ffbc]/90 text-[#07073a] rounded-xl font-medium"
                      >
                        <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
