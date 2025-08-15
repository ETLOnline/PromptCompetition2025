import { Card, CardContent } from "@/components/ui/card"
import { Users, Target, Scale } from "lucide-react"
import type { CompetitionAssignment } from "@/types/judge-submission"

interface CompetitionStatsProps {
  assignment: CompetitionAssignment
  isLoading: boolean
}

export function CompetitionStats({ assignment, isLoading }: CompetitionStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalSubmissions = assignment.assignedCountTotal || 0
  const challengeCount = Object.keys(assignment.assignedCountsByChallenge || {}).length
  const lastUpdated = assignment.updatedAt
    ? new Date(assignment.updatedAt.seconds * 1000).toLocaleDateString()
    : "Recently"

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
              <p className="text-3xl font-bold tracking-tight text-gray-900">{totalSubmissions.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Challenges</p>
              <p className="text-3xl font-bold tracking-tight text-gray-900">{challengeCount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-lg font-bold tracking-tight text-gray-900">{lastUpdated}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50">
              <Scale className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
