"use client"
import type React from "react"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Home, User, Mail, Building, Lock, Eye, EyeOff, UserPlus, X, AlertCircle } from "lucide-react"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { fetchWithAuth } from "@/lib/api"

export default function RegisterPage() {
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
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

    const validInstRegex = /^[A-Za-z\s.\-&']+$/
    if (!validInstRegex.test(trimmedInst)) {
      return "Institution name can only contain letters, spaces, dots, hyphens, ampersands, and apostrophes."
    }

    if (/[^\x00-\x7F]/.test(trimmedInst)) {
      return "Institution name must contain only English characters."
    }

    const htmlTagRegex = /<[^>]*>/g
    if (htmlTagRegex.test(trimmedInst)) {
      return "Invalid input detected."
    }

    if (/\s{2,}/.test(trimmedInst)) {
      return "Institution name cannot contain multiple consecutive spaces."
    }

    if (/[!@#$%^*()_+={}[\]|\\:;"<>?,/~`]/.test(trimmedInst)) {
      return "Institution name contains invalid special characters."
    }

    return null
  }

  // Password validation function
  const validatePassword = (pass: string): string | null => {
    if (pass !== pass.trim()) {
      return "Password cannot have leading or trailing spaces."
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

    if (!/[!@#$%^&*(),.?":{}|<>\[\]_\/~'\-`]/.test(pass)) {
      return "Password must include at least one special character (e.g., !@#$%^&*_-/~'`)."
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

  // Check if password meets all requirements (for button enable/disable)
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
    const specialRegex = /[!@#$%^&*(),.?":{}|<>\[\]_\/~'\-`]/g

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
    
    if (/[^\x00-\x7F]/.test(value)) {
      return
    }

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

    const trimmedName = fullName.trim()
    const nameValidationError = validateFullName(trimmedName)
    if (nameValidationError) {
      setNameError(nameValidationError)
      setError(nameValidationError)
      return
    }

    const trimmedInst = institution.trim()
    const instValidationError = validateInstitution(trimmedInst)
    if (instValidationError) {
      setInstitutionError(instValidationError)
      setError(instValidationError)
      return
    }

    const passwordValidationError = validatePassword(password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      setError(passwordValidationError)
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, trimmedName, trimmedInst);
      setIsRegistered(true);
    } catch (err: any) {
      console.log("Error during signup:", err.code, err.message);
      let errorMessage = err.message || "Failed to sign up. Please check your details.";

      switch (err.code) {
        case "auth/email-already-in-use":
          errorMessage = "";
          setEmailError("This email is already registered. Please sign in instead.")
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address format.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. It should be at least 6 characters.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled. Please contact support.";
          break;
        case "auth/missing-password":
          errorMessage = "Please enter a password.";
          break;
        default:
          if (typeof err.message === "string" && err.message.startsWith("Firebase:")) {
            errorMessage = "An unexpected error occurred. Please try again.";
          } else {
            errorMessage = err.message || "Failed to sign up. Please try again.";
          }
          break;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
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
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-400 ${
                          emailError ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-blue-500"
                        }`}
                        placeholder="example@email.com"
                        disabled={loading}
                      />
                    </div>
                    {emailError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {emailError}
                      </p>
                    )}
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
                      3-100 characters, letters, spaces, dots, hyphens, ampersands, and apostrophes only
                    </p>
                  </div>

                  {/* Password Input with Dynamic Strength Meter */}
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

                    {/* Enhanced Password Strength Meter */}
                    {password.length > 0 && (
                      <div className="space-y-3 mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Password Strength</span>
                          <span className={`font-bold ${
                            passwordStrength.label === 'Very Strong' ? 'text-green-600' :
                            passwordStrength.label === 'Strong' ? 'text-green-500' :
                            passwordStrength.label === 'Good' ? 'text-yellow-600' :
                            passwordStrength.label === 'Fair' ? 'text-orange-500' :
                            passwordStrength.label === 'Invalid' ? 'text-red-700' :
                            'text-red-600'
                          }`}>
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

                  {/* Submit Button - Disabled if password doesn't meet all requirements */}
                  <button
                    type="submit"
                    className="w-full bg-[#10142c] text-white font-semibold gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#10142c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={loading || googleLoading || !isPasswordValidGlobally()}
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