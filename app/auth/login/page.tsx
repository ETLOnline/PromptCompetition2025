"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, Shield } from "lucide-react"
import Login from "@/components/auth/login"
import ForgotPasswordModal from "@/components/auth/forgot-password-modal"

export default function AdminLoginPage() {
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")

  const handleForgotPassword = (email: string) => {
    setForgotPasswordEmail(email)
    setIsForgotPasswordModalOpen(true)
  }

  const handleCloseForgotPassword = () => {
    setIsForgotPasswordModalOpen(false)
    setForgotPasswordEmail("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 group"
      >
        <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
          {/* Header */}
          <div className="p-8 pb-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-[#10142c] rounded-xl flex items-center justify-center shadow-lg">
                <div className="p-3 bg-[#10142c] rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Login Portal
                </h1>
                <p className="text-muted-foreground mt-2">Secure access for all users</p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="px-8 pb-8">
            <Login onForgotPassword={handleForgotPassword} />

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">This portal is restricted to authorized users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={handleCloseForgotPassword}
        initialEmail={forgotPasswordEmail}
      />
    </div>
  )
}
