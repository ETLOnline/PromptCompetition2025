"use client"

import React, { useState, useEffect } from "react"
import { X } from "lucide-react"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  initialEmail?: string
}

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = "" }: ForgotPasswordModalProps) {
  const [resetEmail, setResetEmail] = useState(initialEmail)
  const [resetMessage, setResetMessage] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setResetEmail(initialEmail)
      setResetMessage("")
    }
  }, [isOpen, initialEmail])

    const handlePasswordReset = async () => {
    setIsResetting(true)
    setResetMessage("")

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: resetEmail }),
        });

        if (!response.ok) {
            // Try to parse as JSON first, fall back to text
            let errorMessage = "Failed to send reset link.";
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
                // If JSON parsing fails, try text
                const errText = await response.text();
                errorMessage = errText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        // Also handle successful response properly
        const data = await response.json();
        setResetMessage(data.message || "Password reset link sent to your email!")
        
    } catch (err: any) {
        console.error("Password reset error:", err)
        setResetMessage(err.message || "Failed to send reset link.")
    } finally {
        setIsResetting(false)
    }
}

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-lg p-8 text-slate-900 relative mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Reset Password
        </h2>

        <p className="text-center text-muted-foreground mb-6">
          Enter your email to receive a password reset link.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="emailInput" className="sr-only">
              Enter your email address
            </label>
            <input
              type="email"
              id="emailInput"
              placeholder="Enter your email address"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400"
              disabled={isResetting}
            />
          </div>

          <button
            onClick={handlePasswordReset}
            disabled={isResetting || !resetEmail}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isResetting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending Link...</span>
              </div>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </div>

        {resetMessage && (
          <p
            className={`mt-4 text-center text-sm ${
              resetMessage.toLowerCase().includes("failed") || resetMessage.toLowerCase().includes("no account")
                ? "text-red-700"
                : "text-green-700"
            }`}
          >
            {resetMessage}
          </p>
        )}
      </div>
    </div>
  )
}
