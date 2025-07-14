"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/types/auth"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string, institution: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate successful login without backend
    const mockUser: User = {
      id: "mock-user-" + Date.now(),
      email: email,
      name: "Test User",
      institution: "Mock University",
      role: "participant", // Default to participant role for testing
      createdAt: new Date().toISOString(),
    }
    // For admin testing, you can use a specific email, e.g., "admin@test.com"
    if (email === "admin@test.com") {
      mockUser.role = "admin"
      mockUser.name = "Test Admin"
      mockUser.institution = "Competition Admin"
    }

    setUser(mockUser)
    localStorage.setItem("user", JSON.stringify(mockUser))
    return true
  }

  const register = async (email: string, password: string, name: string, institution: string): Promise<boolean> => {
    // Simulate successful registration without backend
    const mockUser: User = {
      id: "mock-user-" + Date.now(),
      email: email,
      name: name,
      institution: institution,
      role: "participant", // Default to participant role for testing
      createdAt: new Date().toISOString(),
    }
    setUser(mockUser)
    localStorage.setItem("user", JSON.stringify(mockUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
