"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)

    // ⬇️ Replace this with real authentication logic
    setTimeout(() => {
      setLoading(false)
      router.push("/admin") // ✅ redirect to dashboard
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <h1 className="text-3xl font-bold text-[#56ffbc]">Admin Login</h1>
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-[#56ffbc] text-[#07073a] font-semibold rounded-lg shadow-md"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login as Admin"}
      </button>
    </div>
  )
}
