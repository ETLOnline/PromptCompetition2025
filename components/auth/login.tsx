"use client"

import { useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase"; // your client SDK instance


interface LoginProps {
    onForgotPassword: (email: string) => void
}


export default function Login({ onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
        const data = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { "Content-Type": "application/json" }, // merge with fetchWithAuth headers
        });

        router.push(data.redirectUrl);
    } 
    catch (err: any) 
    {
        setError(err.message)
    } 
    finally {
        setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setGoogleLoading(true)

    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);

        const data = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-signin`, {
            method: "POST",
        });

        router.push(data.redirectUrl);
        } catch (err: any) {
        setError(err.message);
        }finally {
      setGoogleLoading(false)
    }
  }

  const handleForgotPassword = () => {
    onForgotPassword(email)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@example.com"
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400"
            disabled={loading || googleLoading}
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-400"
            disabled={loading || googleLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Forgot Password Button */}
      <div className="text-right -mt-2">
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-blue-600 hover:underline focus:outline-none"
        >
          Forgot Password?
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Sign In Button */}
      <button
        type="submit"
        className="w-full bg-[#10142c] text-white font-semibold gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#10142c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        disabled={loading || googleLoading}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Signing In...</span>
          </div>
        ) : (
          "Sign In"
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
  )
}
