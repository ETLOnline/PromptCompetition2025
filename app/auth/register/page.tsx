"use client"

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";

// HomeIcon for the "Back to Home" link
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// CheckIcon for animated checkboxes
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); // Track registration success
  const { signUp } = useAuth();
  const router = useRouter();

  // Password validation function
  const validatePassword = (password: string) => {
    const minLength = password.length > 10;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasCapital = /[A-Z]/.test(password);

    if (!minLength) {
      return "Password must be longer than 10 characters.";
    }
    if (!hasSpecialChar) {
      return "Password must include at least one special character (e.g., !@#$%^&*).";
    }
    if (!hasNumber) {
      return "Password must include at least one number.";
    }
    if (!hasCapital) {
      return "Password must include at least one capital letter.";
    }
    return null;
  };

  // Email validation for Gmail
  const validateEmail = (email: string) => {
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      return "Email must be a Gmail address (e.g., example@gmail.com).";
    }
    return null;
  };

  // Check password rules for real-time checkbox updates
  const isLengthValid = password.length > 10;
  const isSpecialCharValid = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isNumberValid = /\d/.test(password);
  const isCapitalValid = /[A-Z]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, institution);
      setIsRegistered(true); // Show confirmation message
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please check your details.");
    } finally {
      setLoading(false);
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
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md rounded-2xl bg-[rgba(38,38,92,0.25)] backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300">
        <div className="p-8 text-white">
          {isRegistered ? (
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#56ffbc]">Check Your Email</h1>
              <p className="text-white/70">
                A verification email has been sent to <span className="text-[#56ffbc]">{email}</span>. Please click the link in the email to verify your account before signing in.
              </p>
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full py-3 bg-[#11998e] text-white font-bold rounded-lg shadow-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] focus:ring-offset-2 focus:ring-offset-[#07073a] transition-all duration-300"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#56ffbc]">Register</h1>
                <p className="text-white/70 mt-2">Create your account to participate in the competition</p>
              </div>
              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message Display */}
                {error && (
                  <div className="bg-red-500/40 border border-red-500/60 text-red-100 px-4 py-3 rounded-lg text-center text-sm">
                    <p>{error}</p>
                  </div>
                )}
                {/* Name Input */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-white/80">Full Name</label>
                  <input 
                    id="fullName" 
                    name="fullName" 
                    type="text" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] transition-all duration-300" 
                    disabled={loading} 
                  />
                </div>
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-white/80">Email (Gmail required)</label>
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] transition-all duration-300" 
                    disabled={loading} 
                  />
                </div>
                {/* Institution Input */}
                <div className="space-y-2">
                  <label htmlFor="institution" className="text-sm font-medium text-white/80">Institution/Organization</label>
                  <input 
                    id="institution" 
                    name="institution" 
                    type="text" 
                    value={institution} 
                    onChange={e => setInstitution(e.target.value)} 
                    required 
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] transition-all duration-300" 
                    disabled={loading} 
                  />
                </div>
                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-white/80">Password</label>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] transition-all duration-300 pr-12"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 text-white/60 hover:text-[#56ffbc] focus:outline-none"
                      tabIndex={0}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575m2.1-2.1A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 2.21-.715 4.25-1.925 5.925M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12S5.25 5.25 12 5.25 22.5 12 22.5 12 18.75 18.75 12 18.75 1.5 12 1.5 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password Requirements with Animated Checkboxes */}
                  <div className="text-sm text-white/70 mt-2">
                    <p>Password must:</p>
                    <ul className="space-y-2 mt-2">
                      <li className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${isLengthValid ? 'border-green-400 bg-green-400/20' : 'border-white/50'}`}>
                          {isLengthValid && (
                            <CheckIcon className="w-4 h-4 text-green-400 transform scale-0 animate-check" />
                          )}
                        </span>
                        <span className={isLengthValid ? "text-green-400" : "text-white/60"}>Be longer than 10 characters</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${isSpecialCharValid ? 'border-green-400 bg-green-400/20' : 'border-white/50'}`}>
                          {isSpecialCharValid && (
                            <CheckIcon className="w-4 h-4 text-green-400 transform scale-0 animate-check" />
                          )}
                        </span>
                        <span className={isSpecialCharValid ? "text-green-400" : "text-white/60"}>Include at least one special character (e.g., !@#$%^&*)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${isNumberValid ? 'border-green-400 bg-green-400/20' : 'border-white/50'}`}>
                          {isNumberValid && (
                            <CheckIcon className="w-4 h-4 text-green-400 transform scale-0 animate-check" />
                          )}
                        </span>
                        <span className={isNumberValid ? "text-green-400" : "text-white/60"}>Include at least one number</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all duration-300 ${isCapitalValid ? 'border-green-400 bg-green-400/20' : 'border-white/50'}`}>
                          {isCapitalValid && (
                            <CheckIcon className="w-4 h-4 text-green-400 transform scale-0 animate-check" />
                          )}
                        </span>
                        <span className={isCapitalValid ? "text-green-400" : "text-white/60"}>Include at least one capital letter</span>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#11998e] text-white font-bold rounded-lg shadow-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#56ffbc] focus:ring-offset-2 focus:ring-offset-[#07073a] disabled:bg-[#56ffbc]/50 disabled:cursor-not-allowed transition-all duration-300" 
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Register"}
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-white/70">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-[#56ffbc] hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          )}
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
  );
}