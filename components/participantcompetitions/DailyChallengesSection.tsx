"use client"

import { Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DailyChallengeCard, DailyChallengeSkeleton } from "./DailyChallengeCard"
import { ChallengeVotingSection } from "./ChallengeVotingSection"

interface DailyChallenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  startTime: any
  endTime: any
  status: string
  type: string
  totalSubmissions: number
  createdAt?: any
  createdBy?: string
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls?: string[]
}

interface DailyChallengesSectionProps {
  challenges: DailyChallenge[]
  loading: boolean
  onViewDetails?: (challenge: DailyChallenge) => void
}

export const DailyChallengesSection = ({ 
  challenges, 
  loading,
  onViewDetails 
}: DailyChallengesSectionProps) => {
  // Don't render section if no challenges and not loading
  if (!loading && challenges.length === 0) {
    return null
  }

  return (
    <div>
      {/* Section Header - Prominent Daily Challenge Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0f172a] shadow-lg shrink-0">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Daily Prompt Challenge
              </h3>
              {!loading && challenges.length > 0 && (
                <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs sm:text-sm px-2 sm:px-3 py-1">
                  {challenges.length} Active
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Test your prompt engineering skill to prepare for the actual Prompt Idol Pakistan 2026
            </p>
          </div>
        </div>
      </div>

      {/* Challenges Grid - Full width for single challenge, grid for multiple */}
      <div className={challenges.length === 1 && !loading ? "" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
        {loading ? (
          // Show skeletons while loading
          <>
            <DailyChallengeSkeleton />
            <DailyChallengeSkeleton />
            <DailyChallengeSkeleton />
          </>
        ) : (
          // Show actual challenges
          challenges.map((challenge) => (
            <DailyChallengeCard
              key={challenge.id}
              challenge={challenge}
              onViewDetails={onViewDetails}
              isSingle={challenges.length === 1}
            />
          ))
        )}
      </div>

      {/* Voting Section - Show for active challenges */}
      {!loading && challenges.length > 0 && challenges.map((challenge) => (
        <div key={`voting-${challenge.id}`} className="mt-12">
          <ChallengeVotingSection
            challengeId={challenge.id}
            challengeTitle={challenge.title}
          />
        </div>
      ))}
    </div>
  )
}
