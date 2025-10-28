"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
                    <div className="space-y-1">
                        <CardTitle className="text-lg text-gray-900 line-clamp-2">{assignment.title}
                        </CardTitle>
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
                            <p className="text-sm font-medium text-gray-900">{assignment.submissionCount} submissions</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push(`/judge/${assignment.competitionId}`)}
                        size="sm"
                        className="bg-gray-900 hover:bg-gray-800"
                    >
                        Open
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
                </CardContent>
            </Card>
            ))}
        </div>
        </div>
    )
}