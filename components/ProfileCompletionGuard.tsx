"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useUserProfile } from "@/hooks/useUserProfile"

/**
 * Client-side component to handle profile completion checks
 * Replaces the middleware logic that was causing Edge Runtime issues
 */
export function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user: clerkUser, isLoaded } = useUser()
  const { userProfile, loading: profileLoading } = useUserProfile()

  useEffect(() => {
    // Skip if not fully loaded
    if (!isLoaded || profileLoading) return

    // Skip if no user (will be handled by auth middleware)
    if (!clerkUser) return

    // Skip if already on profile setup page
    if (pathname?.startsWith('/profile-setup')) return

    // Skip for public routes (these are handled by middleware)
    const publicRoutes = ['/', '/about', '/rules', '/leaderboard']
    if (publicRoutes.some(route => pathname === route || pathname?.startsWith(route + '/'))) return

    // Skip for auth routes
    if (pathname?.startsWith('/auth/')) return

    // Check if profile is complete
    if (!userProfile?.role) {
      // User exists in Clerk but doesn't have a complete profile in Firestore
      console.log("Redirecting to profile setup - no role found")
      router.push('/profile-setup')
    }
  }, [isLoaded, profileLoading, clerkUser, userProfile, pathname, router])

  return <>{children}</>
}