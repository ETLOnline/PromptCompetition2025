"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge" 
import { Menu, Home, Trophy, User, ChevronDown, LogOut, Shield } from "lucide-react" 
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import Image from "next/image"

import { JudgeBreadcrumbs } from "@/components/judge-breadcrumbs"

export default function JudgeHeader() {
  const { user, fullName, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const [title, setTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchTitle = async () => {
      if (!competitionId) {
        setLoading(false)
        return
      }

      try {
        const ref = doc(db, "competitions", competitionId)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setTitle(snap.data()?.title || null)
        }
      } catch (error) {
        console.error("Error fetching competition title:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTitle()
  }, [competitionId])

  const getUserInitials = (name: string) => {
    if (!name) return "JU"
    const words = name.split(" ").filter(Boolean)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  }

  // Use fullName from context, fallback to email username
  const displayFullName = fullName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Judge"
  const userInitials = getUserInitials(displayFullName)

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Section - Mobile menu button, Logo and Title */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Mobile menu button (extreme left) */}
            <Button variant="ghost" className="p-2 mr-2 sm:hidden" onClick={() => setIsOpen(true)}>
              <Menu className="h-6 w-6 text-gray-700" />
            </Button>
            <div className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              {/* Logo (External Link) */}
              <div className="flex-shrink-0">
                <a
                  href="https://www.etlonline.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src="/images/Logo-for-Picton-Blue.png"
                    alt="Empowerment Through Learning Logo"
                    width={120}
                    height={120}
                    className="object-contain"
                    priority
                  />
                </a>
              </div>

              {/* Title (Conditional internal navigation) - hidden on mobile */}
              <div className="hidden sm:flex flex-col">
                <h1
                  onClick={() => router.push(`/judge/${competitionId}`)}
                  className="text-xl font-semibold text-gray-900 leading-tight cursor-pointer"
                >
                  Welcome back, {displayFullName.split(" ")[0]}
                </h1>

                {competitionId && (
                  loading ? (
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-40" />
                  ) : (
                    <p className="text-sm text-gray-500 leading-tight">
                      {title || "Competition"}
                    </p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Section - User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/?redirect=false")}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 font-medium"
              >
                Home
              </Button>

              <Button
                variant="ghost"
                onClick={() => router.push(`/judge`)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 font-medium"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push(`/participant`)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 font-medium"
              >
                Participant Dashboard
              </Button>
            </div>

            {/* Mobile sheet content (trigger moved to left) */}
            <div className="sm:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="relative flex items-center justify-center p-6 bg-white/50 border-b border-gray-100">
                    <a href="https://www.etlonline.org/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                      <img src="/images/Logo-for-Picton-Blue.png" alt="ETL" className="h-10 object-contain" />
                    </a>
                  </div>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="p-6 space-y-6">
                    <nav className="space-y-2">
                      <button
                        onClick={() => { router.push("/?redirect=false"); setIsOpen(false) }}
                        className="w-full flex items-center px-4 py-3.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-white/80 hover:text-gray-900 transition-all duration-200"
                      >
                        <Home className="h-4 w-4 mr-3" />
                        Home
                      </button>
                      <button
                        onClick={() => { router.push(`/judge`); setIsOpen(false) }}
                        className="w-full flex items-center px-4 py-3.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-white/80 hover:text-gray-900 transition-all duration-200"
                      >
                        <Trophy className="h-4 w-4 mr-3" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => { router.push(`/participant`); setIsOpen(false) }}
                        className="w-full flex items-center px-4 py-3.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-white/80 hover:text-gray-900 transition-all duration-200"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Participant Dashboard
                      </button>
                    </nav>

                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="w-11 h-11 ring-2 ring-gray-100">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">{userInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1 flex-1">
                          <p className="text-sm font-semibold leading-none text-gray-900">{displayFullName}</p>
                          <p className="text-xs leading-none text-gray-500">{user?.primaryEmailAddress?.emailAddress || "judge@example.com"}</p>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs w-fit mt-1">
                            <Shield className="w-3 h-3 mr-1" />
                            Judge
                          </Badge>
                        </div>
                      </div>

                      <Button
                        onClick={() => { logout(); setIsOpen(false) }}
                        variant="outline"
                        className="w-full gap-2 px-6 py-2.5 text-sm font-medium rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop: avatar + dropdown (unchanged) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 hover:bg-gray-50 px-3 py-2 h-auto rounded-lg"
                >
                  <Avatar className="w-10 h-10 ring-2 ring-gray-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{displayFullName}</p>
                    <p className="text-xs text-gray-500">{user?.primaryEmailAddress?.emailAddress || "judge@example.com"}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 shadow-lg border-gray-200">
                <DropdownMenuLabel className="font-normal py-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-11 h-11 ring-2 ring-gray-100">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-gray-900">{displayFullName}</p>
                      <p className="text-xs leading-none text-gray-500">{user?.primaryEmailAddress?.emailAddress || "judge@example.com"}</p>
                                          <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-xs w-fit mt-1"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Judge
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
      {/* Breadcrumbs row below header */}
      <JudgeBreadcrumbs />
    </>
  )
}