"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronRight, AlertCircle, Target, Users } from "lucide-react"
import { getAvatarColor } from "@/lib/judge/utils"
import type { CompetitionAssignment } from "@/types/judge-submission"

interface ChallengeListProps {
  assignment: CompetitionAssignment | null
  isLoading: boolean
  competitionId: string
  onNavigate: (challengeId: string) => void
}

const ChallengeRowSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export function ChallengeList({ assignment, isLoading, competitionId, onNavigate }: ChallengeListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assigned Challenges</h2>
          <p className="text-gray-600">Click on any challenge to start scoring submissions</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ChallengeRowSkeleton key={i} />
          ))}
        </div>
      ) : !assignment ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Competition Not Found</h3>
            <p className="text-gray-600">You don't have access to this competition or it doesn't exist.</p>
          </CardContent>
        </Card>
      ) : Object.keys(assignment.assignedCountsByChallenge || {}).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Challenges Assigned</h3>
            <p className="text-gray-600">You haven't been assigned to any challenges in this competition yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(assignment.assignedCountsByChallenge || {})
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([challengeId, count]) => (
              <Card key={challengeId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={`${getAvatarColor(challengeId)} text-white font-bold`}>
                          {challengeId.toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900">Challenge {challengeId}</h3>
                        <p className="text-sm text-gray-600">
                          {count} submission{count !== 1 ? "s" : ""} assigned to you
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        {count}
                      </Badge>
                      <Button
                        onClick={() => onNavigate(challengeId)}
                        size="sm"
                        className="bg-gray-900 hover:bg-gray-800"
                      >
                        Score
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
