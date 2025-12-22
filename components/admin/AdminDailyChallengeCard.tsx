"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Flame, Zap, Eye, FileText, Target, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import Image from "next/image"

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

interface AdminDailyChallengeCardProps {
  challenge: DailyChallenge
}

export const AdminDailyChallengeCard = ({ challenge }: AdminDailyChallengeCardProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("Calculating...")

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
  const startDateTime = formatDateTime(challenge.startTime)
  const isActive = timeLeft !== "Ended"

  // Calculate status based on start and end times
  const getStatus = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (challenge.startTime?._seconds) {
      startDate = new Date(challenge.startTime._seconds * 1000)
    } else if (challenge.startTime?.seconds) {
      startDate = new Date(challenge.startTime.seconds * 1000)
    } else {
      startDate = new Date(challenge.startTime)
    }

    if (challenge.endTime?._seconds) {
      endDate = new Date(challenge.endTime._seconds * 1000)
    } else if (challenge.endTime?.seconds) {
      endDate = new Date(challenge.endTime.seconds * 1000)
    } else {
      endDate = new Date(challenge.endTime)
    }

    if (now < startDate) {
      return {
        label: "Upcoming",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        dotColor: "bg-blue-500"
      }
    } else if (now >= startDate && now <= endDate) {
      return {
        label: "Active",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotColor: "bg-emerald-500"
      }
    } else {
      return {
        label: "Ended",
        color: "bg-gray-50 text-gray-600 border-gray-200",
        dotColor: "bg-gray-400"
      }
    }
  }

  const status = getStatus()

  // Featured layout - full width horizontal card (Prominent Display)
  return (
    <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl sm:rounded-2xl overflow-hidden">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="grid lg:grid-cols-[1fr,auto] gap-4 sm:gap-6 md:gap-8 items-start">
          {/* Left Column: Challenge Details */}
          <div className="space-y-4 sm:space-y-6">
            {/* Header with Badges */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-[#0f172a] hover:bg-[#0d1220] text-white border-0 font-medium text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                  Daily Challenge
                </Badge>
                <Badge className={`${status.color} border font-medium text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md`}>
                  <span className={`w-1.5 h-1.5 ${status.dotColor} rounded-full mr-1 sm:mr-1.5 ${status.label === 'Active' ? 'animate-pulse' : ''}`} />
                  {status.label}
                </Badge>
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                {challenge.title}
              </h2>

              {/* Problem Statement */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed line-clamp-3">
                {challenge.problemStatement}
              </p>
            </div>

            {/* Stats Section with View Details on the same line */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm sm:text-base text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium">Total Submissions: {challenge.totalSubmissions || 0}</p>
                  {/* <p className="text-xl font-bold text-slate-900">{challenge.totalSubmissions || 0}</p> */}
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto text-sm text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      View Full Details
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="bg-white border-slate-200 max-w-3xl w-[95vw] max-h-[85vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0 pb-3 sm:pb-4 border-b border-slate-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 bg-indigo-100 rounded-lg sm:rounded-xl flex-shrink-0">
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Challenge Details</DialogTitle>
                          <DialogDescription className="text-slate-600 text-xs sm:text-sm mt-1">
                            Complete information about this challenge
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-4 sm:space-y-5 pt-3 sm:pt-4">
                        {/* Challenge Title */}
                        {challenge.title && (
                          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-slate-200">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                              {challenge.title}
                            </h3>
                          </div>
                        )}

                        {/* Problem Statement */}
                        {(challenge.problemStatement || (challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0)) && (
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                              <h4 className="text-sm sm:text-base font-semibold text-slate-900">Problem Statement</h4>
                            </div>
                            {challenge.problemStatement && (
                              <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {challenge.problemStatement}
                                </p>
                              </div>
                            )}
                            {challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0 && (
                              <div className="space-y-2">
                                {challenge.problemAudioUrls.map((url: string, index: number) => (
                                  <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <p className="text-xs font-medium text-slate-600 mb-2">Audio {index + 1}</p>
                                    <audio controls src={url} className="w-full" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Guidelines */}
                        {(challenge.guidelines || (challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0)) && (
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                              <h4 className="text-sm sm:text-base font-semibold text-slate-900">Guidelines</h4>
                            </div>
                            {challenge.guidelines && (
                              <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {challenge.guidelines}
                                </p>
                              </div>
                            )}
                            {challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0 && (
                              <div className="space-y-2">
                                {challenge.guidelinesAudioUrls.map((url: string, index: number) => (
                                  <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <p className="text-xs font-medium text-slate-600 mb-2">Audio {index + 1}</p>
                                    <audio controls src={url} className="w-full" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Visual Clues */}
                        {challenge.visualClueUrls && challenge.visualClueUrls.length > 0 && (
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                              <h4 className="text-sm sm:text-base font-semibold text-slate-900">
                                Visual Clues ({challenge.visualClueUrls.length})
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {challenge.visualClueUrls.map((url: string, index: number) => (
                                <div key={index} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                  <img
                                    src={url}
                                    alt={`Visual clue ${index + 1}`}
                                    className="w-full h-auto rounded-lg"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Right Column: Status Display */}
          <div className="lg:min-w-[320px] space-y-3 sm:space-y-4">
            <div className="w-full p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center">
                    <Zap className="h-4 w-4 text-slate-700" />
                  </div>
                  <p className="text-xs text-slate-700 font-semibold uppercase">Current Status</p>
                </div>
                <Badge className={`${status.color} border font-semibold text-base px-4 py-2`}>
                  <span className={`w-2 h-2 ${status.dotColor} rounded-full mr-2 ${status.label === 'Active' ? 'animate-pulse' : ''}`} />
                  {status.label}
                </Badge>
              </div>
            </div>

            {/* Time Info Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* Time Left */}
              <div className="p-3 sm:p-4 bg-gradient-to-br from-[#e0edfe]/80 to-[#e0edfe]/60 rounded-lg sm:rounded-xl border" style={{ borderColor: 'rgba(224,237,254,0.6)' }}>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#123b8f] rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium text-[#123b8f] uppercase tracking-wide mb-0.5 sm:mb-1">Time Left</p>
                  <p className="text-base sm:text-xl font-bold text-[#123b8f]">{isActive ? timeLeft : "Ended"}</p>
                </div>

              {/* Deadline */}
              <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg sm:rounded-xl border border-amber-200">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-600 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs font-medium text-amber-700 uppercase tracking-wide mb-0.5 sm:mb-1">Deadline</p>
                <p className="text-sm sm:text-base font-bold text-amber-900">{endDateTime.date}</p>
                <p className="text-[10px] sm:text-xs font-medium text-amber-700 mt-0.5">{endDateTime.time}</p>
              </div>
            </div>

            {/* Status Display */}
            
            <p className="text-sm text-center md:text-right text-gray-600">
              Monitor participant submissions and performance
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
