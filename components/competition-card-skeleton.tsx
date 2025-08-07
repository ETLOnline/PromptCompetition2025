import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function CompetitionCardSkeleton() {
  return (
    <Card className="w-[90vw] md:w-[420px] flex-shrink-0 bg-white shadow-lg rounded-xl h-full flex flex-col border-0 overflow-hidden animate-pulse">
      <div className="relative">
        <CardHeader className="p-8 relative">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2 flex-1">
              <div className="h-6 w-24 bg-gray-200 rounded-md mb-2" /> {/* Badge skeleton */}
              <div className="h-8 w-3/4 bg-gray-200 rounded-md" /> {/* Title skeleton */}
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl" /> {/* Icon skeleton */}
          </div>
        </CardHeader>
      </div>
      <CardContent className="p-8 pt-0 mt-auto space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-lg" /> {/* Icon placeholder */}
              <div>
                <div className="h-3 w-16 bg-gray-200 rounded-md mb-1" /> {/* Label skeleton */}
                <div className="h-4 w-24 bg-gray-200 rounded-md" /> {/* Value skeleton */}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="h-14 w-32 bg-gray-200 rounded-xl" /> {/* Button skeleton */}
        </div>
      </CardContent>
    </Card>
  )
}
