// app/admin/superadmin/page.tsx

"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import UserRoleManager from "@/components/SuperAdmin/UserRoleManager"

export default function SuperAdminPage() {
  const { user, role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (role !== "superadmin") {
      router.push("/") // redirect if not superadmin
    }
  }, [role, router])

  if (!user || role !== "superadmin") return null

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 text-white">
      <h1 className="text-3xl font-bold text-[#56ffbc]">Super Admin Control Panel</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Admin & Judge Management</h2>
        <UserRoleManager />
      </section>
    </div>
  )
}
