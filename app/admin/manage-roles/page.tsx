"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import UserRoleManager from "@/components/SuperAdmin/UserRoleManager"

export default function SuperAdminPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  // If not logged in → go to admin login
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login/admin")
    }
  }, [loading, user, router])

  // If logged in but not superadmin → go home
  useEffect(() => {
    if (!loading && role !== null && role !== "superadmin") {
      router.replace("/")
    }
  }, [loading, role, router])

  // Wait until auth resolves to avoid flicker
  if (loading) return null

  // Guard: only render for superadmin
  if (!user || role !== "superadmin") return null

  return <UserRoleManager />
}
