"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Trophy, CheckCircle2, UserPlus, Eye, Star, Zap } from "lucide-react"
import { useCountdownTimer } from "@/hooks/useCountdownTimer"

interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  isActive?: boolean
  isLocked?: boolean
  isFeatured?: boolean
  mode?: string
  prizeMoney?: string
  level?: string
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
    (status.status === "ACTIVE" || status.status === "UPCOMING" || (status.status === "ENDED" && isRegistered)) &&
    !(competition.level === "Level 2" && !isRegistered);

  const isFeatured = competition.isFeatured || false;
  const targetDate = new Date(competition.startDeadline?.seconds * 1000 || competition.startDeadline);
  const countdown = useCountdownTimer(targetDate);

  const getButtonText = () => {
    if (status.status === "ENDED") return "View Results";
    if (isRegistered) return isCompleted ? "View Results" : "Continue";
    return isFeatured ? "Register Now" : "Register";
  };

  const getButtonIcon = () => {
    if (status.status === "ENDED" || isRegistered) return <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />;
    return isFeatured ? <Zap className="h-4 w-4 sm:h-5 sm:w-5" /> : <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />;
  };

  return (
    <Card
      className={`bg-white shadow-lg rounded-xl h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group relative isolate ${
        isFeatured 
          ? 'border-2 border-blue-500'
          : 'border-0'
      }`}
    >
      {/* Featured Badge - Top Corner */}
      {isFeatured && (
        <div className="absolute top-3 right-3 z-20">
          <Badge className="bg-blue-600 text-white border-0 px-3 py-1 flex items-center gap-1.5 shadow-md">
            <Star className="w-3 h-3 fill-white" />
            <span className="font-semibold text-xs">FEATURED</span>
          </Badge>
        </div>
      )}

      <div className="relative h-full">
        {/* Subtle gradient background */}
        <div className={`absolute inset-0 ${
          isFeatured 
            ? 'bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30' 
            : 'bg-gradient-to-br from-slate-900/5 to-slate-600/5'
        }`} />

        <CardContent className="p-4 sm:p-6 md:p-8 relative flex flex-col h-full">
          {/* Prize Money Banner - Only for Featured */}
          {isFeatured && competition.prizeMoney && (
            <div className="mb-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-bold text-sm sm:text-base">PKR {competition.prizeMoney} Prize</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="space-y-2 sm:space-y-4 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {competition.level && (
                  <Badge className="bg-purple-600 text-white border-0 font-medium text-[10px] sm:text-[12px] px-1 sm:px-1.5 py-0.5 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {competition.level}
                  </Badge>
                )}
                <Badge className={`${status.color} border font-medium text-[10px] sm:text-[12px] px-1 sm:px-1.5 py-0.5 hover:bg-transparent`}>
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${status.dotColor} rounded-full mr-1 sm:mr-1.5`}></div>
                  {status.label}
                </Badge>
                {isRegistered && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium text-[10px] sm:text-[12px] px-1 sm:px-1.5 py-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    Registered
                  </Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 border font-medium text-[10px] sm:text-[12px] px-1 sm:px-1.5 py-0.5">
                    <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[3.5rem]">
                {competition.title}
              </h3>
            </div>
            <div className="ml-2 sm:ml-4">
              <button
                type="button"
                className="focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick(competition);
                }}
                aria-label="View competition details"
              >
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-blue-600 transition-colors duration-200" />
              </button>
            </div>
          </div>

          {/* Countdown Timer for Featured Upcoming Competitions */}
          {isFeatured && status.status === "UPCOMING" && !countdown.isExpired && (
            <div className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg shadow-sm">
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-90">Starts In</div>
                <div className="flex gap-3 items-center justify-center">
                  {countdown.days > 0 && (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold">{countdown.days}</div>
                        <div className="text-[10px] uppercase opacity-75">Days</div>
                      </div>
                      <div className="text-xl font-bold opacity-50">:</div>
                    </>
                  )}
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold">{String(countdown.hours).padStart(2, '0')}</div>
                    <div className="text-[10px] uppercase opacity-75">Hrs</div>
                  </div>
                  <div className="text-xl font-bold opacity-50">:</div>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold">{String(countdown.minutes).padStart(2, '0')}</div>
                    <div className="text-[10px] uppercase opacity-75">Mins</div>
                  </div>
                  <div className="text-xl font-bold opacity-50">:</div>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold">{String(countdown.seconds).padStart(2, '0')}</div>
                    <div className="text-[10px] uppercase opacity-75">Secs</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6 flex-1">
            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Start Time</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words leading-tight">
                  {startDateTime.date} {startDateTime.time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">End Time</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words leading-tight">
                  {endDateTime.date} {endDateTime.time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Mode</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words leading-tight">{competition.mode || "Online"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Prize</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words leading-tight">PKR {competition.prizeMoney || "TBD"}</p>
              </div>
            </div>
          </div>

          {showButton && (
            <div className="pt-3 sm:pt-4 border-t border-slate-100">
              <Button
                className={`w-full gap-1.5 sm:gap-2 px-4 sm:px-8 py-3 sm:py-4 h-11 sm:h-14 text-sm sm:text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 justify-center font-semibold ${
                  isFeatured && !isRegistered
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                    : ''
                }`}
                disabled={isButtonLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onButtonClick(competition);
                }}
              >
                {isButtonLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
