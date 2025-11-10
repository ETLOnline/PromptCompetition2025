"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronRight, AlertCircle, Target, Users, CheckCircle2, PlayCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
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
  const [titles, setTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!assignment || !competitionId) return

    const challengeIds = Object.keys(assignment.assignedCountsByChallenge || {})

    // Fetch titles for challenge IDs not already cached
    const fetchTitles = async () => {
      const updates: Record<string, string> = {}
      await Promise.all(
        challengeIds.map(async (id) => {
          if (titles[id]) return
          try {
            const ref = doc(db, "competitions", competitionId, "challenges", id)
            const snap = await getDoc(ref)
            if (snap.exists()) {
              const data = snap.data() as any
              const title = data?.title ?? ""
              updates[id] = title
            } else {
              updates[id] = ""
            }
          } catch (err) {
            // ignore individual fetch errors and leave title empty
            updates[id] = ""
          }
        })
      )

      if (Object.keys(updates).length > 0) {
        setTitles((prev) => ({ ...prev, ...updates }))
      }
    }

    fetchTitles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment, competitionId])
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
            .map(([challengeId, count]) => {
              // Check if challenge is evaluated (default to false if not exists)
              const isEvaluated = assignment.challengesEvaluated?.[challengeId] === true
              
              return (
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
                          <h3 className="text-lg font-semibold text-gray-900">
                            Challenge {challengeId}: {titles[challengeId] ? ` ${titles[challengeId]}` : ""}
                          </h3>
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
                        {isEvaluated ? (
                          <Button
                            onClick={() => onNavigate(challengeId)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Update Score
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => onNavigate(challengeId)}
                            size="sm"
                            className="bg-gray-900 hover:bg-gray-800"
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Start Score
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
