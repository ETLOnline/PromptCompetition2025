"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import UserRoleManager from "@/components/SuperAdmin/UserRoleManager"

export default function SuperAdminPage() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    if (role !== null && role !== "superadmin") {
      setUnauthorized(true)
    }
  }, [role])

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 font-semibold text-lg">Access Denied: Superadmin only</p>
        </div>
      </div>
    )
  }

  if (!user || role !== "superadmin") {
    return null
  }

  return <UserRoleManager />
}
