"use client"

import { SignIn, useUser } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useUserProfile } from "@/hooks/useUserProfile"

export default function LoginPage() {
  const { user, isLoaded } = useUser()
  const { userProfile, loading: profileLoading } = useUserProfile()
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const [showSuccess, setShowSuccess] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  // Enhanced role-based redirection after login
  useEffect(() => {
    // Don't do anything if not loaded or already redirecting
    if (!isLoaded || redirecting) return
    
    // If user is authenticated
    if (user) {
      // If profile is still loading, wait
      if (profileLoading) return
      
      // User is authenticated and profile data is loaded
      if (userProfile) {
        const role = userProfile.role
        setRedirecting(true)
        
        if (!role) {
          // No role set - redirect to profile setup
          router.replace('/profile-setup')
          return
        }
        
        // Role-based redirection
        switch (role) {
          case 'participant':
            router.replace('/participant')
            break
          case 'judge':
            router.replace('/judge')
            break
          case 'admin':
          case 'superadmin':
            router.replace('/admin/select-competition')
            break
          default:
            // Unknown role - redirect to profile setup
            router.replace('/profile-setup')
            break
        }
      } else {
        // User exists but no profile data - wait a bit then redirect to profile setup
        const timer = setTimeout(() => {
          if (!profileLoading) {
            setRedirecting(true)
            router.replace('/profile-setup')
          }
        }, 2000) // Wait 2 seconds for profile to load
        
        return () => clearTimeout(timer)
      }
    }
  }, [isLoaded, user, userProfile, profileLoading, router, redirecting])

  // Handle success message display
  useEffect(() => {
    if (message === 'profile-complete') {
      setShowSuccess(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])
  
  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Back to home button */}
      <div className="absolute top-4 left-4 z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to home
        </Link>
      </div>

      {/* Success message popup */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg max-w-md">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Profile completed successfully!</p>
              <p className="text-xs">Please sign in to access your dashboard.</p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative h-full flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            {/* Left side - Branding and Information */}
            <div className="hidden lg:flex flex-col justify-center space-y-4 p-6">
              {/* Logos */}
              <div className="flex items-center gap-4 mb-1">
                <Link href="/" className="inline-flex">
                  <Image
                    src="/images/Logo-for-Picton-Blue.png"
                    alt="Empowerment Through Learning Logo"
                    width={160}
                    height={64}
                    className="object-contain"
                    priority
                  />
                </Link>
                <Link href="https://spark.etlonline.org/">
                  <Image
                    src="/images/sparkwithtext.png"
                    alt="Spark Logo"
                    width={160}
                    height={160}
                    className="object-contain"
                    priority
                  />
                </Link>
              </div>

              {/* Welcome text */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome Back to Spark!
                </h1>
                <p className="text-base text-gray-600">
                  Sign in to access your Spark profile and continue your learning and growth journey.
                </p>
              </div>

              {/* Benefits - Compact version */}
              <div className="space-y-3 mt-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Secure Spark Authentication</h3>
                    <p className="text-xs text-gray-600">Your data and activity are protected across the Spark ecosystem</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Fast & Simple Sign-In</h3>
                    <p className="text-xs text-gray-600">Pick up right where you left off in Spark</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Stay Connected with Spark</h3>
                    <p className="text-xs text-gray-600">Engage with the Spark community anytime</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Clerk Sign In Component */}
            <div className="flex flex-col items-center justify-center">
              {/* Mobile logo */}
              <div className="lg:hidden mb-6">
                <Link href="/" className="inline-flex items-center">
                  <Image
                    src="/images/Logo-for-Picton-Blue.png"
                    alt="Empowerment Through Learning Logo"
                    width={140}
                    height={56}
                    className="object-contain"
                    priority
                  />
                </Link>
              </div>

              {/* Sign in card wrapper */}
              <div className="w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100">
                  {/* Header */}
                  {/* <div className="text-center pt-6 pb-4 px-6">
                    <Image
                      src="/images/sparklogo.png"
                      alt="Spark Logo"
                      width={45}
                      height={45}
                      className="mx-auto mb-3 object-contain"
                      priority
                    />
                    <h2 className="text-xl font-bold text-gray-900">Sign in to Spark</h2>
                  </div> */}

                  {/* Clerk component */}
                  <div className="px-6 pb-6">
                    <SignIn
                      routing="path"
                      path="/auth/login"
                      afterSignInUrl="/auth/login"
                      redirectUrl="/auth/login"
                      appearance={{
                        elements: {
                          formButtonPrimary: 
                            "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all duration-300 normal-case",
                          card: "shadow-none border-0 bg-transparent",
                          headerTitle: "hidden",
                          headerSubtitle: "hidden",
                          socialButtonsBlockButton: 
                            "border-gray-300 hover:bg-gray-50 transition-all duration-200 text-sm",
                          formFieldInput: 
                            "rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm",
                          footerActionLink: 
                            "text-indigo-600 hover:text-indigo-700 font-medium",
                          identityPreviewText: "text-gray-700",
                          formFieldLabel: "text-gray-700 font-medium text-sm",
                          formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700",
                          footerAction: "text-sm",
                          dividerLine: "bg-gray-300",
                          dividerText: "text-gray-500 text-sm",
                          socialButtonsBlockButtonText: "text-gray-700 font-medium text-sm",
                        },
                      }}
                      signUpUrl="/auth/register"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
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
        
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        /* Custom scrollbar styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  )
}