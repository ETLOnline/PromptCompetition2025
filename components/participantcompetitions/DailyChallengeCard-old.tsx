"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Zap, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"

interface DailyChallenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  startTime: any
  endTime: any
  status: string
  type: string
  totalSubmissions: number
  createdAt?: any
  createdBy?: string
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls?: string[]
}

interface DailyChallengeCardProps {
  challenge: DailyChallenge
  onViewDetails?: (challenge: DailyChallenge) => void
  isSingle?: boolean
}

export const DailyChallengeCard = ({ challenge, onViewDetails, isSingle = false }: DailyChallengeCardProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("Calculating...")

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      
      // Handle Firestore Timestamp: try _seconds first, then seconds, then fallback to direct conversion
      let endDate: Date
      if (challenge.endTime?._seconds) {
        endDate = new Date(challenge.endTime._seconds * 1000)
      } else if (challenge.endTime?.seconds) {
        endDate = new Date(challenge.endTime.seconds * 1000)
      } else {
        endDate = new Date(challenge.endTime)
      }
      
      // Validate the date
      if (isNaN(endDate.getTime())) {
        setTimeLeft("Invalid Date")
        return
      }
      
      const diff = endDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("Ended")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 24) {
        const days = Math.floor(hours / 24)
        setTimeLeft(`${days}d ${hours % 24}h`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 60000)

    return () => clearInterval(interval)
  }, [challenge.endTime])

  const formatDateTime = (timestamp: any) => {
    // Handle Firestore Timestamp: try _seconds first, then seconds, then fallback to direct conversion
    let date: Date
    if (timestamp?._seconds) {
      date = new Date(timestamp._seconds * 1000)
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000)
    } else {
      date = new Date(timestamp)
    }
    
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    }
  }
  
  const endDateTime = formatDateTime(challenge.endTime)
  const isActive = timeLeft !== "Ended"

  // Featured/Single layout - full width with enhanced design
  if (isSingle) {
    return (
      <Card className="bg-white shadow-xl rounded-xl overflow-hidden border-0">
        <div className="relative">
          {/* Decorative background patterns */}
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-50 to-transparent rounded-full -translate-y-24 sm:-translate-y-48 translate-x-24 sm:translate-x-48 opacity-40" />
          <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-tr from-slate-50 to-transparent rounded-full translate-y-20 sm:translate-y-40 -translate-x-20 sm:-translate-x-40 opacity-40" />

          <CardContent className="relative p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Title and Status */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <Badge className="bg-[#0f172a] text-white border-0 px-3 sm:px-4 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="font-bold text-xs sm:text-sm">DAILY CHALLENGE</span>
                    </Badge>
                    {isActive && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                        Active Now
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0f172a] leading-tight">
                    {challenge.title}
                  </h2>

                  <div className="text-gray-600 text-base sm:text-lg md:text-xl leading-relaxed">
                    <p className="whitespace-pre-line">{challenge.problemStatement}</p>
                  </div>
                </div>

                {/* Challenge Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Time Remaining</p>
                      <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                        {isActive ? timeLeft : "Challenge Ended"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Deadline</p>
                      <p className="text-base sm:text-lg font-semibold text-slate-900 mt-1">
                        {endDateTime.date}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600">{endDateTime.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Submissions</p>
                      <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                        {challenge.totalSubmissions || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">Challenge Type</p>
                      <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1 capitalize">
                        {challenge.type}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Action Panel */}
              <div className="lg:col-span-1 flex flex-col">
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 sm:p-8 border-2 border-slate-100 h-full flex flex-col justify-center">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#0f172a] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    
                    <div>
                      <p className="text-sm sm:text-base text-muted-foreground uppercase tracking-wide mb-2">Ready to Participate?</p>
                      <p className="text-2xl sm:text-3xl font-bold text-[#0f172a]">Start Now</p>
                    </div>
                    
                    <Button
                      onClick={() => onViewDetails?.(challenge)}
                      disabled={!isActive}
                      size="lg"
                      className={`w-full text-base sm:text-lg py-6 sm:py-7 ${
                        isActive
                          ? "bg-[#0f172a] hover:bg-slate-800 text-white shadow-lg hover:shadow-xl"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
                          Begin Challenge
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Challenge Ended
                        </>
                      )}
                    </Button>

                    {isActive && (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Test your prompt engineering skills and prepare for Prompt Idol Pakistan 2026
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  // Regular grid layout for multiple challenges
  return (
    <Card className="bg-white shadow-lg rounded-xl h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden border-0 group">
      <div className="relative h-full">
        {/* Subtle gradient background matching your design */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5" />
        
        <CardContent className="p-4 sm:p-6 relative flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className="bg-[#0f172a] text-white border-0 font-medium text-[10px] sm:text-[12px] px-2 py-0.5">
                  <Zap className="w-2.5 h-2.5 mr-1" />
                  DAILY
                </Badge>
                {isActive && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium text-[10px] sm:text-[12px] px-1.5 py-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                    Active
                  </Badge>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight line-clamp-2 min-h-[2.5rem]">
                {challenge.title}
              </h3>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {challenge.problemStatement}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 flex-1">
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Time Left</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {isActive ? timeLeft : "Ended"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Deadline</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 break-words leading-tight">
                  {endDateTime.date} {endDateTime.time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Submissions</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {challenge.totalSubmissions || 0}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Type</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 capitalize">
                  {challenge.type}
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => onViewDetails?.(challenge)}
            disabled={!isActive}
            className={`w-full mt-auto ${
              isActive
                ? "bg-[#0f172a] hover:bg-slate-800 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200"
            }`}
          >
            {isActive ? (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Start Challenge
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Challenge Ended
              </>
            )}
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}

export const DailyChallengeSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-200" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded" />
                <div className="w-48 h-6 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="w-full h-10 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="h-16 bg-gray-200 rounded-lg" />
            <div className="h-16 bg-gray-200 rounded-lg" />
            <div className="h-16 bg-gray-200 rounded-lg" />
          </div>
          <div className="w-full h-12 bg-gray-200 rounded-lg mb-4" />
          <div className="w-full h-10 bg-gray-200 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}
