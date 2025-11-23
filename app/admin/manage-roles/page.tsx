"use client"

import { useAuth } from "@clerk/nextjs"
import { fetchWithAuth } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import UserRoleManager from "@/components/SuperAdmin/UserRoleManager"

export default function SuperAdminPage() {
  const router = useRouter()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_SUPER_AUTH}`, 
        {}, 
        getToken
      )
    } 
    catch (error) {
      console.error("Authentication failed:", error)
      router.push("/")
    } 
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      checkAuth()
    } else if (isLoaded && !isSignedIn) {
      router.push("/")
    }
  }, [isLoaded, isSignedIn])

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Checking authentication...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return null // Will redirect
  }

  return <UserRoleManager />
}
