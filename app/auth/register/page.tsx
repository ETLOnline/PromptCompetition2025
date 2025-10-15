"use client"
import type React from "react"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, User, Mail, Building, Lock, Eye, EyeOff, Check, UserPlus, X, AlertCircle } from "lucide-react"
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
  const [nameError, setNameError] = useState<string | null>(null)
  const [institutionError, setInstitutionError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  // Full Name validation function
  const validateFullName = (name: string): string | null => {
    const trimmedName = name.trim()

    if (!trimmedName || trimmedName.length === 0) {
      return "Full name is required."
    }

    if (trimmedName.length < 3) {
      return "Full name must be at least 3 characters long."
    }

    if (trimmedName.length > 50) {
      return "Full name must not exceed 50 characters."
    }

    const validNameRegex = /^[A-Za-z]+(\s[A-Za-z]+)*$/
    if (!validNameRegex.test(trimmedName)) {
      return "Full name must contain only English letters and single spaces between words."
    }

    if (/\d/.test(trimmedName)) {
      return "Full name cannot contain numbers."
    }

    if (/[!@#$%^&*(),.?":{}|<>[\]\\/_+=`~;'-]/.test(trimmedName)) {
      return "Full name cannot contain special characters."
    }

    if (/[^\x00-\x7F]/.test(trimmedName)) {
      return "Full name must contain only English letters."
    }

    const htmlTagRegex = /<[^>]*>/g
    if (htmlTagRegex.test(trimmedName)) {
      return "Invalid input detected."
    }

    if (/\s{2,}/.test(trimmedName)) {
      return "Full name cannot contain multiple consecutive spaces."
    }

    return null
  }

  // Institution validation function
const validateInstitution = (inst: string): string | null => {
  const trimmedInst = inst.trim()

  if (!trimmedInst || trimmedInst.length === 0) {
    return "Institution/Organization is required."
  }

  if (trimmedInst.length < 3) {
    return "Institution name must be at least 3 characters long."
  }

  if (trimmedInst.length > 100) {
    return "Institution name must not exceed 100 characters."
  }

  // Disallow numbers; allow letters, spaces, dots, hyphens, ampersands, and apostrophes
  const validInstRegex = /^[A-Za-z\s.\-&']+$/
  if (!validInstRegex.test(trimmedInst)) {
    return "Institution name can only contain letters, spaces, dots, hyphens, ampersands, and apostrophes."
  }

  // Check for emojis and unicode characters
  if (/[^\x00-\x7F]/.test(trimmedInst)) {
    return "Institution name must contain only English characters."
  }

  // Check for HTML/Script tags
  const htmlTagRegex = /<[^>]*>/g
  if (htmlTagRegex.test(trimmedInst)) {
    return "Invalid input detected."
  }

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(trimmedInst)) {
    return "Institution name cannot contain multiple consecutive spaces."
  }

  // Check for disallowed special characters
  if (/[!@#$%^*()_+={}[\]|\\:;"<>?,/~`]/.test(trimmedInst)) {
    return "Institution name contains invalid special characters."
  }

  return null
}


  // Password validation function
  const validatePassword = (pass: string): string | null => {
    // Check for leading or trailing spaces
    if (pass !== pass.trim()) {
      return "Password cannot have leading or trailing spaces."
    }

    if (pass.length <= 10) {
      return "Password must be longer than 10 characters."
    }

    if (pass.length > 128) {
      return "Password must not exceed 128 characters."
    }

    // Check for emojis and non-ASCII characters
    if (/[^\x00-\x7F]/.test(pass)) {
      return "Password cannot contain emojis or special Unicode characters."
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      return "Password must include at least one special character (e.g., !@#$%^&*)."
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

  // Calculate password strength
  const calculatePasswordStrength = (pass: string): { strength: number; label: string; color: string } => {
    let strength = 0
    
    if (pass.length > 10) strength += 20
    if (pass.length > 15) strength += 10
    if (pass.length > 20) strength += 10
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) strength += 20
    if (/\d/.test(pass)) strength += 15
    if (/[A-Z]/.test(pass)) strength += 15
    if (/[a-z]/.test(pass)) strength += 10
    
    // Bonus for having multiple special chars, numbers, etc.
    const specialCount = (pass.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length
    const numberCount = (pass.match(/\d/g) || []).length
    const upperCount = (pass.match(/[A-Z]/g) || []).length
    
    if (specialCount > 1) strength += 5
    if (numberCount > 1) strength += 5
    if (upperCount > 1) strength += 5

    let label = "Weak"
    let color = "bg-red-500"
    
    if (strength >= 80) {
      label = "Strong"
      color = "bg-green-500"
    } else if (strength >= 60) {
      label = "Good"
      color = "bg-yellow-500"
    } else if (strength >= 40) {
      label = "Fair"
      color = "bg-orange-500"
    }

    return { strength: Math.min(strength, 100), label, color }
  }

  // Check password rules for real-time checkbox updates
  const isLengthValid = password.length > 10
  const isMaxLengthValid = password.length <= 128
  const isSpecialCharValid = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isNumberValid = /\d/.test(password)
  const isCapitalValid = /[A-Z]/.test(password)
  const isLowercaseValid = /[a-z]/.test(password)
  const hasNoSpaces = password === password.trim() && !/\s/.test(password)
  const hasNoEmojis = !/[^\x00-\x7F]/.test(password)

  const passwordStrength = password.length > 0 ? calculatePasswordStrength(password) : null

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const allowedCharsRegex = /^[A-Za-z\s]*$/
    
    if (!allowedCharsRegex.test(value)) {
      return
    }

    setFullName(value)
    
    if (nameError) {
      setNameError(null)
    }
  }

  const handleFullNameBlur = () => {
    const error = validateFullName(fullName)
    setNameError(error)
  }

  const handleInstitutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Allow only valid characters during typing
    const allowedCharsRegex = /^[A-Za-z\s.\-&']*$/
    
    if (!allowedCharsRegex.test(value)) {
      return
    }

    setInstitution(value)
    
    if (institutionError) {
      setInstitutionError(null)
    }
  }

  const handleInstitutionBlur = () => {
    const error = validateInstitution(institution)
    setInstitutionError(error)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Prevent emojis and non-ASCII characters during typing
    if (/[^\x00-\x7F]/.test(value)) {
      return
    }

    // Limit maximum length during typing
    if (value.length > 128) {
      return
    }

    setPassword(value)
    
    if (passwordError) {
      setPasswordError(null)
    }
  }

  const handlePasswordBlur = () => {
    const error = validatePassword(password)
    setPasswordError(error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate full name
    const trimmedName = fullName.trim()
    const nameValidationError = validateFullName(trimmedName)
    if (nameValidationError) {
      setNameError(nameValidationError)
      setError(nameValidationError)
      return
    }

    // Validate institution
    const trimmedInst = institution.trim()
    const instValidationError = validateInstitution(trimmedInst)
    if (instValidationError) {
      setInstitutionError(instValidationError)
      setError(instValidationError)
      return
    }

    // Validate password
    const passwordValidationError = validatePassword(password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      setError(passwordValidationError)
      return
    }

    setLoading(true)
    try {
      // Use trimmed values for signup - FIREBASE LOGIC RESTORED
      await signUp(email, password, trimmedName, trimmedInst)
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
      // FIREBASE GOOGLE AUTH LOGIC RESTORED
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
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 group"
      >
        <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </Link>

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

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
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
                        onChange={handleFullNameChange}
                        onBlur={handleFullNameBlur}
                        required
                        placeholder="John Doe"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400 ${
                          nameError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                        }`}
                        disabled={loading || googleLoading}
                        maxLength={50}
                      />
                    </div>
                    {nameError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {nameError}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      3-50 characters, English letters only, single spaces between words
                    </p>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email
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
                        placeholder="example@email.com"
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
                        onChange={handleInstitutionChange}
                        onBlur={handleInstitutionBlur}
                        required
                        placeholder="FAST University"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400 ${
                          institutionError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                        }`}
                        disabled={loading || googleLoading}
                        maxLength={100}
                      />
                    </div>
                    {institutionError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {institutionError}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      3-100 characters, letters, numbers, spaces, dots, hyphens, ampersands, and apostrophes only
                    </p>
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
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        required
                        placeholder="••••••••••"
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400 ${
                          passwordError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
                        }`}
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
                    
                    {passwordError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {passwordError}
                      </p>
                    )}

                    {/* Password Strength Meter */}
                    {passwordStrength && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Password Strength:</span>
                          <span className={`font-semibold ${
                            passwordStrength.label === 'Strong' ? 'text-green-600' :
                            passwordStrength.label === 'Good' ? 'text-yellow-600' :
                            passwordStrength.label === 'Fair' ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Password Requirements */}
                    <div className="text-sm text-slate-500 mt-3">
                      <p className="font-medium mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isLengthValid ? "border-green-500 bg-green-500" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isLengthValid ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <X className="w-3 h-3 text-slate-400" />
                            )}
                          </span>
                          <span className={isLengthValid ? "text-green-600 text-xs" : "text-slate-500 text-xs"}>
                            Longer than 10 characters
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isMaxLengthValid ? "border-green-500 bg-green-500" : "border-red-500 bg-red-500"
                            }`}
                          >
                            {isMaxLengthValid ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <X className="w-3 h-3 text-white" />
                            )}
                          </span>
                          <span className={isMaxLengthValid ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                            No more than 128 characters
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isCapitalValid ? "border-green-500 bg-green-500" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isCapitalValid ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <X className="w-3 h-3 text-slate-400" />
                            )}
                          </span>
                          <span className={isCapitalValid ? "text-green-600 text-xs" : "text-slate-500 text-xs"}>
                            At least one uppercase letter
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isLowercaseValid ? "border-green-500 bg-green-500" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isLowercaseValid ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <X className="w-3 h-3 text-slate-400" />
                            )}
                          </span>
                          <span className={isLowercaseValid ? "text-green-600 text-xs" : "text-slate-500 text-xs"}>
                            At least one lowercase letter
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isNumberValid ? "border-green-500 bg-green-500" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isNumberValid ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <X className="w-3 h-3 text-slate-400" />
                            )}
                          </span>
                          <span className={isNumberValid ? "text-green-600 text-xs" : "text-slate-500 text-xs"}>
                            At least one number
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              isSpecialCharValid ? "border-green-500 bg-green-500" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSpecialCharValid ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <X className="w-3 h-3 text-slate-400" />
                            )}
                          </span>
                          <span className={isSpecialCharValid ? "text-green-600 text-xs" : "text-slate-500 text-xs"}>
                            At least one special character (!@#$%^&*...)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              hasNoSpaces ? "border-green-500 bg-green-500" : "border-red-500 bg-red-500"
                            }`}
                          >
                            {hasNoSpaces ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <X className="w-3 h-3 text-white" />
                            )}
                          </span>
                          <span className={hasNoSpaces ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                            No leading/trailing spaces
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${
                              hasNoEmojis ? "border-green-500 bg-green-500" : "border-red-500 bg-red-500"
                            }`}
                          >
                            {hasNoEmojis ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <X className="w-3 h-3 text-white" />
                            )}
                          </span>
                          <span className={hasNoEmojis ? "text-green-600 text-xs" : "text-red-600 text-xs"}>
                            No emojis or special Unicode
                          </span>
                        </div>
                      </div>
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
    </div>
  )
}