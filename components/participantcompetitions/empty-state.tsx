import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Sparkles } from "lucide-react"

interface EmptyStateProps {
  searchTerm: string
  filterStatus: string
  title?: string
  message?: string
}

export const EmptyState = ({ searchTerm, filterStatus, title, message }: EmptyStateProps) => {
  const displayTitle =
    title ?? (searchTerm || filterStatus !== "all" ? "No competitions match your criteria" : "No competitions available yet")

  const displayMessage =
    message ?? (searchTerm || filterStatus !== "all"
      ? "Try adjusting your search terms or filters to find what you're looking for."
      : "There are currently no competitions available. Check back later for new exciting competitions to join.")

  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-12 text-center">
        <div className="space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">{displayTitle}</h3>
            <p className="text-gray-600 max-w-md mx-auto">{displayMessage}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
