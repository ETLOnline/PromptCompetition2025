import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Users, Scale } from "lucide-react"
import type { JudgeStats as JudgeStatsType } from "@/types/judge-submission"

interface JudgeStatsProps {
  stats: JudgeStatsType
}

export function JudgeStats({ stats }: JudgeStatsProps) {
    const statCards = [
        {
        title: "Active Competitions",
        value: stats.activeCompetitions,
        icon: Trophy,
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
        },
        {
        title: "Total Submissions",
        value: stats.totalSubmissions,
        icon: Users,
        bgColor: "bg-emerald-50",
        iconColor: "text-emerald-600",
        },
        {
        title: "Challenges",
        value: stats.challenges,
        icon: Scale,
        bgColor: "bg-amber-50",
        iconColor: "text-amber-600",
        },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
            const Icon = stat.icon
            return (
            <Card key={stat.title}>
                <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">{stat.value.toLocaleString()}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                </div>
                </CardContent>
            </Card>
            )
        })}
        </div>
    )
}
