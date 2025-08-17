import { Card, CardContent } from "@/components/ui/card"

export const CompetitionSkeleton = () => (
  <Card className="group relative overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-6 w-16 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse ml-4"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse flex-1"></div>
            </div>
          ))}
        </div>
        <div className="h-11 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
)
