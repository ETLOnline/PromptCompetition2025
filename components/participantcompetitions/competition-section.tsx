import { Badge } from "@/components/ui/badge"
import { CompetitionCard } from "./competition-card"
import { FeaturedCompetition } from "./FeaturedCompetition"

interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  ChallengeCount?: number
  isActive?: boolean
  isLocked?: boolean
  isFeatured?: boolean
  mode?: string
  prizeMoney?: string
  location?: string
  level?: string
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
  onCardClick: (competition: Competition) => void
  onButtonClick: (competition: Competition) => void
  isFiltered?: boolean
  emptyTitle?: string
  emptyMessage?: string
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
  onCardClick,
  onButtonClick,
  isFiltered = false,
  emptyTitle,
  emptyMessage,
}: CompetitionSectionProps) => {
  if (competitions.length === 0) {
    if (isFiltered) {
      // When filtered, display an empty state specific to the section
      return (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
          <div>
            {/* Reuse the EmptyState component if available via props, otherwise show a lightweight message */}
            {/* Avoid importing EmptyState here to keep this component focused; render a simple card-like message */}
            <div className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="p-8 text-center">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">{emptyTitle || "No competitions match your criteria"}</h4>
                  <p className="text-gray-600">{emptyMessage || "Try adjusting your search terms or filters to find what you're looking for."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  // Separate featured and regular competitions
  const featuredCompetitions = competitions.filter(c => c.isFeatured)
  const regularCompetitions = competitions.filter(c => !c.isFeatured)

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className={`w-2 h-2 sm:w-3 sm:h-3 ${dotColor} rounded-full`}></div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
        <Badge className={`${badgeColor} border font-medium text-xs`}>{competitions.length}</Badge>
      </div>
      
      {/* Render featured competitions first with special UI */}
      {featuredCompetitions.map((competition) => {
        const status = getCompetitionStatus(competition)
        const startDateTime = formatDateTime(competition.startDeadline)
        const endDateTime = formatDateTime(competition.endDeadline)
        const isRegistered = participantMap[competition.id]
        const isButtonLoading = loadingMap[competition.id]
        const isCompleted = completionMap[competition.id] || false

        return (
          <div key={competition.id} className="mb-6">
            <FeaturedCompetition
              competition={competition}
              status={status}
              startDateTime={startDateTime}
              endDateTime={endDateTime}
              isRegistered={isRegistered}
              isCompleted={isCompleted}
              isButtonLoading={isButtonLoading}
              onButtonClick={onButtonClick}
            />
          </div>
        )
      })}

      {/* Render regular competitions in grid/list view */}
      {regularCompetitions.length > 0 && (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {regularCompetitions.map((competition) => {
            const status = getCompetitionStatus(competition)
            const startDateTime = formatDateTime(competition.startDeadline)
            const endDateTime = formatDateTime(competition.endDeadline)
            const isRegistered = participantMap[competition.id]
            const isButtonLoading = loadingMap[competition.id]
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
      )}
    </div>
  )
}
