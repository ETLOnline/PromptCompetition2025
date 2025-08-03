// app/admin/layout.tsx
import type { Metadata } from "next"
import AdminHeader from "@/components/AdminHeader"

export const metadata: Metadata = {
  title: "Admin | Empowerment Through Learning",
  description: "Admin interface for managing competitions and users.",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
