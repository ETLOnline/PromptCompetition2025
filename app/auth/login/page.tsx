"use client"

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth"; 
import { auth } from "@/lib/firebase";

// HomeIcon for the "Back to Home" link
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export default function ParticipantLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try 
    {
      await signIn(email, password);
      router.push("/participants");
    } 
    catch (err: any) 
    {
      setError(err.message || "Failed to login. Please check your credentials.");
    } 
    finally 
    {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setResetMessage("Please enter your email address.");
      return;
    }
    setIsResetting(true);
    setResetMessage("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      const message =
        err.code === "auth/user-not-found"
          ? "No account found with this email address."
          : "Failed to send password reset email. Please try again.";
      setResetMessage(message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#07073a] via-[#121244] to-black p-4 font-sans">
      {/* Back to Home Link */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-[#56ffbc] transition-colors duration-300"
      >
        <HomeIcon className="h-5 w-5" />
        <span>Back to Home</span>
      </Link>
      {/* Glassmorphism Card with new color tint */}
      <div className="w-full max-w-md rounded-2xl bg-[rgba(38,38,92,0.25)] backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300">
        <div className="p-8 text-white">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#56ffbc]">Sign In</h1>
            <p className="text-white/70 mt-2">Enter your credentials to access the competition platform</p>
          </div>
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white/80">Email</label>
              <input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] transition-all duration-300"
                disabled={loading}
              />
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                Password
              </label>

              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] transition-all duration-300 pr-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-white/60 hover:text-[#56ffbc] focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Eye Off Icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
                    </svg>
                  ) : (
                    // Eye Icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12S5.25 5.25 12 5.25 22.5 12 22.5 12 18.75 18.75 12 18.75 1.5 12 1.5 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordModalOpen(true);
                  setResetEmail(email); // Pre-fill with the email from the login form
                  setResetMessage("");
                }}
                className="text-sm text-[#56ffbc] hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="bg-red-500/40 border border-red-500/60 text-red-100 px-4 py-3 rounded-lg text-center text-sm">
                <p>{error}</p>
              </div>
            )}
            {/* Submit Button with new Aquamarine color */}
            <button 
              type="submit" 
              className="w-full py-3 bg-[#11998e] text-white font-bold rounded-lg shadow-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] focus:ring-offset-2 focus:ring-offset-[#07073a] disabled:bg-[#56ffbc]/50 disabled:cursor-not-allowed transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          {/* Google Sign-In Button */}
          <div className="mt-4 flex flex-col items-center">
            <button
              type="button"
              onClick={async () => {
                setError(null);
                setGoogleLoading(true);
                try 
                {
                  await signInWithGoogle();
                  router.push("/participants");
                } 
                catch (err: any) 
                {
                  setError(err.message || "Failed to sign in with Google.");
                } 
                finally 
                {
                  setGoogleLoading(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-bold rounded-lg shadow-lg hover:bg-[#56ffbc]/10 border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] focus:ring-offset-2 focus:ring-offset-[#07073a] disabled:bg-[#56ffbc]/30 disabled:cursor-not-allowed transition-all duration-300"
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <span>Signing in with Google...</span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.532 24.552c0-1.636-.146-3.2-.418-4.704H24.48v9.02h13.02c-.56 3.02-2.24 5.58-4.76 7.3v6.06h7.7c4.5-4.14 7.09-10.24 7.09-17.68z" fill="#4285F4"/><path d="M24.48 48c6.48 0 11.92-2.14 15.89-5.82l-7.7-6.06c-2.14 1.44-4.88 2.3-8.19 2.3-6.3 0-11.64-4.26-13.56-9.98H2.6v6.26C6.56 43.98 14.7 48 24.48 48z" fill="#34A853"/><path d="M10.92 28.44c-.5-1.44-.8-2.98-.8-4.44s.3-3 .8-4.44v-6.26H2.6A23.98 23.98 0 000 24c0 3.98.96 7.76 2.6 11.18l8.32-6.74z" fill="#FBBC05"/><path d="M24.48 9.52c3.54 0 6.68 1.22 9.17 3.62l6.86-6.86C36.4 2.14 30.96 0 24.48 0 14.7 0 6.56 4.02 2.6 10.08l8.32 6.26c1.92-5.72 7.26-9.98 13.56-9.98z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><rect width="48" height="48" fill="white"/></clipPath></defs></svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-white/70">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-[#56ffbc] hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
          {/* Forgot Password Modal */}
      {isForgotPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[rgba(38,38,92,0.5)] border border-white/20 shadow-2xl p-8 text-white relative mx-4">
            <button
              onClick={() => setIsForgotPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#56ffbc]">Reset Password</h2>
            <p className="text-center text-white/70 mb-6">Enter your email to receive a password reset link.</p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="emailInput" className="sr-only">Enter your email address</label>
                <input
                  type="email"
                  id="emailInput"
                  placeholder="Enter your email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] transition-all duration-300"
                  disabled={isResetting}
                />
              </div>
              <button
                id="resetPasswordButton"
                onClick={handlePasswordReset}
                disabled={isResetting || !resetEmail}
                className="w-full py-3 bg-[#11998e] text-white font-bold rounded-lg shadow-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] focus:ring-offset-2 focus:ring-offset-[#07073a] disabled:bg-[#56ffbc]/50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isResetting ? "Sending Link..." : "Send Reset Link"}
              </button>
            </div>

            {resetMessage && (
              <p id="message" className={`mt-4 text-center text-sm ${
                resetMessage.includes("Failed") || resetMessage.includes("No account") ? 'text-red-400' : 'text-green-400'
              }`}>
                {resetMessage}
              </p>
            )}
          </div>
        </div>  
      )}
    </div>
  );
}
