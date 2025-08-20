"use client"
import type React from "react"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, User, Mail, Building, Lock, Eye, EyeOff, Check, UserPlus } from "lucide-react"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [institution, setInstitution] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false) // Track registration success
  const { signUp } = useAuth()
  const router = useRouter()

  // Password validation function
  const validatePassword = (password: string) => {
    const minLength = password.length > 10
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasCapital = /[A-Z]/.test(password)

    if (!minLength) {
      return "Password must be longer than 10 characters."
    }
    if (!hasSpecialChar) {
      return "Password must include at least one special character (e.g., !@#$%^&*)."
    }
    if (!hasNumber) {
      return "Password must include at least one number."
    }
    if (!hasCapital) {
      return "Password must include at least one capital letter."
    }
    return null
  }

  // Email validation for Gmail
  const validateEmail = (email: string) => {
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      return "Email must be a Gmail address (e.g., example@gmail.com)."
    }
    return null
  }

  // Check password rules for real-time checkbox updates
  const isLengthValid = password.length > 10
  const isSpecialCharValid = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isNumberValid = /\d/.test(password)
  const isCapitalValid = /[A-Z]/.test(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, fullName, institution)
      setIsRegistered(true) // Show confirmation message
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please check your details.")
    } finally {
      setLoading(false)
    }
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
          <div className="p-8 text-slate-900">
            {isRegistered ? (
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Check Your Email
                </h1>
                <p className="text-muted-foreground">
                  A verification email has been sent to <span className="text-blue-600 font-medium">{email}</span>.
                  Check your inbox and spam folder. Please click the link in the email to verify your account before signing in.
                </p>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="w-full bg-[#10142c] text-white font-semibold gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#10142c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <>
            {/* Header */}
            <div className="text-center mb-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-[#10142c] rounded-xl flex items-center justify-center shadow-lg">
                <div className="p-3 bg-white/20 rounded-xl">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Register Account
                </h1>
                <p className="text-muted-foreground mt-2">
                  Create your account to participate in the competition
                </p>
              </div>
            </div>


                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      <p className="font-medium">{error}</p>
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email (Gmail required)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="example@gmail.com"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Institution Input */}
                  <div className="space-y-2">
                    <label htmlFor="institution" className="text-sm font-medium text-slate-700">
                      Institution/Organization
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="institution"
                        name="institution"
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        required
                        placeholder="University of Example"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••••"
                        className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400"
                        disabled={loading}
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
                    {/* Password Requirements with Animated Checkboxes */}
                    <div className="text-sm text-slate-500 mt-2">
                      <p>Password must:</p>
                      <ul className="space-y-2 mt-2">
                        <li className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isLengthValid ? "border-green-400 bg-green-400/20" : "border-slate-300"
                            }`}
                          >
                            {isLengthValid && (
                              <Check className="w-4 h-4 text-green-400 transform scale-0 animate-check" />
                            )}
                          </span>
                          <span className={isLengthValid ? "text-green-600" : "text-slate-500"}>
                            Be longer than 10 characters
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isSpecialCharValid ? "border-green-400 bg-green-400/20" : "border-slate-300"
                            }`}
                          >
                            {isSpecialCharValid && (
                              <Check className="w-4 h-4 text-green-400 transform scale-0 animate-check" />
                            )}
                          </span>
                          <span className={isSpecialCharValid ? "text-green-600" : "text-slate-500"}>
                            Include at least one special character (e.g., !@#$%^&*)
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isNumberValid ? "border-green-400 bg-green-400/20" : "border-slate-300"
                            }`}
                          >
                            {isNumberValid && (
                              <Check className="w-4 h-4 text-green-400 transform scale-0 animate-check" />
                            )}
                          </span>
                          <span className={isNumberValid ? "text-green-600" : "text-slate-500"}>
                            Include at least one number
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isCapitalValid ? "border-green-400 bg-green-400/20" : "border-slate-300"
                            }`}
                          >
                            {isCapitalValid && (
                              <Check className="w-4 h-4 text-green-400 transform scale-0 animate-check" />
                            )}
                          </span>
                          <span className={isCapitalValid ? "text-green-600" : "text-slate-500"}>
                            Include at least one capital letter
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-[#10142c] text-white font-semibold gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#10142c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      "Register"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-blue-600 hover:underline">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Tailwind CSS Animation for Checkboxes */}
      <style jsx>{`
        @keyframes check {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-check {
          animation: check 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
