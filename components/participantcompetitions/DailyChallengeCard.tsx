
"use client"
import { FileText, Target, Image as ImageIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, Users, Zap, CheckCircle2, Flame, Eye } from "lucide-react"
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


  // Featured layout - full width horizontal card (Prominent Display)
  if (isSingle) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-gray-200 shadow-xl rounded-xl overflow-hidden mb-8">
        <CardContent className="p-6 sm:p-8">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Column: Challenge Details */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs px-3 py-1 flex items-center gap-1.5">
                    <Flame className="w-3 h-3" />
                    DAILY CHALLENGE
                  </Badge>
                  {isActive && (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-xs px-2.5 py-1 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Active
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-3 leading-tight">
                  {challenge.title}
                </h3>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed line-clamp-3">
                  {challenge.problemStatement}
                </p>
              </div>

              {/* <div className="flex items-center gap-4 sm:gap-6 text-sm text-gray-600 flex-wrap">
                {challenge.createdBy && (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-50 rounded-md flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">👤</span>
                    </div>
                    <span className="font-medium text-gray-900">Created by:</span> <span className="text-gray-700">{challenge.createdBy}</span>
                  </div>
                )}
                {challenge.createdAt && (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-orange-50 rounded-md flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-orange-600" />
                    </div>
                    <span className="font-medium text-gray-900">Date:</span>{" "}
                    <span className="text-gray-700">{formatDateTime(challenge.createdAt).date}</span>
                  </div>
                )}
              </div> */}

              <div className="flex items-center gap-3 text-base sm:text-lg font-semibold text-gray-900 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <span>
                  Total Submissions: <span className="text-emerald-600 font-bold">{challenge.totalSubmissions || 0}</span>
                </span>
              </div>

              {/* View Details Button (Modal Trigger) */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent hover:bg-gray-50">
                    <Eye className="w-5 h-5 mr-2" />
                    View Challenge Details
                  </Button>
                </DialogTrigger>
                  <DialogContent className="bg-white border-0 shadow-2xl max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <DialogTitle className="text-xl font-semibold text-gray-900">Challenge Details</DialogTitle>
                          <p className="text-gray-600 text-sm">Review the challenge requirements</p>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="space-y-6 mt-4">
                      {/* Challenge Title */}
                      {challenge.title && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words leading-tight">
                            {challenge.title}
                          </h3>
                        </div>
                      )}

                      {/* Problem Statement */}
                      {(challenge.problemStatement || (challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0)) && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <h4 className="text-base font-semibold text-blue-900">Problem Statement</h4>
                          </div>
                          {challenge.problemStatement && (
                            <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border mb-4">
                              <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                                {challenge.problemStatement}
                              </p>
                            </div>
                          )}
                          {challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0 && (
                            <div className="space-y-3">
                              {challenge.problemAudioUrls.map((url: string, index: number) => (
                                <div key={index} className="bg-white rounded-md p-3 border">
                                  <div className="text-sm text-gray-700 mb-2 font-medium">Audio {index + 1}</div>
                                  <audio controls src={url} className="w-full h-8" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Guidelines */}
                      {(challenge.guidelines || (challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0)) && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <h4 className="text-base font-semibold text-green-900">Guidelines</h4>
                          </div>
                          {challenge.guidelines && (
                            <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border mb-4">
                              <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                                {challenge.guidelines}
                              </p>
                            </div>
                          )}
                          {challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0 && (
                            <div className="space-y-3">
                              {challenge.guidelinesAudioUrls.map((url: string, index: number) => (
                                <div key={index} className="bg-white rounded-md p-3 border">
                                  <div className="text-sm text-gray-700 mb-2 font-medium">Audio {index + 1}</div>
                                  <audio controls src={url} className="w-full h-8" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Visual Clues */}
                      {challenge.visualClueUrls && challenge.visualClueUrls.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <h4 className="text-base font-semibold text-amber-900">Visual Clues ({challenge.visualClueUrls.length})</h4>
                          </div>
                          <div className="space-y-4">
                            {challenge.visualClueUrls.map((url: string, index: number) => (
                              <div key={index} className="w-full flex justify-center">
                                <img
                                  src={url}
                                  alt={`Visual clue ${index + 1}`}
                                  className="max-w-full h-auto rounded-md border border-amber-200 mx-auto"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
              </Dialog>
            </div>

            {/* Right Column: Call to Action */}
            <div className="flex flex-col justify-center items-start md:items-end space-y-4 sm:space-y-6">
              <div className="w-full md:w-auto space-y-4">
                {/* Time and Deadline Info Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-200 rounded-md flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-700" />
                      </div>
                      <p className="text-xs text-blue-700 font-semibold uppercase">Time Left</p>
                    </div>
                    <p className="text-lg font-bold text-blue-900">{isActive ? timeLeft : "Ended"}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-purple-200 rounded-md flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-purple-700" />
                      </div>
                      <p className="text-xs text-purple-700 font-semibold uppercase">Deadline</p>
                    </div>
                    <p className="text-sm font-bold text-purple-900">{endDateTime.date}</p>
                    <p className="text-xs text-purple-800">{endDateTime.time}</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={() => router.push(`/participant/daily-challenge/${challenge.id}`)}
                  disabled={!isActive}
                  className={`w-full md:min-w-[280px] h-14 sm:h-16 text-lg sm:text-xl font-bold shadow-lg transition-all ${
                    isActive
                      ? hasSubmission
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-[#0f172a] hover:bg-slate-800 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200"
                  }`}
                >
                  {isActive ? (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      {hasSubmission ? "Edit Submission" : "Enter Submission"}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Challenge Ended
                    </>
                  )}
                </Button>
                <p className="text-sm text-center md:text-right text-gray-600">
                  Submit your best prompt and compete for the top spot
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
