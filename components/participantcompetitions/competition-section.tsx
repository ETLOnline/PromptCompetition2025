import { Badge } from "@/components/ui/badge"
import { CompetitionCard } from "./competition-card"

interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  isActive?: boolean
  isLocked?: boolean
  location?: string
  prizeMoney?: string
}

interface CompetitionSectionProps {
  title: string
  competitions: Competition[]
  dotColor: string
  badgeColor: string
  viewMode: "grid" | "list"
  getCompetitionStatus: (competition: Competition) => any
  formatDateTime: (date: any) => { date: string; time: string }
  participantMap: Record<string, boolean>
  completionMap: Record<string, boolean>
  loadingMap: Record<string, boolean>
  buttonStatesLoading: Record<string, boolean>
  onCardClick: (competition: Competition) => void
  onButtonClick: (competition: Competition) => void
}

export const CompetitionSection = ({
  title,
  competitions,
  dotColor,
  badgeColor,
  viewMode,
  getCompetitionStatus,
  formatDateTime,
  participantMap,
  completionMap,
  loadingMap,
  buttonStatesLoading,
  onCardClick,
  onButtonClick,
}: CompetitionSectionProps) => {
  if (competitions.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-3 h-3 ${dotColor} rounded-full`}></div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <Badge className={`${badgeColor} border font-medium`}>{competitions.length}</Badge>
      </div>
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {competitions.map((competition) => {
          const status = getCompetitionStatus(competition)
          const startDateTime = formatDateTime(competition.startDeadline)
          const endDateTime = formatDateTime(competition.endDeadline)
          const isRegistered = participantMap[competition.id]
          const isButtonLoading = loadingMap[competition.id] || buttonStatesLoading[competition.id] || false
          const isCompleted = completionMap[competition.id] || false

          return (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              status={status}
              startDateTime={startDateTime}
              endDateTime={endDateTime}
              isRegistered={isRegistered}
              isCompleted={isCompleted}
              isButtonLoading={isButtonLoading}
              onCardClick={onCardClick}
              onButtonClick={onButtonClick}
            />
          )
        })}
      </div>
    </div>
  )
}
