"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/types/auth"
import { createBrowserClient } from "@supabase/ssr"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, full_name: string, institution: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const mockUser: User = {
      id: "mock-user-" + Date.now(),
      email: email,
      name: "Test User",
      institution: "Mock University",
      role: "participant",
      createdAt: new Date().toISOString(),
    }

    if (email === "admin@test.com") {
      mockUser.role = "admin"
      mockUser.name = "Test Admin"
      mockUser.institution = "Competition Admin"
    }

    setUser(mockUser)
    localStorage.setItem("user", JSON.stringify(mockUser))
    return true
  }

  const register = async (
    email: string,
    password: string,
    full_name: string,
    institution: string
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: {
          full_name,
          institution,
        },
      },
    })

    if (error) {
      console.error("SignUp error:", error.message)
      return false
    }

    const sessionRes = await supabase.auth.getSession()
    const userId = sessionRes.data.session?.user.id

    if (userId) {
      const { error: insertError } = await supabase.from("profiles").insert({
        user_id: userId,
        email,
        full_name,
        institution,
      })

      if (insertError) {
        console.error("Insert to profiles error:", insertError.message)
        return false
      }
    }

    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
