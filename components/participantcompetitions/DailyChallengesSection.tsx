"use client"

import { Badge } from "@/components/ui/badge"
import { DailyChallengeCard, DailyChallengeSkeleton } from "./DailyChallengeCard"
import { ChallengeVotingSection } from "./ChallengeVotingSection"
import { JudgeFeedbackSection } from "./JudgeFeedbackSection"
import { PastDailyChallengesSection } from "./PastDailyChallengesSection"

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
  userRole: "participant" | "admin" | "judge" | "superadmin"
}

export const DailyChallengesSection = ({ 
  challenges, 
  loading,
  onViewDetails,
  userRole
}: DailyChallengesSectionProps) => {
  // Filter challenges into active and completed
  const now = new Date()
  
  const activeChallenges = challenges.filter((challenge) => {
    let endDate: Date
    if (challenge.endTime?._seconds) {
      endDate = new Date(challenge.endTime._seconds * 1000)
    } else if (challenge.endTime?.seconds) {
      endDate = new Date(challenge.endTime.seconds * 1000)
    } else {
      endDate = new Date(challenge.endTime)
    }
    
    return endDate >= now
  })
  
  const completedChallenges = challenges.filter((challenge) => {
    let endDate: Date
    if (challenge.endTime?._seconds) {
      endDate = new Date(challenge.endTime._seconds * 1000)
    } else if (challenge.endTime?.seconds) {
      endDate = new Date(challenge.endTime.seconds * 1000)
    } else {
      endDate = new Date(challenge.endTime)
    }
    
    return endDate < now
  })

  // Don't render section if no challenges and not loading
  if (!loading && challenges.length === 0) {
    return null
  }

  return (
    <div>
      {/* Section Header - Clean and Professional */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
          <div className={`w-2 h-2 sm:w-3 sm:h-3 bg-[#0f172a] rounded-full flex-shrink-0`}></div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Daily Prompt Challenge</h2>
          {!loading && activeChallenges.length > 0 && (
            <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1">
              {activeChallenges.length} Active
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed ml-4 sm:ml-5 md:ml-6">
          Test your prompt engineering skills in preparation for Prompt Idol Pakistan 2026
        </p>
      </div>

      {/* Active Challenges Display */}
      <div className={activeChallenges.length === 1 && !loading ? "" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"}>
        {loading ? (
          // Show skeletons while loading
          <>
            <DailyChallengeSkeleton />
            <DailyChallengeSkeleton />
            <DailyChallengeSkeleton />
          </>
        ) : (
          // Show actual active challenges
          activeChallenges.map((challenge) => (
            <DailyChallengeCard
              key={challenge.id}
              challenge={challenge}
              onViewDetails={onViewDetails}
              isSingle={activeChallenges.length === 1}
            />
          ))
        )}
      </div>

      {/* Voting Section - Show for each active challenge */}
      {!loading && activeChallenges.length > 0 && activeChallenges.map((challenge) => (
        <div key={`voting-${challenge.id}`} className="mt-8 sm:mt-12">
          <ChallengeVotingSection
            challengeId={challenge.id}
            challengeTitle={challenge.title}
          />
        </div>
      ))}

      {/* Judge Feedback Section - Show for each active challenge */}
      {!loading && activeChallenges.length > 0 && activeChallenges.map((challenge) => (
        <JudgeFeedbackSection
          key={`feedback-${challenge.id}`}
          challengeId={challenge.id}
          challengeTitle={challenge.title}
          userRole={userRole}
        />
      ))}

      {/* Past Daily Challenges Section */}
      {!loading && completedChallenges.length > 0 && (
        <PastDailyChallengesSection challenges={completedChallenges} />
      )}
    </div>
  )
}
