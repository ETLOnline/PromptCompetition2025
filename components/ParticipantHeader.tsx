// components/ParticipantHeader.tsx
"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge" 
import { Menu, ChevronDown, LogOut, Shield, Home, Trophy } from "lucide-react" 
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import Image from "next/image"

export default function ParticipantHeader() {
  // const { user, logout } = useAuth()
  const { user, fullName, role, logout } = useAuth()

  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string | undefined

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
        if (snap.exists()) setTitle((snap.data() as any)?.title || null)
      } catch (e) {
        console.error("Error fetching competition title:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchTitle()
  }, [competitionId])

  const getUserInitials = (name: string) => {
    if (!name) return "PA"
    const words = name.split(" ").filter(Boolean)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return words
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
  }

  // Get email from Clerk user object
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || ""
  
  const displayName = fullName || userEmail.split("@")[0] || "Participant"
  const userInitials = getUserInitials(fullName || userEmail || "Participant")

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Mobile Menu + Brand + Section Title */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Trigger (left) */}
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
                id="participant-mobile-sheet"
                side="left"
                className="bg-white w-80 p-0 overflow-y-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20 pointer-events-none"></div>
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
                      width={150}
                      height={120}
                      className="object-contain"
                    />
                  </a>
                </div>
                <div className="relative p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold text-gray-900">Navigation</h2>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <nav className="space-y-2" aria-label="Mobile Navigation">
                      <button
                        onClick={() => {
                          router.push("/")
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center px-4 py-3.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-white/80 hover:text-gray-900 hover:shadow-sm transition-all duration-200 group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                        <Home className="h-4 w-4 mr-3 relative z-10" />
                        <span className="relative z-10">Home</span>
                      </button>
                      <button
                        onClick={() => {
                          router.push("/participant")
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center px-4 py-3.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-white/80 hover:text-gray-900 hover:shadow-sm transition-all duration-200 group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                        <Trophy className="h-4 w-4 mr-3 relative z-10" />
                        <span className="relative z-10">Competitions</span>
                      </button>
                    </nav>
                  </div>
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-11 h-11 ring-2 ring-gray-100">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 flex-1">
                        <p className="text-sm font-semibold leading-none text-gray-900">{displayName}</p>
                        <p className="text-xs leading-none text-gray-500">{userEmail || "participant@example.com"}</p>
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs w-fit mt-1"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Participant
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        logout()
                        setIsOpen(false)
                      }}
                      variant="outline"
                      className="w-full gap-2 px-6 py-2.5 text-sm font-medium rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <a href="https://www.etlonline.org/" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <Image
                src="/images/Logo-for-Picton-Blue.png"
                alt="Empowerment Through Learning Logo"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </a>
            <div className="hidden md:flex flex-col">
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">
                    Welcome back, {displayName}
                </h1>

                {competitionId ? (
                    loading ? (
                    <div className="animate-pulse bg-gray-200 rounded h-4 w-40" />
                    ) : (
                    <p className="text-sm text-gray-500 leading-tight">
                        {title || "Competition"}
                    </p>
                    )
                ) : (
                    <p className="text-sm text-gray-500 leading-tight">
                    Explore competitions
                    </p>
                )}
                </div>
          </div>

          {/* Right: Nav + User menu (Desktop only) */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 font-medium"
            >
              Home
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push(`/participant`)}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 font-medium"
            >
              Competitions
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 hover:bg-gray-50 px-3 py-2 h-auto rounded-lg"
                >
                  <Avatar className="w-10 h-10 ring-2 ring-gray-100">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{userEmail || "participant@example.com"}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 shadow-lg border-gray-200">
                <DropdownMenuLabel className="font-normal py-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-11 h-11 ring-2 ring-gray-100">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-gray-900">{displayName}</p>
                      <p className="text-xs leading-none text-gray-500">{userEmail || "participant@example.com"}</p>
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-xs w-fit mt-1"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Participant
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
  )
}