import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Users, Scale, CheckCircle } from "lucide-react"
import type { JudgeStats as JudgeStatsType } from "@/types/judge-submission"
import { Progress } from "@/components/ui/progress"

interface JudgeStatsProps {
  stats: JudgeStatsType
}

export function JudgeStats({ stats }: JudgeStatsProps) {
    const statCards = [
        {
        title: "Assigned Competitions",
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
        title: "Evaluated Submissions",
        value: stats.evaluatedSubmissions || 0,
        icon: CheckCircle,
        bgColor: "bg-green-50",
        iconColor: "text-green-600",
        },
        {
        title: "Pending Evaluation",
        value: stats.totalSubmissions - (stats.evaluatedSubmissions || 0),
        icon: Scale,
        bgColor: "bg-amber-50",
        iconColor: "text-amber-600",
        },
    ] as Array<{
        title: string;
        value: number;
        icon: any;
        bgColor: string;
        iconColor: string;
    }>

    const percent = typeof stats.evaluatedSubmissions === "number" && stats.totalSubmissions > 0
        ? Math.round((stats.evaluatedSubmissions / stats.totalSubmissions) * 100)
        : 0

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            {typeof stats.evaluatedSubmissions === "number" && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-muted-foreground">Evaluation Progress</p>
                            <p className="text-sm font-medium text-gray-700">{percent}% ({(stats.evaluatedSubmissions || 0).toLocaleString()}/{stats.totalSubmissions.toLocaleString()})</p>
                        </div>
                        <Progress value={percent} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
