"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Zap, CheckCircle2, Flame } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

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
  const router = useRouter()
  const { user } = useAuth()
  const [timeLeft, setTimeLeft] = useState<string>("Calculating...")
  const [hasSubmission, setHasSubmission] = useState<boolean>(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()

      let endDate: Date
      if (challenge.endTime?._seconds) {
        endDate = new Date(challenge.endTime._seconds * 1000)
      } else if (challenge.endTime?.seconds) {
        endDate = new Date(challenge.endTime.seconds * 1000)
      } else {
        endDate = new Date(challenge.endTime)
      }

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
  const buttonLabel = isActive
    ? hasSubmission
      ? "Edit Submission"
      : "Start Challenge"
    : "Challenge Ended"
  const buttonClass = isActive
    ? hasSubmission
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : "bg-[#0f172a] hover:bg-slate-800 text-white"
    : "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200"

  useEffect(() => {
    let isMounted = true

    const checkSubmission = async () => {
      if (!user?.id) return

      try {
        const submissionRef = doc(db, "dailychallenge", challenge.id, "submissions", user.id)
        const submissionSnap = await getDoc(submissionRef)
        if (isMounted) {
          setHasSubmission(submissionSnap.exists())
        }
      } catch (error) {
        console.error("Error checking submission status:", error)
      }
    }

    checkSubmission()

    return () => {
      isMounted = false
    }
  }, [challenge.id, user?.id])

  // Featured layout - full width horizontal card
  if (isSingle) {
    return (
      <div className="mb-6">
        <Card className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-slate-900 to-slate-600" />
          <CardContent className="p-5 pl-5">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
              {/* Title & Description */}
              <div className="flex-1 min-w-[200px]">
                <h3 className="text-base sm:text-lg font-bold text-[#0f172a] leading-tight mb-1">{challenge.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-1">{challenge.problemStatement}</p>
              </div>

              {/* Deadline */}
              <div className="flex flex-col items-center text-center min-w-[100px]">
                <div className="w-7 h-7 bg-gradient-to-br from-slate-200 to-slate-100 rounded-md flex items-center justify-center mb-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-700" />
                </div>
                <p className="text-[10px] text-slate-600 font-medium">Deadline</p>
                <p className="text-xs font-semibold text-slate-900">{endDateTime.date}</p>
                <p className="text-[10px] text-slate-500">{endDateTime.time}</p>
              </div>

              {/* Submissions */}
              <div className="flex flex-col items-center text-center min-w-[90px]">
                <div className="w-7 h-7 bg-gradient-to-br from-slate-200 to-slate-100 rounded-md flex items-center justify-center mb-1">
                  <Users className="h-3.5 w-3.5 text-slate-700" />
                </div>
                <p className="text-[10px] text-slate-600 font-medium">Submissions</p>
                <p className="text-xs font-semibold text-slate-900">{challenge.totalSubmissions || 0}</p>
              </div>

              {/* Type */}
              <div className="flex flex-col items-center text-center min-w-[80px]">
                <div className="w-7 h-7 bg-gradient-to-br from-slate-200 to-slate-100 rounded-md flex items-center justify-center mb-1">
                  <Zap className="h-3.5 w-3.5 text-slate-700" />
                </div>
                <p className="text-[10px] text-slate-600 font-medium">Type</p>
                <p className="text-xs font-semibold text-slate-900 capitalize">{challenge.type}</p>
              </div>

              {/* CTA Button */}
              <div className="flex-shrink-0 w-full sm:w-auto">
                <Button
                  onClick={() => router.push(`/participant/daily-challenge/${challenge.id}`)}
                  disabled={!isActive}
                  size="sm"
                  className={`w-full sm:w-auto ${buttonClass}`}
                >
                  {isActive ? (
                    <>
                      <Zap className="mr-2 h-3.5 w-3.5" />
                      {buttonLabel}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                      Challenge Ended
                    </>
                  )}
                </Button>
              </div>

              {/* Active Badge for mobile */}
              {isActive && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium px-2 py-0.5 text-xs sm:hidden">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Regular grid layout
  return (
    <Card className="bg-white shadow-lg rounded-lg h-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-slate-200 group">
      <div className="h-1 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-600" />

      <CardContent className="p-4 sm:p-5 relative flex flex-col h-full">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className="bg-[#0f172a] text-white border-0 font-medium text-[10px] sm:text-[11px] px-2.5 py-1 flex items-center gap-1.5">
                <Flame className="w-2.5 h-2.5" />
                DAILY
              </Badge>
              {isActive && (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[10px] sm:text-[11px] px-2 py-0.5 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Active
                </Badge>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
              {challenge.title}
            </h3>
          </div>
        </div>

        {/* Problem Statement */}
        <p className="text-xs sm:text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed font-medium">
          {challenge.problemStatement}
        </p>

        {/* Info Grid - Compact and Clean */}
        <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
          {/* Time Left */}
          <div className="flex items-start gap-2 p-2.5 bg-gradient-to-br from-slate-50 to-slate-50 rounded-lg border border-slate-100">
            <div className="w-5 h-5 bg-gradient-to-br from-slate-900 to-slate-700 rounded-md flex items-center justify-center shrink-0 flex-none">
              <Clock className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] text-slate-600 font-semibold uppercase tracking-tight">Time</p>
              <p className="text-xs sm:text-sm font-bold text-slate-900">{isActive ? timeLeft : "Ended"}</p>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-start gap-2 p-2.5 bg-gradient-to-br from-slate-50 to-slate-50 rounded-lg border border-slate-100">
            <div className="w-5 h-5 bg-gradient-to-br from-slate-900 to-slate-700 rounded-md flex items-center justify-center shrink-0 flex-none">
              <Calendar className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] text-slate-600 font-semibold uppercase tracking-tight">Ends</p>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">{endDateTime.date}</p>
            </div>
          </div>

          {/* Submissions */}
          <div className="flex items-start gap-2 p-2.5 bg-gradient-to-br from-slate-50 to-slate-50 rounded-lg border border-slate-100">
            <div className="w-5 h-5 bg-gradient-to-br from-slate-900 to-slate-700 rounded-md flex items-center justify-center shrink-0 flex-none">
              <Users className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] text-slate-600 font-semibold uppercase tracking-tight">Joined</p>
              <p className="text-xs sm:text-sm font-bold text-slate-900">{challenge.totalSubmissions || 0}</p>
            </div>
          </div>

          {/* Type */}
          <div className="flex items-start gap-2 p-2.5 bg-gradient-to-br from-slate-50 to-slate-50 rounded-lg border border-slate-100">
            <div className="w-5 h-5 bg-gradient-to-br from-slate-900 to-slate-700 rounded-md flex items-center justify-center shrink-0 flex-none">
              <Zap className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] text-slate-600 font-semibold uppercase tracking-tight">Mode</p>
              <p className="text-xs sm:text-sm font-bold text-slate-900 capitalize">{challenge.type}</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => router.push(`/participant/daily-challenge/${challenge.id}`)}
          disabled={!isActive}
          className={`w-full mt-auto font-semibold transition-all ${buttonClass}`}
        >
          {isActive ? (
            <>
              <Zap className="mr-2 h-4 w-4" />
              {buttonLabel}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Challenge Ended
            </>
          )}
        </Button>
      </CardContent>
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
