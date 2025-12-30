"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Users,
  Calendar,
  Shield,
  Save,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  X,
  Clock,
  AlertTriangle,
  UserCheck,
} from "lucide-react"
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  writeBatch, 
  query, 
  where 
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface Judge {
  userid: string
  fullName: string
  email: string
}

interface Participant {
  userid: string
  email: string
  fullName: string
  assignedBatchId?: string
  assignedJudgeIds?: string[]
}

interface Batch {
  id: string
  batchName: string
  startTime: Date
  endTime: Date
  challengeIds?: string[]
}

interface JudgeAssignments {
  [participantId: string]: string[] // Array of judgeIds assigned to each participant
}

interface JudgeDistribution {
  judgeId: string
  judgeName: string
  assignments: {
    [batchId: string]: string[] // Array of participantIds for each batch
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getAvatarColor = (name: string) => {
  // Use darker, more contrasting colors that work well with white text
  const colors = [
    "bg-blue-600",
    "bg-red-600",
    "bg-purple-600",
    "bg-green-600",
    "bg-indigo-600",
    "bg-pink-600",
    "bg-teal-600",
    "bg-orange-600",
    "bg-rose-600",
    "bg-emerald-600",
    "bg-violet-600",
    "bg-cyan-600",
  ]
  // Better hash function for more even distribution
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return colors[Math.abs(hash) % colors.length]
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

const formatDateTime = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Safely converts a Firestore field to a Date object
 * Handles Firestore Timestamps, JavaScript Dates, ISO strings, and null/undefined
 */
const toDate = (value: any): Date => {
  if (!value) return new Date()

  // Firestore Timestamp
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate()
  }

  // JavaScript Date object
  if (value instanceof Date) {
    return value
  }

  // ISO string or other string
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }

  // Number (timestamp in milliseconds)
  if (typeof value === 'number') {
    return new Date(value)
  }

  // Fallback
  return new Date()
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function JudgeAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const { toast } = useToast()

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [competitionName, setCompetitionName] = useState("")

  // Data states
  const [judges, setJudges] = useState<Judge[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  // Assignment state - Core state that drives everything
  const [assignments, setAssignments] = useState<JudgeAssignments>({})

  // UI states
  const [openPopovers, setOpenPopovers] = useState<{ [key: string]: boolean }>({})

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    const initializePage = async () => {
      await checkAuthAndLoad()
      await fetchAllData()
    }
    initializePage()
  }, [competitionId])

