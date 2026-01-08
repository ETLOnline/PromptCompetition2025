"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Calendar, Clock, UserCheck, AlertCircle, TrendingUp, Award, CheckCircle2 } from "lucide-react"
import { fetchLevel2LiveData } from "@/lib/api"

interface Participant {
  userid: string
  fullName: string
  rank?: number
  assignedBatchId: string
  assignedJudgeIds: string[]
}

interface Batch {
  id: string
  batchName: string
  startTime: string
  endTime: string
  participantIds: string[]
  challengeIds: string[]
}

interface Judge {
  id: string
  fullName: string
}

interface Level2LiveDashboardProps {
  competitionId: string
  onClose?: () => void
}

export const Level2LiveDashboard = ({ competitionId, onClose }: Level2LiveDashboardProps) => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [judges, setJudges] = useState<{ [key: string]: Judge }>({})
  const [loading, setLoading] = useState(true)
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchLevel2LiveData(competitionId)
        
        if (response.success) {
          setParticipants(response.data.participants)
          setBatches(response.data.batches)
          setJudges(response.data.judges)
          setCurrentBatchId(response.data.currentBatchId)
        } else {
          setError(response.message || "Failed to load data")
        }
      } catch (error) {
        console.error("Error fetching Level 2 data:", error)
        setError("Unable to load Level 2 competition data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [competitionId])

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const getBatchStatus = (batch: Batch) => {
    const now = new Date()
    const start = new Date(batch.startTime)
    const end = new Date(batch.endTime)
    
    if (now >= start && now <= end) return "active"
    if (now > end) return "completed"
    return "upcoming"
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium text-sm">Loading Level 2 Competition Data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-slate-900 font-semibold text-lg mb-2">Error Loading Data</p>
        <p className="text-slate-600 text-center max-w-md text-sm">{error}</p>
      </div>
    )
  }

  const currentBatch = batches.find((b) => b.id === currentBatchId)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
            <Award className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Level 2 Competition
            </h1>
            <p className="text-base text-slate-500 mt-1">Advanced Round - Live Status</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base mb-1">Qualification Required</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Level 2 is reserved for top performers from Level 1. Below is the current competition status showing qualified participants, their assigned judges, and the schedule. This information is provided for transparency.
            </p>
          </div>
        </div>
      </div>

      {/* Current Active Batch Banner */}
      {currentBatch && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-900">Currently Active</h3>
                  <Badge className="bg-emerald-600 text-white text-xs">Live Now</Badge>
                </div>
                <p className="text-xl font-semibold text-slate-900 mb-3">{currentBatch.batchName}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span><strong className="text-slate-700">Start:</strong> {formatDateTime(currentBatch.startTime).date} at {formatDateTime(currentBatch.startTime).time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span><strong className="text-slate-700">End:</strong> {formatDateTime(currentBatch.endTime).date} at {formatDateTime(currentBatch.endTime).time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span><strong className="text-slate-700">Competing:</strong> {currentBatch.participantIds.length} Participants</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Qualified</p>
                <p className="text-2xl font-bold text-slate-900">{participants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Judges</p>
                <p className="text-2xl font-bold text-slate-900">{Object.keys(judges).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Batches</p>
                <p className="text-2xl font-bold text-slate-900">{batches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Schedule and Participants */}
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11 bg-slate-100 border border-slate-200">
          <TabsTrigger value="schedule" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
            <Calendar className="w-4 h-4 mr-2" />
            Competition Schedule
          </TabsTrigger>
          <TabsTrigger value="participants" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900">
            <Users className="w-4 h-4 mr-2" />
            Qualified Participants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <div className="space-y-4">
            {batches.map((batch) => {
              const status = getBatchStatus(batch)
              const isActive = status === "active"
              const isPast = status === "completed"
              const isFuture = status === "upcoming"

              return (
                <Card
                  key={batch.id}
                  className={`border-2 transition-all ${
                    isActive
                      ? "border-emerald-300 bg-emerald-50/30"
                      : isPast
                      ? "border-slate-200 bg-slate-50/50"
                      : "border-blue-200 bg-blue-50/30"
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-900">{batch.batchName}</h3>
                          {isActive && (
                            <Badge className="bg-emerald-600 text-white text-xs">Active Now</Badge>
                          )}
                          {isFuture && (
                            <Badge className="bg-blue-600 text-white text-xs">Upcoming</Badge>
                          )}
                          {isPast && (
                            <Badge className="bg-slate-500 text-white text-xs">Completed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {formatDateTime(batch.startTime).date} • {formatDateTime(batch.startTime).time} - {formatDateTime(batch.endTime).time}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <Users className="w-4 h-4 text-slate-500" />
                          <p className="text-sm font-semibold text-slate-900">{batch.participantIds.length} Participants</p>
                        </div>
                        <p className="text-xs text-slate-500">{batch.challengeIds.length} Challenges</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-3">Participants in this batch:</p>
                      <div className="flex flex-wrap gap-2">
                        {batch.participantIds.map((participantId) => {
                          const participant = participants.find((p) => p.userid === participantId)
                          return (
                            <Badge 
                              key={participantId} 
                              variant="outline" 
                              className="bg-slate-50 text-slate-700 border-slate-300 font-medium px-3 py-1 text-xs"
                            >
                              {participant?.fullName || participantId}
                              {participant?.rank && <span className="ml-1.5 text-blue-600 font-semibold">#{participant.rank}</span>}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          <div className="grid grid-cols-1 gap-4">
            {participants.map((participant, index) => {
              const batch = batches.find((b) => b.id === participant.assignedBatchId)
              return (
                <Card key={participant.userid} className="border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{participant.fullName}</h4>
                          {participant.rank && (
                            <div className="flex items-center gap-2 mt-1">
                              <TrendingUp className="w-4 h-4 text-blue-600" />
                              <p className="text-sm text-slate-600">
                                Level 1 Rank: <span className="font-bold text-blue-600">#{participant.rank}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {batch && (
                        <Badge className="bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 text-xs font-semibold">
                          {batch.batchName}
                        </Badge>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="w-4 h-4 text-slate-500" />
                        <p className="text-sm font-medium text-slate-700">Assigned Judges:</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {participant.assignedJudgeIds?.map((judgeId) => {
                          const judge = judges[judgeId]
                          return (
                            <Badge 
                              key={judgeId} 
                              className="bg-white text-slate-700 border border-slate-300 font-medium px-3 py-1.5 text-xs"
                            >
                              <UserCheck className="h-3 w-3 mr-1.5 text-slate-500" />
                              {judge?.fullName || judgeId}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
