"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Scale, ChevronRight } from "lucide-react"
import { getAvatarColor } from "../../lib/judge/utils"
import type { JudgeAssignment } from "@/types/judge-submission"

interface JudgeAssignmentsListProps {
    assignments: JudgeAssignment[]
}

export function JudgeAssignmentsList({ assignments }: JudgeAssignmentsListProps) {
    const router = useRouter()

    if (assignments.length === 0) {
        return (
        <div className="space-y-6">
            <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Assignments</h2>
            <p className="text-gray-600">Competitions where you are assigned as a judge</p>
            </div>

            <Card>
            <CardContent className="p-12 text-center">
                <Scale className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600">
                You haven't been assigned to any competitions yet. Check back later or contact your administrator.
                </p>
            </CardContent>
            </Card>
        </div>
        )
    }

    return (
        <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Assignments</h2>
            <p className="text-gray-600">Competitions where you are assigned as a judge</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
            <Card key={assignment.competitionId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg text-gray-900 line-clamp-2">{assignment.title}</CardTitle>
                            {assignment.level && (
                                <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${
                                        assignment.level === "Level 1" 
                                            ? "bg-blue-100 text-blue-700" 
                                            : assignment.level === "Level 2"
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                >
                                    {assignment.level}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className={`${getAvatarColor(assignment.title)} text-white font-semibold`}>
                                {assignment.title
                                    .split(" ")
                                    .map((word) => word[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            {assignment.level === "Level 2" ? (
                                <>
                                    <p className="text-sm font-medium text-gray-900">
                                        {assignment.participantCount || 0} {(assignment.participantCount || 0) === 1 ? 'participant' : 'participants'}
                                    </p>
                                    {assignment.level2Assignments && (
                                        <p className="text-xs text-gray-600">
                                            {Object.keys(assignment.level2Assignments).length} {Object.keys(assignment.level2Assignments).length === 1 ? 'batch' : 'batches'}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm font-medium text-gray-900">
                                    {assignment.submissionCount} {assignment.submissionCount === 1 ? 'submission' : 'submissions'}
                                </p>
                            )}
                        </div>
                    </div>
                    {assignment.AllChallengesEvaluated ? (
                      <Button
                        onClick={() => {
                          const route = assignment.level === "Level 2" 
                            ? `/judge/${assignment.competitionId}/level2` 
                            : `/judge/${assignment.competitionId}`
                          router.push(route)
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Update Score
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          const route = assignment.level === "Level 2" 
                            ? `/judge/${assignment.competitionId}/level2` 
                            : `/judge/${assignment.competitionId}`
                          router.push(route)
                        }}
                        size="sm"
                        className="bg-gray-900 hover:bg-gray-800"
                      >
                        Open
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                </div>
                </CardContent>
            </Card>
            ))}
        </div>
        </div>
    )
}