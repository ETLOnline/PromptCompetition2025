"use client"

import { SignUp } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"

export default function RegisterPage() {
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
                  Join the Spark Ecosystem!
                </h1>
                <p className="text-base text-gray-600">
                  Create your Spark account and become part of a growing community of learners, innovators, and achievers.
                </p>
              </div>

              {/* Benefits - Compact version */}
              <div className="space-y-3 mt-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Access Spark Learning Resources</h3>
                    <p className="text-xs text-gray-600">Unlock competitions, challenges, and curated content</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Track Your Spark Journey</h3>
                    <p className="text-xs text-gray-600">Monitor your progress and achievements within Spark</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Connect Across Spark</h3>
                    <p className="text-xs text-gray-600">Engage with peers, mentors, and the Spark global network</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Your Spark Profile is Secure</h3>
                    <p className="text-xs text-gray-600">Enjoy a safe and private experience across the Spark ecosystem</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Clerk Sign Up Component */}
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

              {/* Sign up card wrapper */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-gray-100">
                  {/* Spark Logo and Heading */}
                  {/* <div className="text-center mb-4">
                    <Image
                      src="/images/sparklogo.png"
                      alt="Spark Logo"
                      width={50}
                      height={50}
                      className="mx-auto mb-3 object-contain"
                      priority
                    />
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Sign up for Spark</h2>
                  </div> */}

                  {/* Clerk Sign Up Component */}
                  <SignUp
                    routing="path"
                    path="/auth/register"
                    redirectUrl="/profile-setup"
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
                    signInUrl="/auth/login"
                  />
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
      `}</style>
    </div>
  )
}