"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Trophy } from "lucide-react"

interface UserProfile {
  uid: string
  email: string
  role: string
  displayName?: string | null
  photoURL?: string | null
}

interface PageHeaderProps {
  user: UserProfile | null
  onLogout: () => void
  competitionCount: number
}

export const PageHeader = ({ user, onLogout, competitionCount }: PageHeaderProps) => {
  return (
    <>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/images/Logo-for-Picton-Blue.png"
                alt="Empowerment Through Learning Logo"
                width={300}
                height={130}
                className="h-12 w-auto"
                priority
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">Participant Dashboard</h1>
              </div>
            </div>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-10 rounded-full pr-2 pl-1 border border-gray-200 hover:bg-gray-50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.photoURL || "/placeholder.svg?height=100&width=100&query=user-avatar"}
                        alt={user.displayName || "User"}
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-700 font-medium text-sm">
                        {user.displayName
                          ? user.displayName.charAt(0).toUpperCase()
                          : user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Available Competitions</h2>
            <p className="text-gray-600 text-sm">
              {competitionCount} competition{competitionCount !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