  const checkAuthAndLoad = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
      if (profile.role !== "superadmin") {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        })
        router.push("/")
        return
      }
      setRole(profile.role)
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/")
    }
  }

  const fetchAllData = async () => {
    try {
      setLoading(true)

      // Fetch competition name
      const competitionDoc = await getDoc(doc(db, "competitions", competitionId))
      if (competitionDoc.exists()) {
        setCompetitionName(competitionDoc.data().title || "Competition")
      }

      // Fetch judges (all users with role === "judge")
      const judgesQuery = query(collection(db, "users"), where("role", "==", "judge"))
      const judgesSnapshot = await getDocs(judgesQuery)
      const judgesData: Judge[] = []
      judgesSnapshot.forEach((doc) => {
        const data = doc.data()
        judgesData.push({
          userid: doc.id,
          fullName: data.fullName || data.email || "Unknown Judge",
          email: data.email || "",
        })
      })
      setJudges(judgesData)

      // Fetch batches/schedules
      const schedulesSnapshot = await getDocs(
        collection(db, "competitions", competitionId, "schedules")
      )
      const batchesData: Batch[] = []
      schedulesSnapshot.forEach((doc) => {
        const data = doc.data()
        batchesData.push({
          id: doc.id,
          batchName: data.batchName || "Batch",
          startTime: toDate(data.startTime),
          endTime: toDate(data.endTime),
          challengeIds: data.challengeIds || [],
        })
      })
      // Sort batches by start time
      batchesData.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      setBatches(batchesData)

      // Fetch participants
      const participantsSnapshot = await getDocs(
        collection(db, "competitions", competitionId, "participants")
      )
      const participantsData: Participant[] = []
      const initialAssignments: JudgeAssignments = {}

      participantsSnapshot.forEach((doc) => {
        const data = doc.data()
        const participant: Participant = {
          userid: doc.id,
          email: data.email || "",
          fullName: data.fullName || data.email || "Unknown Participant",
          assignedBatchId: data.assignedBatchId || undefined,
          assignedJudgeIds: data.assignedJudgeIds || [],
        }
        participantsData.push(participant)

        // Initialize assignments state with existing data
        initialAssignments[doc.id] = data.assignedJudgeIds || []
      })

      setParticipants(participantsData)
      setAssignments(initialAssignments)

    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // SMART FILTERING LOGIC
  // ============================================================================

  /**
   * Returns the list of judges with availability status for a specific participant
   * A judge is "busy" if they're assigned to another participant in the same batch
   */
  const getAvailableJudges = useCallback(
    (batchId: string, participantId: string) => {
      // Get all participants in this batch
      const participantsInBatch = participants.filter(
        (p) => p.assignedBatchId === batchId
      )

      // Collect all judge IDs that are busy with OTHER participants in this batch
      const busyJudgeIds = new Set<string>()
      participantsInBatch.forEach((p) => {
        if (p.userid !== participantId) {
          const assignedJudges = assignments[p.userid] || []
          assignedJudges.forEach((judgeId) => busyJudgeIds.add(judgeId))
        }
      })

      // Get currently selected judges for this participant
      const currentlySelected = new Set(assignments[participantId] || [])

      // Map judges to availability status
      return judges.map((judge) => ({
        ...judge,
        isAvailable: !busyJudgeIds.has(judge.userid) || currentlySelected.has(judge.userid),
        isSelected: currentlySelected.has(judge.userid),
      }))
    },
    [judges, participants, assignments]
  )

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleToggleJudge = (participantId: string, judgeId: string) => {
    setAssignments((prev) => {
      const current = prev[participantId] || []
      const isCurrentlySelected = current.includes(judgeId)

      if (isCurrentlySelected) {
        // Remove judge
        return {
          ...prev,
          [participantId]: current.filter((id) => id !== judgeId),
        }
      } else {
        // Add judge
        return {
          ...prev,
          [participantId]: [...current, judgeId],
        }
      }
    })
  }

  const togglePopover = (participantId: string) => {
    setOpenPopovers((prev) => ({
      ...prev,
      [participantId]: !prev[participantId],
    }))
  }

  // ============================================================================
  // SAVE HANDLER - DUAL WRITE STRATEGY
  // ============================================================================

  const handleSave = async () => {
    try {
      setSaving(true)

      const batch = writeBatch(db)

      // ========================================================================
      // STEP 1: Update all participants with their assignedJudgeIds
      // ========================================================================
      participants.forEach((participant) => {
        const participantRef = doc(
          db,
          "competitions",
          competitionId,
          "participants",
          participant.userid
        )
        batch.update(participantRef, {
          assignedJudgeIds: assignments[participant.userid] || [],
        })
      })

      // ========================================================================
      // STEP 2: Calculate judge distribution (inverse mapping)
      // ========================================================================
      const judgeDistributionMap: { [judgeId: string]: JudgeDistribution } = {}

      // Initialize all judges
      judges.forEach((judge) => {
        judgeDistributionMap[judge.userid] = {
          judgeId: judge.userid,
          judgeName: judge.fullName,
          assignments: {},
        }
      })

      // Populate assignments
      participants.forEach((participant) => {
        const participantJudges = assignments[participant.userid] || []
        const batchId = participant.assignedBatchId

        if (batchId) {
          participantJudges.forEach((judgeId) => {
            if (!judgeDistributionMap[judgeId].assignments[batchId]) {
              judgeDistributionMap[judgeId].assignments[batchId] = []
            }
            judgeDistributionMap[judgeId].assignments[batchId].push(participant.userid)
          })
        }
      })

      // ========================================================================
      // STEP 3: Write judge distribution documents
      // ========================================================================
      Object.values(judgeDistributionMap).forEach((distribution) => {
        const judgeDistRef = doc(
          db,
          "competitions",
          competitionId,
          "judgeDistribution",
          distribution.judgeId
        )
        batch.set(judgeDistRef, distribution)
      })

      // ========================================================================
      // COMMIT BATCH
      // ========================================================================
      await batch.commit()

      toast({
        title: "Success",
        description: "Judge assignments saved successfully!",
        variant: "default",
      })
    } catch (error) {
      console.error("Error saving assignments:", error)
      toast({
        title: "Error",
        description: "Failed to save assignments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Group participants by batch
  const participantsByBatch = useMemo(() => {
    const grouped: { [batchId: string]: Participant[] } = {}

    batches.forEach((batch) => {
      grouped[batch.id] = participants.filter(
        (p) => p.assignedBatchId === batch.id
      )
    })

    return grouped
  }, [batches, participants])

  // Calculate statistics
  const stats = useMemo(() => {
    let totalAssignments = 0
    let participantsWithJudges = 0
    let participantsWithoutJudges = 0

    participants.forEach((p) => {
      const judgeCount = (assignments[p.userid] || []).length
      totalAssignments += judgeCount

      if (judgeCount > 0) {
        participantsWithJudges++
      } else {
        participantsWithoutJudges++
      }
    })

    return {
      totalAssignments,
      participantsWithJudges,
      participantsWithoutJudges,
    }
  }, [participants, assignments])

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading judge assignments...</p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ====================================================================== */}
      {/* HEADER */}
      {/* ====================================================================== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Judge Assignment</h1>
            <p className="text-muted-foreground">{competitionName}</p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Assignments
            </>
          )}
        </Button>
      </div>

      {/* ====================================================================== */}
      {/* STATISTICS CARDS */}
      {/* ====================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Judges</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judges.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.participantsWithJudges}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalAssignments} total assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            {stats.participantsWithoutJudges > 0 && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.participantsWithoutJudges}</div>
          </CardContent>
        </Card>
      </div>

      {/* ====================================================================== */}
      {/* BATCH SECTIONS */}
      {/* ====================================================================== */}
      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No batches configured for this competition.</p>
              <p className="text-sm mt-2">Please create batches first.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {batches.map((batch) => {
            const batchParticipants = participantsByBatch[batch.id] || []

            return (
              <Card key={batch.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>{batch.batchName}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(batch.startTime)} - {formatDateTime(batch.endTime)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {batchParticipants.length} Participants
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {batchParticipants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No participants assigned to this batch.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {batchParticipants.map((participant) => {
                        const availableJudges = getAvailableJudges(
                          batch.id,
                          participant.userid
                        )
                        const selectedJudges = availableJudges.filter((j) => j.isSelected)

                        return (
                          <div
                            key={participant.userid}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            {/* Participant Info */}
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`text-white ${getAvatarColor(participant.fullName)}`}>
                                  {getInitials(participant.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{participant.fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {participant.email}
                                </p>
                              </div>
                            </div>

                            {/* Judge Assignment UI */}
                            <div className="flex items-center gap-3">
                              {/* Selected Judges Display */}
                              <div className="flex items-center gap-2">
                                {selectedJudges.length === 0 ? (
                                  <Badge variant="outline" className="text-yellow-600">
                                    No judges assigned
                                  </Badge>
                                ) : (
                                  <div className="flex gap-1">
                                    {selectedJudges.slice(0, 3).map((judge) => (
                                      <Avatar
                                        key={judge.userid}
                                        className="h-8 w-8 border-2 border-background"
                                      >
                                        <AvatarFallback className={`text-white text-xs ${getAvatarColor(judge.fullName)}`}>
                                          {getInitials(judge.fullName)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {selectedJudges.length > 3 && (
                                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                                        +{selectedJudges.length - 3}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Multi-Select Popover */}
                              <Popover
                                open={openPopovers[participant.userid] || false}
                                onOpenChange={() => togglePopover(participant.userid)}
                              >
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="gap-2">
                                    <UserCheck className="h-4 w-4" />
                                    Assign Judges ({selectedJudges.length})
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0" align="end">
                                  <Command>
                                    <CommandInput placeholder="Search judges..." />
                                    <CommandEmpty>No judges found.</CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-auto">
                                      {availableJudges.map((judge) => (
                                        <CommandItem
                                          key={judge.userid}
                                          onSelect={() =>
                                            handleToggleJudge(
                                              participant.userid,
                                              judge.userid
                                            )
                                          }
                                          disabled={!judge.isAvailable}
                                          className={cn(
                                            "flex items-center justify-between",
                                            !judge.isAvailable && "opacity-50"
                                          )}
                                        >
                                          <div className="flex items-center gap-2 flex-1">
                                            <Avatar
                                              className="h-6 w-6"
                                            >
                                              <AvatarFallback className={`text-white text-xs ${getAvatarColor(judge.fullName)}`}>
                                                {getInitials(judge.fullName)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">
                                                {judge.fullName}
                                              </p>
                                              {!judge.isAvailable && (
                                                <p className="text-xs text-yellow-600">
                                                  Busy in this batch
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          {judge.isSelected && (
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
