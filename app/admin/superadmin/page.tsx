"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import UserRoleManager from "@/components/SuperAdmin/UserRoleManager"
import { Crown, Shield, Settings, Users, Activity, AlertTriangle } from "lucide-react"

export default function SuperAdminPage() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Add a small delay to ensure auth is fully loaded
    const timer = setTimeout(() => {
      if (role !== "superadmin" && role !== null) {
        router.push("/")
      }
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [role, router])

  // Show loading while checking authentication
  if (isLoading || role === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#07073a] to-[#0a0a4a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56ffbc] mx-auto mb-4"></div>
          <p className="text-white">Verifying super admin access...</p>
        </div>
      </div>
    )
  }

  // Redirect if not superadmin
  if (!user || role !== "superadmin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#07073a] to-[#0a0a4a] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">Super admin privileges required</p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#56ffbc] text-[#07073a] px-6 py-2 rounded-lg font-semibold hover:bg-[#3cf0a3] transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07073a] to-[#0a0a4a]">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-[#121244] rounded-lg p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <Crown className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#56ffbc] flex items-center gap-2">
                  Super Admin Control Panel
                </h1>
                <p className="text-gray-400 mt-1">
                  Manage users, roles, and system access
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-white font-semibold">
                Welcome, {user.displayName || user.email}
              </p>
              <p className="text-gray-400 text-sm">Super Administrator</p>
            </div>
          </div>
        </div>



        {/* Main Content */}
        <section className="bg-[#121244] rounded-lg border border-white/10">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#56ffbc]" />
              <h2 className="text-2xl font-semibold text-white">
                User & Role Management
              </h2>
            </div>
            <p className="text-gray-400 mt-2">
              Comprehensive user management with role-based access control
            </p>
          </div>
          
          <div className="p-6">
            <UserRoleManager />
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Super Admin Panel • Secure Role Management • Platform Administration</p>
        </div>
      </div>
    </div>
  )
}