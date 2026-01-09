"use client"

import Link from "next/link"
import { useState } from "react"
import { BookOpen, Calendar, Trophy, Users, X, Sparkles, Award, ExternalLink } from "lucide-react"

interface AppecInfoBoxProps {
  initiallyVisible?: boolean
  onDismiss?: () => void
  children?: React.ReactNode
  showFooter?: boolean // Control whether to show the footer CTA
}

export function AppecInfoBox({ initiallyVisible = true, onDismiss, children, showFooter = true }: AppecInfoBoxProps) {
  const [visible, setVisible] = useState(initiallyVisible)

  if (!visible) return null

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <div className="relative group">
      {/* Animated border gradient */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition duration-500" />
      
      <section className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full -translate-y-32 translate-x-32 opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-50 to-transparent rounded-full translate-y-24 -translate-x-24 opacity-50" />
        
        <div className="relative p-4 sm:p-5 md:p-7">
          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 z-10 inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 hover:rotate-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            aria-label="Dismiss APPEC information"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          {/* Header Section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              {/* Trophy Icon */}
              <div className="hidden sm:flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#0f172a] shadow-lg shadow-gray-900/20 shrink-0">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              
              <div className="flex-1 pr-8 sm:pr-10">
                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-semibold shadow-sm">
                    <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    FEATURED
                  </span>
                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-semibold">
                    NATIONAL COMPETITION
                  </span>
                  <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] sm:text-xs font-semibold">
                    2025
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 leading-tight">
                  All Pakistan Prompt Engineering Competition (APPEC)
                </h2>
                
                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Showcase your prompt engineering skills on a national stage. Join now to compete for top honors with reviews from both LLM and human judges.
                </p>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-5">
            {/* Start Date Card */}
            <div className="relative group/card">
              <div className="relative bg-white border-2 border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all hover:shadow-md hover:scale-[1.02] hover:border-blue-300">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-100 text-blue-600 transition-colors">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-gray-500">Starts</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-800 pl-10 sm:pl-12">
                  Saturday, 17th January
                </div>
              </div>
            </div>

            {/* Prize Money Card */}
            <div className="relative group/card">
              <div className="relative bg-white border-2 border-orange-200 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all hover:shadow-md hover:scale-[1.02] hover:border-orange-300">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-100 text-orange-600 transition-colors">
                    <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-gray-500">Prize</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-800 pl-10 sm:pl-12">
                  Rs 275,000
                </div>
              </div>
            </div>

            {/* Judges Card */}
            <div className="relative group/card">
              <div className="relative bg-white border-2 border-emerald-200 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all hover:shadow-md hover:scale-[1.02] hover:border-emerald-300">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-100 text-emerald-600 transition-colors">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-gray-500">Reviewed by</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-800 pl-10 sm:pl-12">
                  LLM & Human judges
                </div>
              </div>
            </div>

            {/* Resources Card */}
            <div className="relative group/card">
              <div className="relative bg-white border-2 border-purple-200 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all hover:shadow-md hover:scale-[1.02] hover:border-purple-300">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-100 text-purple-600 transition-colors">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-gray-500">Resources</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold pl-10 sm:pl-12">
                  <Link
                    href="/rules"
                    className="inline-flex items-center gap-0.5 sm:gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Rules
                    <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Link>
                  <span className="text-gray-400">•</span>
                  <Link
                    href="/tutorial"
                    className="inline-flex items-center gap-0.5 sm:gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Tutorials
                    <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Injected Content (e.g. Featured Competition) */}
          {children && (
            <div className="mb-4 sm:mb-5">
              {children}
            </div>
          )}

          {/* Footer CTA */}
          {showFooter && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-gray-100">
              <div className="flex items-center gap-2 text-center sm:text-left">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 leading-snug">
                  Registration <span className="font-semibold text-emerald-600">open now</span> • Click on register in the featured competitions section below
                </span>
              </div>
              <Link
                href="/rules"
                className="w-full sm:w-auto px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] rounded-lg transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 text-center whitespace-nowrap"
              >
                View Rules
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}