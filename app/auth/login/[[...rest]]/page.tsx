"use client"

import { SignIn } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-6xl mx-auto px-4 py-8">
        {/* Success message banner */}
        {message === 'profile-complete' && (
          <div className="mb-6 mx-auto max-w-2xl">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">Profile completed successfully!</p>
                <p className="text-sm">Please sign in to access your dashboard.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding and Information */}
          <div className="hidden lg:flex flex-col justify-center space-y-6 p-8">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center mb-4">
              <Image
                src="/images/Logo-for-Picton-Blue.png"
                alt="Empowerment Through Learning Logo"
                width={200}
                height={80}
                className="object-contain"
                priority
              />
            </Link>

            {/* Welcome text */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">
                Welcome Back!
              </h1>
              <p className="text-lg text-gray-600">
                Sign in to access your account and continue your journey with us.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Authentication</h3>
                  <p className="text-sm text-gray-600">Your data is protected with industry-standard security</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Fast & Easy</h3>
                  <p className="text-sm text-gray-600">Quick sign-in process to get you started</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Join Our Community</h3>
                  <p className="text-sm text-gray-600">Connect with learners worldwide</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Clerk Sign In Component */}
          <div className="flex flex-col items-center justify-center">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/images/Logo-for-Picton-Blue.png"
                  alt="Empowerment Through Learning Logo"
                  width={150}
                  height={60}
                  className="object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Sign in card wrapper */}
            <div className="w-full max-w-md">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="mb-6 text-center lg:hidden">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                  <p className="text-gray-600">Sign in to continue</p>
                </div>

                {/* Clerk Sign In Component */}
                <SignIn
                  routing="path"
                  path="/auth/login"
                  appearance={{
                    elements: {
                      formButtonPrimary: 
                        "bg-[#10142c] hover:bg-[#1a1f3a] text-white shadow-lg transition-all duration-300",
                      card: "shadow-none border-0 bg-transparent",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: 
                        "border-gray-300 hover:bg-gray-50 transition-all duration-200",
                      formFieldInput: 
                        "rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                      footerActionLink: 
                        "text-blue-600 hover:text-blue-700 font-medium",
                      identityPreviewText: "text-gray-700",
                      formFieldLabel: "text-gray-700 font-medium",
                    },
                  }}
                  signUpUrl="/auth/register"
                />
              </div>

              {/* Additional links */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link 
                    href="/auth/register" 
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>

              {/* Back to home */}
              <div className="mt-4 text-center">
                <Link 
                  href="/" 
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
