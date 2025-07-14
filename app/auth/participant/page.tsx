// app/auth/participant/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ParticipantLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ TODO: Replace this with real auth logic
    // e.g., API call to your backend

    // Simulate success
    if (email && password) {
      // You might want to save auth token or session here
      router.push("/dashboard") // ✅ Redirect to dashboard
    } else {
      alert("Please fill in both fields")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-white/10 rounded-xl border border-[#56ffbc] shadow-lg w-[320px]">
        <h1 className="text-2xl font-bold text-[#56ffbc] mb-4 text-center">Participant Login</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 w-full rounded bg-white/5 text-white placeholder-gray-300 border border-white/10"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 w-full rounded bg-white/5 text-white placeholder-gray-300 border border-white/10"
          />
          <button
            type="submit"
            className="bg-[#56ffbc] text-[#07073a] px-4 py-2 rounded w-full font-semibold"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
