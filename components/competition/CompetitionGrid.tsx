"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, DollarSign,Trophy, ArrowRight, CheckCircle2, XCircle, Clock, Edit, Eye, Star } from "lucide-react"
import type { Competition } from "@/types/competition"
// import { FaRupeeSign } from 'react-icons/fa'; // Example from Font Awesome


interface CompetitionGridProps {
  competitions: Competition[]
  onEdit: (competition: Competition) => void
  onView: (competition: Competition) => void
  onManage: (competitionId: string) => void
  role: string
  viewMode: "grid" | "list"
}

export default function CompetitionGrid({
  competitions,
  onEdit,
  onView,
  onManage,
  role,
  viewMode,
}: CompetitionGridProps) {
  const getCompetitionStatus = (competition: Competition) => {
    const now = new Date()
    const startDate = new Date(competition.startDeadline)
    const endDate = new Date(competition.endDeadline)

    if (competition.isLocked) {
      return {
        label: "Locked",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: XCircle,
        dotColor: "bg-gray-400",
      }
    }

    if (!competition.isActive) {
      return {
        label: "Inactive",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
        dotColor: "bg-red-400",
      }
    }

    if (now < startDate) {
      return {
        label: "Upcoming",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Clock,
        dotColor: "bg-blue-400",
      }
    }

    if (now >= startDate && now <= endDate && competition.isActive && !competition.isLocked) {
      return {
        label: "Active",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2,
        dotColor: "bg-green-400",
      }
    }

    if (now > endDate) {
      return {
        label: "Ended",
        color: "bg-gray-50 text-gray-600 border-gray-200",
        icon: CheckCircle2,
        dotColor: "bg-gray-400",
      }
    }

    return {
      label: "Active",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
      dotColor: "bg-green-400",
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }
  }

  return (
    <div
      className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" : "space-y-4 mb-8"}
    >
      {competitions.map((competition) => {
        const status = getCompetitionStatus(competition)
        const startDateTime = formatDateTime(competition.startDeadline)
        const endDateTime = formatDateTime(competition.endDeadline)

        return (
          <Card
            key={competition.id}
            className="group relative overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 h-fit"
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${status.color} border font-medium whitespace-nowrap hover:bg-transparent`}>
                    <div className={`w-2 h-2 ${status.dotColor} rounded-full mr-1.5`}></div>
                    {status.label}
                  </Badge>
                  {competition.isFeatured && (
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-medium whitespace-nowrap hover:bg-transparent">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mr-1.5"></div>
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Header with title and action buttons */}
                <div className="flex items-start justify-between min-h-[40px]">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                      {competition.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(competition)}
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {role === "superadmin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(competition)}
                        className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details with consistent spacing */}
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">
                      {startDateTime.date === endDateTime.date
                        ? startDateTime.date
                        : `${startDateTime.date} - ${endDateTime.date}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {startDateTime.time} → {endDateTime.time}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium capitalize">{competition.mode}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="font-medium">PKR {competition.prizeMoney}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => onManage(competition.id)}
                className="w-full mt-4 bg-gray-900 hover:from-gray-900 hover:to-gray-600 text-white border-0 transition-all duration-300"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Competition
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
