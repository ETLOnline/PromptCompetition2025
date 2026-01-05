"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader, FileText, Search, Filter, Calendar, Trophy, ChevronRight, AlertCircle, History } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useNotifications } from "@/hooks/useNotifications"
import { Notifications } from "@/components/Notifications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SubmissionHistory {
  submissionId: string
  competitionId: string
  competitionTitle: string
  challengeId: string
  challengeTitle: string
  promptText: string
  submittedAt: any
  hasScore: boolean
  judgeScores?: any
  llmScores?: any
}

// Helper function to format date from various formats
const formatDate = (dateValue: any): string => {
  if (!dateValue) return "N/A"
  
  try {
    // Handle ISO string format
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Handle Firestore Timestamp
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Handle timestamp with seconds
    if (dateValue._seconds || dateValue.seconds) {
      const timestamp = (dateValue._seconds || dateValue.seconds) * 1000
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return "N/A"
  } catch (error) {
    console.error('Error formatting date:', error)
    return "N/A"
  }
}

interface Stats {
  totalSubmissions: number
  uniqueCompetitions: number
  uniqueChallenges: number
}

export default function ParticipantSubmissionHistory() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const batchId = params?.batchId as string
  const participantId = params?.participantId as string

  const [userUID, setUserUID] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [participantName, setParticipantName] = useState<string>("")
  const [submissions, setSubmissions] = useState<SubmissionHistory[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionHistory[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSubmissions: 0,
    uniqueCompetitions: 0,
    uniqueChallenges: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCompetition, setFilterCompetition] = useState("all")
  const [competitions, setCompetitions] = useState<Array<{id: string, title: string}>>([])

  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_JUDGE_AUTH}`)
      setUserUID(profile.uid)
      setIsAuthenticated(true)
    } catch (error) {
      router.push("/")
    }
  }

  useEffect(() => {
    if (isAuthenticated && userUID) {
      loadSubmissionHistory()
    }
  }, [isAuthenticated, userUID, participantId])

  const loadSubmissionHistory = async () => {
    try {
      setIsLoading(true)

      // Fetch participant name
      const participantData = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/participants/${participantId}`
      )
      setParticipantName(participantData?.fullName || "Unknown Participant")

      // Fetch all previous submissions for this participant
      const data = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/judge/participant-submission-history/${participantId}`
      )

      setSubmissions(data.submissions || [])
      setFilteredSubmissions(data.submissions || [])

      // Calculate stats
      const uniqueComps = new Set(data.submissions.map((s: SubmissionHistory) => s.competitionId))
      const uniqueChallenges = new Set(data.submissions.map((s: SubmissionHistory) => `${s.competitionId}_${s.challengeId}`))
      
      setStats({
        totalSubmissions: data.submissions.length,
        uniqueCompetitions: uniqueComps.size,
        uniqueChallenges: uniqueChallenges.size
      })

      // Get unique competitions for filter
      const compsMap = new Map()
      data.submissions.forEach((s: SubmissionHistory) => {
        if (!compsMap.has(s.competitionId)) {
          compsMap.set(s.competitionId, s.competitionTitle)
        }
      })
      
      const compsArray = Array.from(compsMap.entries()).map(([id, title]) => ({ id, title }))
      setCompetitions(compsArray)

    } catch (error) {
      console.error("Error loading submission history:", error)
      addNotification("error", "Failed to load submission history")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter submissions based on search and competition filter
  useEffect(() => {
    let filtered = submissions

    // Filter by competition
    if (filterCompetition !== "all") {
      filtered = filtered.filter(s => s.competitionId === filterCompetition)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.competitionTitle.toLowerCase().includes(query) ||
        s.challengeTitle.toLowerCase().includes(query) ||
        s.challengeId.toLowerCase().includes(query) ||
        s.promptText.toLowerCase().includes(query)
      )
    }

    setFilteredSubmissions(filtered)
  }, [searchQuery, filterCompetition, submissions])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="animate-spin w-8 h-8 text-gray-900" />
          <p className="text-gray-900 font-medium mt-4">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="animate-spin w-8 h-8 text-gray-900" />
          <p className="text-gray-900 font-medium mt-4">Loading submission history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Notifications notifications={notifications} removeNotification={removeNotification} />

      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <History className="w-8 h-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Submission History</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      All previous submissions by {participantName}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/judge/${competitionId}/level2/${batchId}/${participantId}`)}
              >
                Back to Current Submissions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                    {stats.totalSubmissions}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Competitions</p>
                  <p className="text-3xl font-bold tracking-tight text-purple-600">
                    {stats.uniqueCompetitions}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Unique Challenges</p>
                  <p className="text-3xl font-bold tracking-tight text-green-600">
                    {stats.uniqueChallenges}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by competition, challenge, or prompt text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={filterCompetition} onValueChange={setFilterCompetition}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by Competition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Competitions</SelectItem>
                    {competitions.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Previous Submissions ({filteredSubmissions.length})
            </h2>
          </div>

          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {submissions.length === 0 ? "No Submissions Found" : "No Matching Submissions"}
                </h3>
                <p className="text-gray-600">
                  {submissions.length === 0 
                    ? "This participant has no previous submissions."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <Card key={`${submission.competitionId}_${submission.submissionId}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-50">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-4 h-4 text-purple-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {submission.competitionTitle}
                              </h3>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                Challenge {submission.challengeId}
                              </Badge>
                              <span className="text-sm font-medium text-gray-700">
                                {submission.challengeTitle}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {submission.promptText}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-gray-600">{formatDate(submission.submittedAt)}</span>
                          </div>
                          {submission.hasScore && (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              Judge Scored
                            </Badge>
                          )}
                          {submission.llmScores && Object.keys(submission.llmScores).length > 0 && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              AI Evaluated
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => router.push(
                          `/judge/${competitionId}/level2/${batchId}/${participantId}/history/${submission.competitionId}/${submission.challengeId}`
                        )}
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
