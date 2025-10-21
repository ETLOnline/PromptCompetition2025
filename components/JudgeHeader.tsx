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
import { ChevronDown, LogOut } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import Image from "next/image"

export default function JudgeHeader() {
  const { user, fullName, logout } = useAuth()
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const [title, setTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
  const displayFullName = fullName || user?.email?.split("@")[0] || "Judge"
  const userInitials = getUserInitials(displayFullName)

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Section - Logo and Title */}
          <div className="flex items-center space-x-3 sm:space-x-4">
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

              {/* Title (Conditional internal navigation) */}
              <div className="flex flex-col">
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
            <Button
              variant="ghost"
              onClick={() => router.push(`/judge`)}
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
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{displayFullName}</p>
                    <p className="text-xs text-gray-500">{user?.email || "judge@example.com"}</p>
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
                      <p className="text-xs leading-none text-gray-500">{user?.email || "judge@example.com"}</p>
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