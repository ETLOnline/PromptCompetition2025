"use client"

import React from "react"
import Link from "next/link"
import { AppecInfoBox } from "./AppecInfoBox"
import { FeaturedCompetition } from "./FeaturedCompetition"
import { CompetitionProgressTimeline } from "./CompetitionProgressTimeline"

// Interface duplicated from FeaturedCompetition.tsx as it is not exported there.
// In a refactor, this should be moved to a shared types file (e.g., types/competition.ts).
interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  isActive?: boolean
  isLocked?: boolean
  isFeatured?: boolean
  mode?: string
  prizeMoney?: string
}

interface AppecHeroBannerProps {
  // FeaturedCompetition Props
  competition: Competition
  status: {
    status: string
    label: string
    color: string
    dotColor: string
  }
  startDateTime: { date: string; time: string }
  endDateTime: { date: string; time: string }
  isRegistered: boolean
  isCompleted: boolean
  isButtonLoading: boolean
  onButtonClick: (competition: Competition) => void

  // AppecInfoBox Props
  showInfoBox?: boolean
  onInfoBoxDismiss?: () => void
  
  // Extensibility: Allow passing children to render additional banners if needed
  children?: React.ReactNode
}

/**
 * AppecHeroBanner
 * 
 * A unified hero section wrapper that combines the AppecInfoBox and FeaturedCompetition components.
 * This component manages the layout and spacing of the top-level banners on the participant dashboard.
 * 
 * Layout Strategy:
 * - Uses the `AppecInfoBox` as the primary container.
 * - Injects `FeaturedCompetition` as a child of `AppecInfoBox`, placing it between the info grid and the footer.
 * - This achieves the "sandwich" layout requested: [Info Header] -> [Featured Competition] -> [Info Footer].
 * 
 * Extensibility:
 * - The `children` prop allows injecting additional content below the main banner.
 */
export function AppecHeroBanner({
  competition,
  status,
  startDateTime,
  endDateTime,
  isRegistered,
  isCompleted,
  isButtonLoading,
  onButtonClick,
  showInfoBox = true,
  onInfoBoxDismiss,
  children
}: AppecHeroBannerProps) {
  
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="w-full animate-in fade-in slide-in-from-top-4 duration-500">
        {/* Conditional: Partial AppecInfoBox (without footer) - only if showInfoBox is true */}
        {showInfoBox && (
          <AppecInfoBox 
            initiallyVisible={true} 
            onDismiss={onInfoBoxDismiss}
            showFooter={false}
          />
        )}
        
        {/* Competition Progress Timeline */}
        <div className={`w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 ${showInfoBox ? 'mt-6 sm:mt-8' : ''}`}>
          <CompetitionProgressTimeline />
        </div>

        {/* Featured Competition */}
        <div className="mt-6 sm:mt-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <FeaturedCompetition
            competition={competition}
            status={status}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            isRegistered={isRegistered}
            isCompleted={isCompleted}
            isButtonLoading={isButtonLoading}
            onButtonClick={onButtonClick}
          />
        </div>

        {/* Footer CTA Line (from AppecInfoBox) - only if showInfoBox is true */}
        {showInfoBox && (
          <div className="mt-6 sm:mt-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-450">
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition duration-500" />
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="relative p-4 sm:p-5 md:p-7">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-center sm:text-left">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600 leading-snug">
                        Registration <span className="font-semibold text-emerald-600">open now</span> • Click on register in the featured competitions section above
                      </span>
                    </div>
                    <Link
                      href="/rules"
                      className="w-full sm:w-auto px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] rounded-lg transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 text-center whitespace-nowrap"
                    >
                      View Rules
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Extension Slot (For future banners/content) */}
        {children && (
          <div className="mt-6 sm:mt-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-600">
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
