"use client"
import type React from "react"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, User, Mail, Building, Lock, Eye, EyeOff, Check, UserPlus } from "lucide-react"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { fetchWithAuth } from "@/lib/api"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [institution, setInstitution] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
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
  // const validateEmail = (email: string) => {
  //   if (!email.toLowerCase().endsWith("@gmail.com")) {
  //     return "Email must be a Gmail address (e.g., example@gmail.com)."
  //   }
  //   return null
  // }

  // Check password rules for real-time checkbox updates
  const isLengthValid = password.length > 10
  const isSpecialCharValid = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isNumberValid = /\d/.test(password)
  const isCapitalValid = /[A-Z]/.test(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email
    // const emailError = validateEmail(email)
    // if (emailError) {
    //   setError(emailError)
    //   return
    // }

    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, fullName, institution)
      setIsRegistered(true)
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please check your details.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)

      const data = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-signup`, {
        method: "POST",
      })

      router.push(data.redirectUrl)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
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
                        disabled={loading || googleLoading}
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
                        disabled={loading || googleLoading}
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
                        disabled={loading || googleLoading}
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
                        disabled={loading || googleLoading}
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
                    disabled={loading || googleLoading}
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

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-500">Or continue with</span>
                    </div>
                  </div>

                  {/* Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 h-14 text-lg border border-slate-300 rounded-xl bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    disabled={googleLoading || loading}
                  >
                    {googleLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in with Google...</span>
                      </div>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_17_40)">
                            <path
                              d="M47.532 24.552c0-1.636-.146-3.2-.418-4.704H24.48v9.02h13.02c-.56 3.02-2.24 5.58-4.76 7.3v6.06h7.7c4.5-4.14 7.09-10.24 7.09-17.68z"
                              fill="#4285F4"
                            />
                            <path
                              d="M24.48 48c6.48 0 11.92-2.14 15.89-5.82l-7.7-6.06c-2.14 1.44-4.88 2.3-8.19 2.3-6.3 0-11.64-4.26-13.56-9.98H2.6v6.26C6.56 43.98 14.7 48 24.48 48z"
                              fill="#34A853"
                            />
                            <path
                              d="M10.92 28.44c-.5-1.44-.8-2.98-.8-4.44s.3-3 .8-4.44v-6.26H2.6A23.98 23.98 0 000 24c0 3.98.96 7.76 2.6 11.18l8.32-6.74z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M24.48 9.52c3.54 0 6.68 1.22 9.17 3.62l6.86-6.86C36.4 2.14 30.96 0 24.48 0 14.7 0 6.56 4.02 2.6 10.08l8.32 6.26c1.92-5.72 7.26-9.98 13.56-9.98z"
                              fill="#EA4335"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_17_40">
                              <rect width="48" height="48" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span>Sign in with Google</span>
                      </>
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