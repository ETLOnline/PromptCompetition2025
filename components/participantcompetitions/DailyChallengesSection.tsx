"use client"

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
      {/* Section Header - Clean and Professional */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-2 h-2 sm:w-3 sm:h-3 bg-[#0f172a] rounded-full`}></div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Daily Prompt Challenge</h2>
          {!loading && challenges.length > 0 && (
            <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs px-2.5 py-1">
              {challenges.length} Active
            </Badge>
          )}
        </div>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed ml-5 sm:ml-6">
          Test your prompt engineering skills in preparation for Prompt Idol Pakistan 2026
        </p>
      </div>

      {/* Challenges Display */}
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
