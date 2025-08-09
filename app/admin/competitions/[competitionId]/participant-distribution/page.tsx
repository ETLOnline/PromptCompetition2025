"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { distributeJudges, updateSubmissionsStatus } from "@/lib/challengeAssignment"
// import { distributeJudgesManually } from "@/lib/manualDistribution"
import {
  fetchCompetitionData,
  fetchTopParticipantsData,
  fetchChallengesData,  
  fetchJudgesData,
  fetchSubmissionsData
} from "@/hooks/useChallengeData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle, Circle } from 'lucide-react'
import DistributionTable from "@/components/JudgeDistribution/DistributionTable"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

import { getAssignedCompetitions } from "@/lib/judge/getAssignedCompetitions"

interface LoadingState {
  competition: boolean
  participants: boolean
  challenges: boolean
  judges: boolean
  submissions: boolean
  distribution: boolean
  savingConfig: boolean
}

interface LoadedData {
  topParticipants: any[]
  leaderboardEntries: any[]
  challenges: any[]
  submissionsByChallenge: Record<string, any[]>
  judges: any[]
  competition: any | null
}


export default function ParticipantDistributionPage() {
  const { competitionId } = useParams() as { competitionId: string }
  const { user, role } = useAuth()
  const router = useRouter()
  
  // Consolidated data state
  const [data, setData] = useState<LoadedData>({
    topParticipants: [],
    leaderboardEntries: [],
    challenges: [],
    submissionsByChallenge: {},
    judges: [],
    competition: null
  })
  
  // Loading states
  const [loading, setLoading] = useState<LoadingState>({
    competition: false,
    participants: false,
    challenges: false,
    judges: false,
    submissions: false,
    distribution: false,
    savingConfig: false
  })
  
  // Other states
  const [result, setResult] = useState<any>(null)
  const [resultType, setResultType] = useState<'manual' | 'equal'>('equal')
  const [topN, setTopN] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [configSaved, setConfigSaved] = useState(false)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
    
  // Add this state near your other state declarations 
  const [existingAssignments, setExistingAssignments] = useState< Record<string, Record<string, number>> >({}) 
                                                                
  // Utility function to update loading state
  const updateLoadingState = (key: keyof LoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }))
  }

  // Save configuration to Firestore
  const saveConfiguration = async (selectedTopN: number) => {
    if (!competitionId || selectedTopN <= 0) return false
    
    updateLoadingState('savingConfig', true)
    setError(null)
    
    try {
      const competitionRef = doc(db, 'competitions', competitionId)
      const configData = {
        configurations: {
          selectedTopN,
          timestamp: serverTimestamp(),
          userId: user?.uid || 'id not found'
        }
      }
      await updateDoc(competitionRef, configData)
      
      setData(prev => ({
        ...prev,
        competition: prev.competition ? {
          ...prev.competition,
          configurations: { ...prev.competition.configurations, selectedTopN }
        } : null
      }))
      
      setConfigSaved(true)
      setTimeout(() => setConfigSaved(false), 3000)
      return true
    } 
    catch (err) 
    {
      console.error('Error saving configuration:', err)
      setError(`Failed to save configuration: ${err}`)
      return false
    } 
    finally 
    {
      updateLoadingState('savingConfig', false)
    }
  }

  // Load all data based on topN value
  const loadData = async (topNValue: number, loadSubmissions = false) => {
    if (!competitionId || topNValue <= 0) return false

    setError(null)
    const isFullLoad = loadSubmissions && topNValue > 0

    updateLoadingState("participants", isFullLoad)
    updateLoadingState("challenges", true)
    updateLoadingState("judges", true)
    updateLoadingState("submissions", isFullLoad)

    try {
      const [challengesResult, judgesResult] = await Promise.all([
        fetchChallengesData(competitionId),
        fetchJudgesData()
      ])

      if (!challengesResult.length) throw new Error("No challenges found")
      if (!judgesResult.length) throw new Error("No judges found")

      setData(prev => ({
        ...prev,
        challenges: challengesResult,
        judges: judgesResult
      }))
      updateLoadingState("challenges", false)
      updateLoadingState("judges", false)

      // 🔹 Fetch existing assignments for ALL judges in parallel
      const assignmentsArray = await Promise.all(
        judgesResult.map(judge =>
          getAssignedCompetitions(judge.id).then(assignments => ({
            judgeId: judge.id,
            assignments
          }))
        )
      )

      // Store raw string[] assignments in state
      const existingAssignmentsData = assignmentsArray.reduce((acc, { judgeId, assignments }) => {
        acc[judgeId] = Object.fromEntries(
          Object.entries(assignments).map(([challengeId, submissionIds]) => [
            challengeId,
            submissionIds.length
          ])
        )
        return acc
      }, {} as Record<string, Record<string, number>>)

      fetch("/api/debugger", {
          method: "POST",
          body: JSON.stringify({ message: `Data recieved: ${JSON.stringify(existingAssignmentsData)}` }),
          headers: {
              "Content-Type": "application/json",
          },
      })

      setExistingAssignments(existingAssignmentsData)

      if (isFullLoad) {
        const participantsResult = await fetchTopParticipantsData(competitionId, topNValue)
        if (!participantsResult.participantIds.length) {
          throw new Error("No participants found")
        }

        const { entries, participantIds } = participantsResult
        setData(prev => ({
          ...prev,
          topParticipants: participantIds,
          leaderboardEntries: entries
        }))
        updateLoadingState("participants", false)

        const submissionsResult = await fetchSubmissionsData(competitionId, participantIds)
        setData(prev => ({
          ...prev,
          submissionsByChallenge: submissionsResult
        }))
        updateLoadingState("submissions", false)
      }

      return true
    } catch (err) {
      console.error("Error loading data:", err)
      setError(`Failed to load data: ${err}`)
      setLoading(prev => ({
        ...prev,
        participants: false,
        challenges: false,
        judges: false,
        submissions: false
      }))
      return false
    }
  }



  // Initialize component data
  useEffect(() => {
    if (!user || !competitionId || (role !== "admin" && role !== "superadmin")) {
      router.push("/")
      return
    }
    
    const initialize = async () => {
      updateLoadingState('competition', true)
      updateLoadingState('participants', true)
      
      try {
        // Load competition data
        const competition = await fetchCompetitionData(competitionId)
        if (!competition) throw new Error('Competition not found')
        
        setData(prev => ({ ...prev, competition }))
        updateLoadingState('competition', false)
        
        // Load total participants count
        const participantsResult = await fetchTopParticipantsData(competitionId, 10000)
        const totalCount = participantsResult.participantIds.length
        setTotalParticipants(totalCount)
        updateLoadingState('participants', false)
        
        // Auto-configure if saved config exists
        const savedTopN = competition?.configurations?.selectedTopN
        if (savedTopN) 
        {
          const validTopN = Math.min(savedTopN, totalCount)
          setTopN(validTopN)
          await loadData(validTopN, true)
        } 
        else 
        {
          await loadData(1, false)
        }
        
        setIsInitialized(true)
      } catch (err) {
        console.error('Initialization failed:', err)
        setError(`Failed to initialize: ${err}`)
        updateLoadingState('competition', false)
        updateLoadingState('participants', false)
      }
    }

    initialize()
  }, [competitionId, user, role, router])

  // Handle load data button click
  const handleLoadData = async () => {
    if (topN <= 0 || topN > totalParticipants) {
      setError('Please enter a valid number of participants')
      return
    }
    
    const configSaved = await saveConfiguration(topN)
    if (configSaved) {
      await loadData(topN, true)
    }
  }

  // Handle manual distribution
  // const handleManualDistribute = async (assignments: ManualAssignment[]) => {
  //   if (!competitionId) throw new Error('Competition ID is required')

  //   const result = await distributeJudgesManually({
  //     competitionId,
  //     assignments,
  //     challenges: data.challenges,
  //     submissionsByChallenge: data.submissionsByChallenge,
  //     judges: data.judges,
  //     topParticipants: data.topParticipants,
  //   })

  //   setResult(result)
  //   setResultType('manual')
  //   return result
  // }

  // Handle equal distribution
  const handleEqualDistribute = async () => {
    if (!competitionId) return
    
    setError(null)
    updateLoadingState('distribution', true)
    
    try {
      const assignmentResult = await distributeJudges({
        competitionId,
        challenges: data.challenges,
        submissionsByChallenge: data.submissionsByChallenge,
        judges: data.judges,
        topParticipants: data.topParticipants,
      })

      // Collect all assigned submissions from all assignments
      const allAssignedSubmissions = assignmentResult.assignments.flatMap(a => a.submissions)

      // Update status for all these submissions
      await updateSubmissionsStatus(competitionId, allAssignedSubmissions, 'selected_for_manual_review')

      
      const transformedResult = {
        success: true,
        assignments: assignmentResult.assignments.map(a => ({
          judgeId: a.judgeId,
          judgeName: a.judgeName,
          challengeId: a.challengeId,
          challengeTitle: a.challengeTitle,
          submissionCount: a.submissionCount
        })),
        totalAssigned: assignmentResult.totalSubmissionsAssigned
      }
      
      setResult(transformedResult)
      setResultType('equal')
    } catch (err) {
      console.error("Distribution failed", err)
      setError(`Distribution failed: ${err}`)
    } finally {
      updateLoadingState('distribution', false)
    }
  }

  // Computed states
  const isLoadingAny = Object.values(loading).some(Boolean)
  const hasFullData = data.leaderboardEntries.length > 0 && 
                    data.challenges.length > 0 && 
                    data.judges.length > 0 && 
                    Object.keys(data.submissionsByChallenge).length > 0
  const canLoadData = isInitialized && topN > 0 && topN <= totalParticipants && !isLoadingAny

  const StepIndicator = ({
    title,
    isLoading,
    isCompleted,
    count
  }: {
    title: string
    isLoading: boolean
    isCompleted: boolean
    count?: number
  }) => (
    <div className="flex items-center space-x-2 text-sm">
      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
      {isCompleted && !isLoading && <CheckCircle className="h-4 w-4 text-green-500" />}
      {!isLoading && !isCompleted && <Circle className="h-4 w-4 text-gray-300" />}
      <span className={
        isCompleted && !isLoading ? 'text-green-600' :
        isLoading ? 'text-blue-600' :
        'text-gray-500'
      }>
        {title}
        {count !== undefined && isCompleted && !isLoading && ` (${count})`}
      </span>
    </div>
  )

  // Access control
  if (!user || (role !== "admin" && role !== "superadmin")) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Judge Distribution</h1>
          {loading.competition && (
            <p className="text-sm text-blue-600 flex items-center mt-1">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading competition data...
            </p>
          )}
        </div>
      </div>

      {/* Loading Screen for Initialization */}
      {!isInitialized && (loading.competition || loading.participants) && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Initializing</h2>
            <p className="text-muted-foreground">
              Loading competition and participant data...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {isInitialized && (
        <>
          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {configSaved && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Configuration saved successfully!</AlertDescription>
            </Alert>
          )}

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Set the number of top participants for judge distribution
                {data.competition?.configurations?.selectedTopN && 
                  ` (Current: ${data.competition.configurations.selectedTopN})`
                }
                <br />
                <span className="text-sm font-medium">
                  Total Participants Available: {totalParticipants}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 max-w-xs">
                  <Label htmlFor="topN">Top N Participants</Label>
                  <Input
                    id="topN"
                    type="number"
                    value={topN || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (value <= totalParticipants) {
                        setTopN(value)
                      }
                    }}
                    min={1}
                    max={totalParticipants}
                    placeholder="Enter number"
                    disabled={isLoadingAny}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be between 1 and {totalParticipants}
                  </p>
                </div>
                
                <Button
                  onClick={handleLoadData}
                  disabled={!canLoadData}
                  size="lg"
                >
                  {isLoadingAny ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load Data'
                  )}
                </Button>
              </div>
              
              {(topN < 1 || topN > totalParticipants) && topN !== 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Please enter a number between 1 and {totalParticipants}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Loading Progress */}
          {isLoadingAny && (
            <Card>
              <CardHeader>
                <CardTitle>Loading Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StepIndicator
                  title="Participants"
                  isLoading={loading.participants}
                  isCompleted={data.leaderboardEntries.length > 0}
                  count={data.leaderboardEntries.length}
                />
                <StepIndicator
                  title="Challenges"
                  isLoading={loading.challenges}
                  isCompleted={data.challenges.length > 0}
                  count={data.challenges.length}
                />
                <StepIndicator
                  title="Judges"
                  isLoading={loading.judges}
                  isCompleted={data.judges.length > 0}
                  count={data.judges.length}
                />
                <StepIndicator
                  title="Submissions"
                  isLoading={loading.submissions}
                  isCompleted={Object.keys(data.submissionsByChallenge).length > 0}
                  count={Object.values(data.submissionsByChallenge).flat().length}
                />
              </CardContent>
            </Card>
          )}

          {/* Data Summary */}
          {(data.challenges.length > 0 || data.judges.length > 0) && !isLoadingAny && (
            <Card>
              <CardHeader>
                <CardTitle>Data Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{data.challenges.length}</div>
                  <div className="text-sm text-muted-foreground">Challenges</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{data.judges.length}</div>
                  <div className="text-sm text-muted-foreground">Judges</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{data.leaderboardEntries.length}</div>
                  <div className="text-sm text-muted-foreground">Selected</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.values(data.submissionsByChallenge).flat().length}
                  </div>
                  <div className="text-sm text-muted-foreground">Submissions</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distribution */}
          {hasFullData && (
            <Tabs defaultValue="distribute" className="space-y-4">
              <TabsList>
                <TabsTrigger value="distribute">Distribution</TabsTrigger>
                {result && <TabsTrigger value="results">Results</TabsTrigger>}
              </TabsList>

              <TabsContent value="distribute">
                <Card>
                  <CardHeader>
                    <CardTitle>Judge Distribution</CardTitle>
                    <CardDescription>
                      Choose between manual assignment or automatic equal distribution for {data.leaderboardEntries.length} participants
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DistributionTable
                      competitionId={competitionId}
                      challenges={data.challenges}
                      judges={data.judges}
                      submissionsByChallenge={data.submissionsByChallenge}
                      onManualDistribute={async () => {}}
                      onEqualDistribute={handleEqualDistribute}
                      loading={loading.distribution}
                      prefillAssignments={existingAssignments}
                      disableEqual={Object.values(existingAssignments).some(challengeAssignments => 
                        Object.values(challengeAssignments).some(count => count > 0)
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Partial Data State */}
          {!hasFullData && data.challenges.length > 0 && data.judges.length > 0 && !isLoadingAny && (
            <Card>
              <CardHeader>
                <CardTitle>Ready for Distribution Setup</CardTitle>
                <CardDescription>
                  Challenges and judges are loaded. Configure participants to proceed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">
                    {data.challenges.length} challenges and {data.judges.length} judges are ready
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Enter the number of participants above and click "Load Data"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}