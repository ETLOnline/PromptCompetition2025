"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Trophy,
  Clock,
  Calendar,
  RefreshCw,
  Target,
  Play,
  MapPin,
  DollarSign,
  LogOut,
  Users,
  Award,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  isActive?: boolean
  isLocked?: boolean
  location?: string
  prizeMoney?: string
}

export default function CompetitionsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [hasCompetitions, setHasCompetitions] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    fetchCompetitions()
  }, [user, router])

  const fetchCompetitions = async () => {
    try {
      setLoading(true)
      const competitionsQuery = query(collection(db, "competitions"), orderBy("startDeadline", "desc"))
      const competitionsSnapshot = await getDocs(competitionsQuery)

      if (competitionsSnapshot.empty) {
        setHasCompetitions(false)
        return []
      } else {
        setHasCompetitions(true)
        const competitions = competitionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Competition[]
        setCompetitions(competitions)
      }
    } catch (error) {
      console.error("Error fetching competitions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCompetitionStatus = (competition: Competition) => {
    if (competition.isActive == true) {
      const start = competition.startDeadline?.toDate?.() ?? new Date(competition.startDeadline)
      const end = competition.endDeadline?.toDate?.() ?? new Date(competition.endDeadline)
      const now = new Date()
      const extendedEnd = new Date(end.getTime() + 2 * 60 * 1000)

      if (now < start) {
        return {
          status: "UPCOMING",
          message: "Starts Soon",
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
          icon: Clock,
          pulse: false,
        }
      } else if (now >= start && now <= extendedEnd) {
        return {
          status: "ACTIVE",
          message: "Live Now",
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-700",
          borderColor: "border-emerald-200",
          icon: Play,
          pulse: true,
        }
      } else {
        return {
          status: "ENDED",
          message: "Completed",
          bgColor: "bg-slate-50",
          textColor: "text-slate-600",
          borderColor: "border-slate-200",
          icon: Award,
          pulse: false,
        }
      }
    }
  }

  const formatDate = (date: any) => {
    const dateObj = date?.toDate?.() ?? new Date(date)
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleCompetitionClick = (competitionId: string) => {
    router.push(`/participants/competitions/${competitionId}`)
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="container mx-auto p-6">
          <Card className="bg-white shadow-lg rounded-xl border-0 max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900">Loading Competitions</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Fetching the latest competitions from our database...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const activeCompetitions = competitions.filter((c) => getCompetitionStatus(c)?.status === "ACTIVE").length
  const upcomingCompetitions = competitions.filter((c) => getCompetitionStatus(c)?.status === "UPCOMING").length
  const totalCompetitions = competitions.filter((c) => getCompetitionStatus(c)?.status !== "ENDED").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                  Competitions Hub
                </h1>
                <p className="text-slate-600 mt-1 font-medium">Discover and join prompt engineering challenges</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              {/* Enhanced Stats */}
              <div className="hidden lg:flex items-center gap-8">
                <div className="text-center group">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-2xl font-bold text-emerald-600">{activeCompetitions}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-600">Active Now</div>
                </div>
                <div className="w-px h-12 bg-slate-200"></div>
                <div className="text-center group">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span className="text-2xl font-bold text-blue-600">{upcomingCompetitions}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-600">Upcoming</div>
                </div>
                <div className="w-px h-12 bg-slate-200"></div>
                <div className="text-center group">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3 h-3 text-purple-500" />
                    <span className="text-2xl font-bold text-purple-600">{totalCompetitions}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-600">Total</div>
                </div>
              </div>

              {/* Enhanced Logout Button */}
              <Button
                onClick={logout}
                className="bg-[#10142c] hover:bg-[#10142c]/90 text-white gap-2 px-6 py-3 h-12 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-semibold"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6 space-y-8">
        {!hasCompetitions ? (
          <Card className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0">
            <CardContent className="text-center py-20">
              <div className="space-y-6">
                <div className="relative mx-auto w-24 h-24">
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                    <Trophy className="h-12 w-12 text-slate-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    No Active Competitions
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    There are currently no competitions available. New challenges are added regularly, so check back
                    soon!
                  </p>
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="gap-2 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Quick Stats for Mobile */}
            <div className="lg:hidden grid grid-cols-3 gap-4">
              <Card className="bg-white shadow-lg rounded-xl border-0">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xl font-bold text-emerald-600">{activeCompetitions}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-600">Active</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg rounded-xl border-0">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-2 h-2 text-blue-500" />
                    <span className="text-xl font-bold text-blue-600">{upcomingCompetitions}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-600">Upcoming</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg rounded-xl border-0">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-2 h-2 text-purple-500" />
                    <span className="text-xl font-bold text-purple-600">{totalCompetitions}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-600">Total</div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Competition Cards */}
            <div className="space-y-6">
              {competitions.map((competition) => {
                const status = getCompetitionStatus(competition)
                if (status?.status !== "ENDED") {
                  const StatusIcon = status?.icon || Trophy

                  return (
                    <Card
                      key={competition.id}
                      className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group rounded-xl border-0 overflow-hidden"
                      onClick={() => handleCompetitionClick(competition.id)}
                    >
                      <CardContent className="p-0">
                        {/* Status Bar */}
                        <div
                          className={`h-1 ${status?.status === "ACTIVE" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-blue-400 to-blue-500"}`}
                        ></div>

                        <div className="p-8">
                          <div className="flex items-start justify-between gap-6">
                            {/* Left Section - Competition Info */}
                            <div className="flex items-start gap-6 flex-1 min-w-0">
                              {/* Enhanced Icon */}
                              <div className="relative flex-shrink-0">
                                <div className="p-4 bg-[#10142c] rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                                  <Trophy className="h-8 w-8 text-white" />
                                </div>
                                {status?.pulse && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
                                )}
                              </div>

                              {/* Competition Details */}
                              <div className="flex-1 min-w-0">
                                {/* Title and Status */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                                      {competition.title}
                                    </h3>
                                    <Badge
                                      className={`${status?.bgColor} ${status?.textColor} border ${status?.borderColor} font-semibold text-sm px-3 py-1.5 rounded-lg`}
                                    >
                                      <StatusIcon className="h-3 w-3 mr-1.5" />
                                      {status?.message}
                                      {status?.pulse && (
                                        <div className="ml-2 w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                      )}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Description */}
                                <p className="text-slate-600 text-lg leading-relaxed mb-6 line-clamp-2">
                                  {competition.description}
                                </p>

                                {/* Enhanced Meta Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-xl">
                                      <Calendar className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                                        Start Time
                                      </div>
                                      <div className="font-bold text-slate-900">
                                        {formatDate(competition.startDeadline)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-50 rounded-xl">
                                      <Clock className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                                        End Time
                                      </div>
                                      <div className="font-bold text-slate-900">
                                        {formatDate(competition.endDeadline)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Additional Info */}
                                {(competition.location || competition.prizeMoney) && (
                                  <div className="flex items-center gap-6 text-sm">
                                    {competition.location && (
                                      <div className="flex items-center gap-2 text-slate-600">
                                        <div className="p-1.5 bg-blue-50 rounded-lg">
                                          <MapPin className="h-3 w-3 text-blue-600" />
                                        </div>
                                        <span className="font-medium">{competition.location}</span>
                                      </div>
                                    )}
                                    {competition.prizeMoney && (
                                      <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                                        <div className="p-1.5 bg-emerald-50 rounded-lg">
                                          <DollarSign className="h-3 w-3" />
                                        </div>
                                        <span>{competition.prizeMoney}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Section - Enhanced Action Button */}
                            <div className="flex-shrink-0">
                              {status?.status === "ACTIVE" && (
                                <Button
                                  className="bg-[#10142c] hover:bg-[#10142c]/90 text-white font-semibold gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#10142c] focus:ring-offset-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCompetitionClick(competition.id)
                                  }}
                                >
                                  <Target className="h-5 w-5" />
                                  Join Now
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              )}
                              {status?.status === "UPCOMING" && (
                                <Button
                                  variant="outline"
                                  className="gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCompetitionClick(competition.id)
                                  }}
                                >
                                  <Clock className="h-5 w-5" />
                                  View Details
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
