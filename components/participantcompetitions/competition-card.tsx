"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Trophy, CheckCircle2, UserPlus, Eye } from "lucide-react"

interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  isActive?: boolean
  isLocked?: boolean
  mode?: string
  prizeMoney?: string
}

interface CompetitionCardProps {
  competition: Competition
  status: {
    status: string
    label: string
    color: string
    dotColor: string
  }
  startDateTime: { date: string; time: string }
  endDateTime: { date: string; time: string }
  isRegistered: boolean
  isCompleted: boolean
  isButtonLoading: boolean
  onCardClick: (competition: Competition) => void
  onButtonClick: (competition: Competition) => void
}

export const CompetitionCard = ({
  competition,
  status,
  startDateTime,
  endDateTime,
  isRegistered,
  isCompleted,
  isButtonLoading,
  onCardClick,
  onButtonClick,
}: CompetitionCardProps) => {
  const showButton =
    status.status === "ACTIVE" || status.status === "UPCOMING" || (status.status === "ENDED" && isRegistered);

  const getButtonText = () => {
    if (status.status === "ENDED") return "View Results";
    if (isRegistered) return isCompleted ? "View Results" : "Continue";
    return "Register";
  };

  const getButtonIcon = () => {
    if (status.status === "ENDED" || isRegistered) return <Trophy className="h-5 w-5" />;
    return <UserPlus className="h-5 w-5" />;
  };

  return (
    <Card
      className="bg-white shadow-lg rounded-xl h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden group relative isolate"
    >
      <div className="relative h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5" />
        <CardContent className="p-8 relative flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <Badge className={`${status.color} border font-medium px-3 py-1 hover:bg-transparent`}>
                  <div className={`w-2 h-2 ${status.dotColor} rounded-full mr-1.5`}></div>
                  {status.label}
                </Badge>
                {isRegistered && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Registered
                  </Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 border font-medium">
                    <Trophy className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight line-clamp-2 min-h-[3.5rem]">
                {competition.title}
              </h3>
            </div>
            <div className="ml-4">
              <button
                type="button"
                className="focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick(competition);
                }}
                aria-label="View competition details"
              >
                <Eye className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors duration-200" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Date</p>
                <p className="text-sm font-semibold text-slate-900">
                  {startDateTime.date === endDateTime.date
                    ? startDateTime.date
                    : `${startDateTime.date} - ${endDateTime.date}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Time</p>
                <p className="text-sm font-semibold text-slate-900">
                  {startDateTime.time} → {endDateTime.time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Mode</p>
                <p className="text-sm font-semibold text-slate-900">{competition.mode || "Online"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Trophy className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Prize</p>
                <p className="text-sm font-semibold text-slate-900">PKR {competition.prizeMoney || "TBD"}</p>
              </div>
            </div>
          </div>

          {showButton && (
            <div className="pt-4 border-t border-slate-100">
              <Button
                className="w-full gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 justify-center"
                disabled={isButtonLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onButtonClick(competition);
                }}
              >
                {isButtonLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-semibold">Loading...</span>
                  </>
                ) : (
                  <>
                    {getButtonIcon()}
                    <span className="font-semibold">{getButtonText()}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
