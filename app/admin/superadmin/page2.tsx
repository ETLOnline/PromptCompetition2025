"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import UserRoleManager from "@/components/SuperAdmin/UserRoleManager2"
import { Crown, AlertTriangle } from "lucide-react"

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying super admin access...</p>
        </div>
      </div>
    )
  }

  // Redirect if not superadmin
  if (!user || role !== "superadmin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">Super admin privileges required to access this page</p>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Main Content - UserRoleManager Component */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <UserRoleManager />
        </div>
        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-6 py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>Super Admin Panel</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>Secure Role Management</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>Platform Administration</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}