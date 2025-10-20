//reset-password/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { confirmPasswordReset, getAuth } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Eye, EyeOff, X, AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const auth = getAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const oobCode = searchParams.get("oobCode")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  // Password validation function (same as register)
  const validatePassword = (pass: string): string | null => {
    if (pass !== pass.trim()) {
      return "Password cannot have leading or trailing spaces."
    }

    if (/\s/.test(pass)) {
      return "Spaces are not allowed in the password."
    }

    if (pass.length <= 10) {
      return "Password must be longer than 10 characters."
    }

    if (pass.length > 128) {
      return "Password must not exceed 128 characters."
    }

    if (/[^\x00-\x7F]/.test(pass)) {
      return "Password cannot contain emojis or special Unicode characters."
    }

    if (!/[!@#$%^&*(),.?":{}|<>\[\]_\/~'`=+\-\\;]/.test(pass)) {
      return "Password must include at least one special character"
    }

    if (!/\d/.test(pass)) {
      return "Password must include at least one number."
    }

    if (!/[A-Z]/.test(pass)) {
      return "Password must include at least one capital letter."
    }

    if (!/[a-z]/.test(pass)) {
      return "Password must include at least one lowercase letter."
    }

    return null
  }

  // Check if password meets all requirements
  const isPasswordValidGlobally = (): boolean => {
    if (password.length === 0) return false
    return validatePassword(password) === null
  }

  // Calculate password strength with enhanced metrics
  const calculatePasswordStrength = (
    pass: string
  ): { strength: number; label: string; color: string; gradient: string } => {
    if (pass.length === 0) {
      return { strength: 0, label: "Enter password", color: "bg-slate-300", gradient: "from-slate-300 to-slate-400" }
    }

    let strength = 0

    // Length-based scoring
    if (pass.length > 10) strength += 20
    if (pass.length > 15) strength += 10
    if (pass.length > 20) strength += 10

    // Character type scoring (updated special char regex)
    const specialRegex = /[!@#$%^&*(),.?":{}|<>\[\]_\/~'`=+\-\\;]/g

    if (specialRegex.test(pass)) strength += 20
    if (/\d/.test(pass)) strength += 15
    if (/[A-Z]/.test(pass)) strength += 15
    if (/[a-z]/.test(pass)) strength += 10

    // Bonus for complexity
    const specialCount = (pass.match(specialRegex) || []).length
    const numberCount = (pass.match(/\d/g) || []).length
    const upperCount = (pass.match(/[A-Z]/g) || []).length

    if (specialCount > 1) strength += 5
    if (numberCount > 1) strength += 5
    if (upperCount > 1) strength += 5

    // Check for invalid conditions
    const hasInvalidSpaces = pass !== pass.trim() || /\s/.test(pass)
    const hasEmojis = /[^\x00-\x7F]/.test(pass)
    const tooLong = pass.length > 128

    let label = "Very Weak"
    let color = "bg-red-500"
    let gradient = "from-red-500 to-red-600"

    if (hasInvalidSpaces || hasEmojis || tooLong) {
      label = "Invalid"
      color = "bg-red-600"
      gradient = "from-red-600 to-red-700"
    } else if (strength >= 85) {
      label = "Very Strong"
      color = "bg-green-500"
      gradient = "from-green-500 to-green-600"
    } else if (strength >= 70) {
      label = "Strong"
      color = "bg-green-400"
      gradient = "from-green-400 to-green-500"
    } else if (strength >= 50) {
      label = "Good"
      color = "bg-yellow-500"
      gradient = "from-yellow-500 to-yellow-600"
    } else if (strength >= 30) {
      label = "Fair"
      color = "bg-orange-500"
      gradient = "from-orange-500 to-orange-600"
    } else {
      label = "Weak"
      color = "bg-red-500"
      gradient = "from-red-500 to-red-600"
    }

    return { strength: Math.min(strength, 100), label, color, gradient }
  }

  const passwordStrength = calculatePasswordStrength(password)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (/[^\x00-\x7F]/.test(value)) {
      return
    }

    if (value.length > 128) {
      return
    }

    setPassword(value)

    const error = validatePassword(value)
    setPasswordError(error)
  }

  const handlePasswordBlur = () => {
    const error = validatePassword(password)
    setPasswordError(error)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)

    if (message) {
      setMessage("")
    }

    // Check if passwords match
    if (value && password && value !== password) {
      setConfirmPasswordError("Passwords do not match.")
    } else {
      setConfirmPasswordError(null)
    }
  }

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && password && confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match.")
    }
  }

  // Check if form is valid
  const isFormValid =
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    !validatePassword(password) &&
    !confirmPasswordError &&
    password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    if (!oobCode) {
      setMessage("Invalid or missing reset code.")
      return
    }

    if (!isFormValid) {
      setMessage("Please ensure both passwords match and meet all requirements.")
      return
    }

    const passwordValidationError = validatePassword(password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      setMessage("Please fix the password errors before submitting.")
      return
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.")
      setMessage("Passwords do not match.")
      return
    }

    try {
      setIsSubmitting(true)
      await confirmPasswordReset(auth, oobCode, password)
      setMessage("Password reset successful! Redirecting to login...")
      setTimeout(() => router.push("/auth/login"), 2500)
    } catch (error: any) {
      setMessage(error.message || "Failed to reset password. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200">
          <div className="p-8 text-slate-900">
            <div className="text-center mb-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-[#10142c] rounded-xl flex items-center justify-center shadow-lg">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Lock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Reset Password
                </h1>
                <p className="text-muted-foreground mt-2">
                  Create a new password for your account
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <div
                  className={`border rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${
                    message.includes("successful")
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="font-medium">{message}</p>
                </div>
              )}

              {/* Password Input with Dynamic Strength Meter */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    required
                    placeholder="••••••••••"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400 ${
                      passwordError ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-blue-500"
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={0}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {passwordError}
                  </p>
                )}

                {/* Enhanced Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Password Strength</span>
                      <span
                        className={`font-bold ${
                          passwordStrength.label === "Very Strong"
                            ? "text-green-600"
                            : passwordStrength.label === "Strong"
                            ? "text-green-500"
                            : passwordStrength.label === "Good"
                            ? "text-yellow-600"
                            : passwordStrength.label === "Fair"
                            ? "text-orange-500"
                            : passwordStrength.label === "Invalid"
                            ? "text-red-700"
                            : "text-red-600"
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${passwordStrength.gradient} shadow-sm`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      >
                        <div className="h-full w-full bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    {!isPasswordValidGlobally() && password.length > 0 && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                        <span className="font-medium">Tip:</span> Use a mix of uppercase, lowercase, numbers, and special characters (length: 11-128)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={handleConfirmPasswordBlur}
                    required
                    placeholder="••••••••••"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400 ${
                      confirmPasswordError
                        ? "border-red-500 focus:border-red-500"
                        : "border-slate-300 focus:border-blue-500"
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={0}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {confirmPasswordError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full font-semibold gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#10142c] focus:ring-offset-2
                  ${
                    !isFormValid || isSubmitting
                      ? "bg-[#4B4F63] text-gray-300 cursor-not-allowed"
                      : "bg-[#10142c] text-white hover:shadow-xl hover:-translate-y-1"
                  }`}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}