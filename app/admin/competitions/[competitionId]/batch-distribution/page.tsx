"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Calendar,
  Trophy,
  Shuffle,
  Save,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  Clock,
  Target,
  Settings,
  Grid3X3,
  Plus,
  Trash2,
} from "lucide-react"
import { collection, getDocs, doc, getDoc, writeBatch, query, where, onSnapshot, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Participant = {
  userid: string
  email: string
  fullName: string
  rank?: number
  assignedBatchId?: string
}

type Challenge = {
  id: string
  title: string
  description?: string
}

type Batch = {
  id: string
  name: string
  startTime: string
  endTime: string
  challengeIds: string[]
  participantIds: string[]
  userCapacity?: number
}

type Schedule = {
  batchId: string
  batchName: string
  startTime: Date
  endTime: Date
  challengeIds: string[]
  participantIds: string[]
}

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-blue-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

// Helper function to format Date to local datetime-local input format
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function BatchDistributionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [competitionName, setCompetitionName] = useState("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [numBatches, setNumBatches] = useState<number>(3)
  const [distributionMode, setDistributionMode] = useState<"equal" | "manual">("equal")
  const [isDistributed, setIsDistributed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [targetBatchId, setTargetBatchId] = useState<string>("")
  const [existingSchedules, setExistingSchedules] = useState<Schedule[]>([])
  const [startDeadline, setStartDeadline] = useState<Date | null>(null)
  const [endDeadline, setEndDeadline] = useState<Date | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check auth
        const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
        setRole(profile.role)

        if (profile.role !== "superadmin") {
          toast({
            title: "Access Denied",
            description: "Only superadmins can access this page.",
            variant: "destructive",
          })
          router.push(`/admin/competitions/${competitionId}/level2-dashboard`)
          return
        }

        // Fetch competition name
        const competitionDoc = await getDoc(doc(db, "competitions", competitionId))
        if (competitionDoc.exists()) {
          const data = competitionDoc.data()
          setCompetitionName(data.title || "")
          if (data.startDeadline) {
            setStartDeadline(data.startDeadline.toDate ? data.startDeadline.toDate() : new Date(data.startDeadline))
          }
          if (data.endDeadline) {
            setEndDeadline(data.endDeadline.toDate ? data.endDeadline.toDate() : new Date(data.endDeadline))
          }
        }

        // Fetch participants
        const participantsSnap = await getDocs(collection(db, `competitions/${competitionId}/participants`))
        const participantsData = participantsSnap.docs.map((doc) => ({
          userid: doc.id,
          ...doc.data(),
        })) as Participant[]
        setParticipants(participantsData)

        // Fetch challenges
        const challengesSnap = await getDocs(collection(db, `competitions/${competitionId}/challenges`))
        const challengesData = challengesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Challenge[]
        setChallenges(challengesData)

        // Check for existing schedules
        const schedulesSnap = await getDocs(collection(db, `competitions/${competitionId}/schedules`))
        if (!schedulesSnap.empty) {
          const schedulesData = schedulesSnap.docs.map((doc) => {
            const data = doc.data()
            return {
              batchId: doc.id,
              batchName: data.batchName,
              startTime: data.startTime.toDate ? data.startTime.toDate() : new Date(data.startTime),
              endTime: data.endTime.toDate ? data.endTime.toDate() : new Date(data.endTime),
              challengeIds: data.challengeIds || [],
              participantIds: data.participantIds || [],
            }
          }) as Schedule[]
          setExistingSchedules(schedulesData)
          setIsDistributed(true)
          
          // Load existing batches for management view
          const loadedBatches = schedulesData.map((schedule, index) => ({
            id: schedule.batchId,
            name: schedule.batchName,
            startTime: formatDateForInput(schedule.startTime),
            endTime: formatDateForInput(schedule.endTime),
            challengeIds: schedule.challengeIds,
            participantIds: schedule.participantIds,
          }))
          setBatches(loadedBatches)
        } else {
          // Initialize empty batches
          initializeBatches(3)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error initializing:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    initialize()
  }, [competitionId, router, toast])

  const initializeBatches = (count: number) => {
    const newBatches: Batch[] = []
    for (let i = 0; i < count; i++) {
      newBatches.push({
        id: `batch-${i + 1}`,
        name: `Day ${i + 1}`,
        startTime: "",
        endTime: "",
        challengeIds: [],
        participantIds: [],
        userCapacity: distributionMode === "manual" ? 0 : undefined,
      })
    }
    setBatches(newBatches)
  }

  const handleNumBatchesChange = (value: string) => {
    const num = parseInt(value)
    if (num >= 1 && num <= 10) {
      setNumBatches(num)
      setBatches((prev) => {
        const newBatches = [...prev]
        if (num > prev.length) {
          for (let i = prev.length; i < num; i++) {
            newBatches.push({
              id: `batch-${i + 1}`,
              name: `Day ${i + 1}`,
              startTime: "",
              endTime: "",
              challengeIds: [],
              participantIds: [],
              userCapacity: distributionMode === "manual" ? 0 : undefined,
            })
          }
        } else if (num < prev.length) {
          newBatches.splice(num)
        }
        return newBatches
      })
    }
  }

  const handleBatchNameChange = (batchId: string, name: string) => {
    setBatches((prev) =>
      prev.map((batch) => (batch.id === batchId ? { ...batch, name } : batch))
    )
  }

  const handleBatchTimeChange = (batchId: string, field: "startTime" | "endTime", value: string) => {
    setBatches((prev) =>
      prev.map((batch) => (batch.id === batchId ? { ...batch, [field]: value } : batch))
    )
  }

  const handleCapacityChange = (batchId: string, capacity: string) => {
    const num = parseInt(capacity) || 0
    setBatches((prev) =>
      prev.map((batch) => (batch.id === batchId ? { ...batch, userCapacity: num } : batch))
    )
  }

  // Get all selected challenges across all batches
  const selectedChallengeIds = useMemo(() => {
    const ids = new Set<string>()
    batches.forEach((batch) => {
      batch.challengeIds.forEach((id) => ids.add(id))
    })
    return ids
  }, [batches])

  // Get available challenges for a specific batch
  const getAvailableChallenges = (batchId: string) => {
    const currentBatch = batches.find((b) => b.id === batchId)
    const currentSelections = currentBatch?.challengeIds || []
    
    return challenges.filter(
      (challenge) =>
        !selectedChallengeIds.has(challenge.id) || currentSelections.includes(challenge.id)
    )
  }

  const handleChallengeToggle = (batchId: string, challengeId: string) => {
    setBatches((prev) =>
      prev.map((batch) => {
        if (batch.id === batchId) {
          const isSelected = batch.challengeIds.includes(challengeId)
          return {
            ...batch,
            challengeIds: isSelected
              ? batch.challengeIds.filter((id) => id !== challengeId)
              : [...batch.challengeIds, challengeId],
          }
        }
        return batch
      })
    )
  }

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const handleDistribute = () => {
    if (distributionMode === "equal") {
      distributeEqually()
    } else {
      distributeManually()
    }
  }

  const distributeEqually = () => {
    const shuffled = shuffleArray(participants)
    const participantsPerBatch = Math.ceil(shuffled.length / batches.length)

    const updatedBatches = batches.map((batch, index) => {
      const startIndex = index * participantsPerBatch
      const endIndex = Math.min(startIndex + participantsPerBatch, shuffled.length)
      const batchParticipants = shuffled.slice(startIndex, endIndex)

      return {
        ...batch,
        participantIds: batchParticipants.map((p) => p.userid),
      }
    })

    setBatches(updatedBatches)
    toast({
      title: "Distribution Complete",
      description: `Participants distributed equally across ${batches.length} batches.`,
    })
  }

  const distributeManually = () => {
    const totalCapacity = batches.reduce((sum, batch) => sum + (batch.userCapacity || 0), 0)

    if (totalCapacity !== participants.length) {
      toast({
        title: "Invalid Capacity",
        description: `Total capacity (${totalCapacity}) must equal total participants (${participants.length}).`,
        variant: "destructive",
      })
      return
    }

    const shuffled = shuffleArray(participants)
    let currentIndex = 0

    const updatedBatches = batches.map((batch) => {
      const capacity = batch.userCapacity || 0
      const batchParticipants = shuffled.slice(currentIndex, currentIndex + capacity)
      currentIndex += capacity

      return {
        ...batch,
        participantIds: batchParticipants.map((p) => p.userid),
      }
    })

    setBatches(updatedBatches)
    toast({
      title: "Distribution Complete",
      description: `Participants distributed according to manual capacities.`,
    })
  }

  const validateBatches = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    batches.forEach((batch, index) => {
      if (!batch.name.trim()) {
        errors.push(`Batch ${index + 1}: Name is required`)
      }
      if (!batch.startTime) {
        errors.push(`${batch.name}: Start time is required`)
      }
      if (!batch.endTime) {
        errors.push(`${batch.name}: End time is required`)
      }
      if (batch.startTime && batch.endTime && batch.startTime >= batch.endTime) {
        errors.push(`${batch.name}: End time must be after start time`)
      }
      if (batch.startTime && startDeadline && new Date(batch.startTime) < startDeadline) {
        errors.push(`${batch.name}: Start time must be on or after ${startDeadline.toLocaleString()}`)
      }
      if (batch.endTime && endDeadline && new Date(batch.endTime) > endDeadline) {
        errors.push(`${batch.name}: End time must be on or before ${endDeadline.toLocaleString()}`)
      }
      if (batch.challengeIds.length === 0) {
        errors.push(`${batch.name}: At least one challenge must be selected`)
      }
      // Only require participants for non-emergency batches or batches that have challenges
      if (batch.participantIds.length === 0 && !batch.name.toLowerCase().includes('emergency')) {
        errors.push(`${batch.name}: No participants assigned`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  const getBatchErrors = (batch: Batch) => {
    const errors: {startTime?: string, endTime?: string} = {}
    if (!batch.startTime) {
      errors.startTime = "Start time is required"
    } else {
      const start = new Date(batch.startTime)
      if (startDeadline && start < startDeadline) {
        errors.startTime = `Start time must be on or after ${startDeadline.toLocaleString()}`
      }
    }
    if (!batch.endTime) {
      errors.endTime = "End time is required"
    } else {
      const end = new Date(batch.endTime)
      if (endDeadline && end > endDeadline) {
        errors.endTime = `End time must be on or before ${endDeadline.toLocaleString()}`
      }
      if (batch.startTime) {
        const start = new Date(batch.startTime)
        if (start >= end) {
          errors.endTime = "End time must be after start time"
        }
      }
    }
    return errors
  }

  const handleFinalize = () => {
    const validation = validateBatches()
    if (!validation.valid) {
      toast({
        title: "Validation Failed",
        description: validation.errors[0],
        variant: "destructive",
      })
      return
    }
    setShowConfirmDialog(true)
  }

  const handleConfirmFinalize = async () => {
    setShowConfirmDialog(false)
    setIsSaving(true)

    try {
      const batch = writeBatch(db)

      // Delete existing schedules
      const schedulesSnap = await getDocs(collection(db, `competitions/${competitionId}/schedules`))
      schedulesSnap.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Create new schedules
      batches.forEach((batchData) => {
        const scheduleRef = doc(db, `competitions/${competitionId}/schedules`, batchData.id)
        batch.set(scheduleRef, {
          batchName: batchData.name,
          startTime: new Date(batchData.startTime).toISOString(),
          endTime: new Date(batchData.endTime).toISOString(),
          challengeIds: batchData.challengeIds,
          participantIds: batchData.participantIds,
          createdAt: new Date().toISOString(),
        })
      })

      // Update participants with assigned batch
      batches.forEach((batchData) => {
        batchData.participantIds.forEach((participantId) => {
          const participantRef = doc(db, `competitions/${competitionId}/participants`, participantId)
          batch.update(participantRef, {
            assignedBatchId: batchData.id,
          })
        })
      })

      await batch.commit()

      setIsDistributed(true)
      toast({
        title: "Success",
        description: "Batch distribution saved successfully!",
      })
    } catch (error) {
      console.error("Error saving distribution:", error)
      toast({
        title: "Error",
        description: "Failed to save distribution. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleMoveParticipant = (participant: Participant, currentBatchId: string) => {
    setSelectedParticipant(participant)
    setTargetBatchId("")
    setShowMoveDialog(true)
  }

  const handleConfirmMove = async () => {
    if (!selectedParticipant || !targetBatchId) return

    setShowMoveDialog(false)

    try {
      const sourceBatch = batches.find((b) =>
        b.participantIds.includes(selectedParticipant.userid)
      )
      if (!sourceBatch) return

      const targetBatch = batches.find((b) => b.id === targetBatchId)
      if (!targetBatch) return

      const batch = writeBatch(db)

      // Update source schedule
      const sourceScheduleRef = doc(db, `competitions/${competitionId}/schedules`, sourceBatch.id)
      batch.update(sourceScheduleRef, {
        participantIds: arrayRemove(selectedParticipant.userid),
      })

      // Update or create target schedule
      const targetScheduleRef = doc(db, `competitions/${competitionId}/schedules`, targetBatchId)
      // Check if target batch exists in Firestore by trying to get it
      const targetScheduleSnap = await getDoc(targetScheduleRef)

      if (targetScheduleSnap.exists()) {
        // Update existing schedule
        batch.update(targetScheduleRef, {
          participantIds: arrayUnion(selectedParticipant.userid),
        })
      } else {
        // Create new schedule for emergency batch
        batch.set(targetScheduleRef, {
          batchName: targetBatch.name,
          startTime: new Date(targetBatch.startTime).toISOString(),
          endTime: new Date(targetBatch.endTime).toISOString(),
          challengeIds: targetBatch.challengeIds,
          participantIds: [selectedParticipant.userid],
          createdAt: new Date().toISOString(),
        })
      }

      // Update participant
      const participantRef = doc(db, `competitions/${competitionId}/participants`, selectedParticipant.userid)
      batch.update(participantRef, {
        assignedBatchId: targetBatchId,
      })

      await batch.commit()

      // Update local state
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id === sourceBatch.id) {
            return {
              ...b,
              participantIds: b.participantIds.filter((id) => id !== selectedParticipant.userid),
            }
          }
          if (b.id === targetBatchId) {
            return {
              ...b,
              participantIds: [...b.participantIds, selectedParticipant.userid],
            }
          }
          return b
        })
      )

      toast({
        title: "Success",
        description: `${selectedParticipant.fullName} moved successfully!`,
      })
    } catch (error) {
      console.error("Error moving participant:", error)
      toast({
        title: "Error",
        description: "Failed to move participant. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateDistribution = async () => {
    const validation = validateBatches()
    if (!validation.valid) {
      toast({
        title: "Validation Failed",
        description: validation.errors[0],
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const batch = writeBatch(db)

      // Get existing schedules
      const schedulesSnap = await getDocs(collection(db, `competitions/${competitionId}/schedules`))
      const existingScheduleIds = new Set(schedulesSnap.docs.map(doc => doc.id))

      // Update or create schedules
      batches.forEach((batchData) => {
        const scheduleRef = doc(db, `competitions/${competitionId}/schedules`, batchData.id)
        batch.set(scheduleRef, {
          batchName: batchData.name,
          startTime: new Date(batchData.startTime).toISOString(),
          endTime: new Date(batchData.endTime).toISOString(),
          challengeIds: batchData.challengeIds,
          participantIds: batchData.participantIds,
          createdAt: new Date().toISOString(),
        })
        // Remove from existing set since we're keeping this one
        existingScheduleIds.delete(batchData.id)
      })

      // Delete schedules that are no longer in the batches
      existingScheduleIds.forEach((scheduleId) => {
        const scheduleRef = doc(db, `competitions/${competitionId}/schedules`, scheduleId)
        batch.delete(scheduleRef)
      })

      // Update participants with assigned batch
      batches.forEach((batchData) => {
        batchData.participantIds.forEach((participantId) => {
          const participantRef = doc(db, `competitions/${competitionId}/participants`, participantId)
          batch.update(participantRef, {
            assignedBatchId: batchData.id,
          })
        })
      })

      await batch.commit()

      setIsEditing(false)
      toast({
        title: "Success",
        description: "Batch distribution updated successfully!",
      })
    } catch (error) {
      console.error("Error updating distribution:", error)
      toast({
        title: "Error",
        description: "Failed to update distribution. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = async () => {
    setIsSaving(true)
    try {
      // Re-fetch schedules to revert changes
      const schedulesSnap = await getDocs(collection(db, `competitions/${competitionId}/schedules`))
      const schedulesData = schedulesSnap.docs.map((doc) => {
        const data = doc.data()
        return {
          batchId: doc.id,
          batchName: data.batchName,
          startTime: data.startTime.toDate ? data.startTime.toDate() : new Date(data.startTime),
          endTime: data.endTime.toDate ? data.endTime.toDate() : new Date(data.endTime),
          challengeIds: data.challengeIds || [],
          participantIds: data.participantIds || [],
        }
      }) as Schedule[]

      const loadedBatches = schedulesData.map((schedule) => ({
        id: schedule.batchId,
        name: schedule.batchName,
        startTime: formatDateForInput(schedule.startTime),
        endTime: formatDateForInput(schedule.endTime),
        challengeIds: schedule.challengeIds,
        participantIds: schedule.participantIds,
      }))
      setBatches(loadedBatches)
      setIsEditing(false)
      toast({
        title: "Cancelled",
        description: "Changes reverted successfully.",
      })
    } catch (error) {
      console.error("Error reverting changes:", error)
      toast({
        title: "Error",
        description: "Failed to revert changes.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddEmergencyBatch = () => {
    const newBatch: Batch = {
      id: `batch-${batches.length + 1}`,
      name: `Emergency Batch ${batches.length + 1}`,
      startTime: "",
      endTime: "",
      challengeIds: [],
      participantIds: [],
    }
    setBatches([...batches, newBatch])
    toast({
      title: "Batch Added",
      description: "New emergency batch created. Don't forget to configure it.",
    })
  }

  const handleDeleteBatch = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    if (batch && batch.participantIds.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete a batch with assigned participants. Move them first.",
        variant: "destructive",
      })
      return
    }
    setBatches((prev) => prev.filter((b) => b.id !== batchId))
    toast({
      title: "Batch Deleted",
      description: "Batch removed successfully.",
    })
  }

  const handleRemoveChallengeFromBatch = (batchId: string, challengeId: string) => {
    setBatches((prev) =>
      prev.map((batch) => {
        if (batch.id === batchId) {
          return {
            ...batch,
            challengeIds: batch.challengeIds.filter((id) => id !== challengeId),
          }
        }
        return batch
      })
    )
  }

  const handleAddChallengeToBatch = (batchId: string, challengeId: string) => {
    setBatches((prev) =>
      prev.map((batch) => {
        if (batch.id === batchId) {
          return {
            ...batch,
            challengeIds: [...batch.challengeIds, challengeId],
          }
        }
        return batch
      })
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (participants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/competitions/${competitionId}/level2-dashboard`)}
            className="mb-6"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="max-w-2xl mx-auto mt-20">
            <CardContent className="pt-12 pb-12 text-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Participants Found</h2>
              <p className="text-gray-600 mb-6">
                Please import participants from Level 1 before configuring batch distribution.
              </p>
              <Button
                onClick={() => router.push(`/admin/competitions/${competitionId}/get-participants`)}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                <Users className="h-4 w-4 mr-2" />
                Import Participants
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-2 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Batch Distribution</h1>
              <p className="text-gray-600 mt-1">{competitionName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              {participants.length} Participants
            </Badge>
            {isDistributed && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#0f172a] hover:bg-[#1e293b] text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Batches
              </Button>
            )}
            {isDistributed && isEditing && (
              <>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateDistribution}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {!isDistributed ? (
          <>
            {/* Configuration Section */}
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Batch Configuration
                </CardTitle>
                <CardDescription>
                  Configure the number of batches and assign challenges to each day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Label className="text-base font-medium">Number of Days:</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={numBatches}
                    onChange={(e) => handleNumBatchesChange(e.target.value)}
                    className="w-32"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {batches.map((batch, index) => (
                    <Card key={batch.id} className="border-2">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <Input
                              value={batch.name}
                              onChange={(e) => handleBatchNameChange(batch.id, e.target.value)}
                              className="text-lg font-semibold w-48"
                              placeholder="Batch Name"
                            />
                          </div>
                          <Badge variant="secondary">Batch {index + 1}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* DateTime Pickers */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              Start Time
                            </Label>
                            <Input
                              type="datetime-local"
                              value={batch.startTime}
                              onChange={(e) =>
                                handleBatchTimeChange(batch.id, "startTime", e.target.value)
                              }
                            />
                            {(() => {
                              const errors = getBatchErrors(batch)
                              return errors.startTime ? <p className="text-red-500 text-sm">{errors.startTime}</p> : null
                            })()}
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              End Time
                            </Label>
                            <Input
                              type="datetime-local"
                              value={batch.endTime}
                              onChange={(e) =>
                                handleBatchTimeChange(batch.id, "endTime", e.target.value)
                              }
                            />
                            {(() => {
                              const errors = getBatchErrors(batch)
                              return errors.endTime ? <p className="text-red-500 text-sm">{errors.endTime}</p> : null
                            })()}
                          </div>
                        </div>

                        {/* Challenge Selection */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-gray-500" />
                            Select Challenges
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                            {getAvailableChallenges(batch.id).map((challenge) => (
                              <button
                                key={challenge.id}
                                onClick={() => handleChallengeToggle(batch.id, challenge.id)}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  batch.challengeIds.includes(challenge.id)
                                    ? "border-purple-500 bg-purple-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium truncate">
                                    {challenge.title}
                                  </span>
                                  {batch.challengeIds.includes(challenge.id) && (
                                    <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 ml-2" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500">
                            {batch.challengeIds.length} challenge(s) selected
                          </p>
                        </div>

                        {/* Manual Capacity Input */}
                        {distributionMode === "manual" && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-gray-500" />
                              User Capacity
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={batch.userCapacity || 0}
                              onChange={(e) => handleCapacityChange(batch.id, e.target.value)}
                              placeholder="Number of participants"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribution Section */}
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="h-5 w-5 text-blue-600" />
                  Participant Distribution
                </CardTitle>
                <CardDescription>
                  Choose how to distribute participants across batches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Distribution Mode Toggle */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      setDistributionMode("equal")
                      setBatches((prev) =>
                        prev.map((batch) => ({ ...batch, userCapacity: undefined }))
                      )
                    }}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      distributionMode === "equal"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          distributionMode === "equal" ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <Grid3X3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Equal Distribution</h3>
                        <p className="text-sm text-gray-600">
                          Automatically divide participants equally
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setDistributionMode("manual")
                      setBatches((prev) =>
                        prev.map((batch) => ({ ...batch, userCapacity: batch.userCapacity || 0 }))
                      )
                    }}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      distributionMode === "manual"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          distributionMode === "manual" ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Manual Capacity</h3>
                        <p className="text-sm text-gray-600">
                          Set custom capacity for each batch
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Capacity Validation */}
                {distributionMode === "manual" && (() => {
                  const totalCapacity = batches.reduce((sum, b) => sum + (b.userCapacity || 0), 0)
                  return totalCapacity !== participants.length ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-900">
                            Total Capacity:{" "}
                            {totalCapacity} /{" "}
                            {participants.length}
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            The sum of all batch capacities must equal the total number of participants
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null
                })()}

                <Button
                  onClick={handleDistribute}
                  className="w-full bg-[#0f172a] hover:bg-[#0f172a] text-white"
                  size="lg"
                  disabled={batches.some(batch => Object.keys(getBatchErrors(batch)).length > 0)}
                >
                  <Shuffle className="h-5 w-5 mr-2" />
                  Distribute Participants
                </Button>
              </CardContent>
            </Card>

            {/* Preview Section */}
            {batches.some((b) => b.participantIds.length > 0) && (
              <Card className="bg-white rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Distribution Preview
                  </CardTitle>
                  <CardDescription>Review the distribution before finalizing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {batches.map((batch) => (
                    <div key={batch.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{batch.name}</h3>
                        <Badge variant="secondary">{batch.participantIds.length} participants</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {batch.participantIds.slice(0, 10).map((participantId) => {
                          const participant = participants.find((p) => p.userid === participantId)
                          if (!participant) return null
                          return (
                            <div
                              key={participantId}
                              className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback
                                  className={`${getAvatarColor(participant.fullName)} text-white text-xs`}
                                >
                                  {participant.fullName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-700">{participant.fullName}</span>
                            </div>
                          )
                        })}
                        {batch.participantIds.length > 10 && (
                          <span className="text-sm text-gray-500 px-3 py-1.5">
                            +{batch.participantIds.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={handleFinalize}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Finalize Distribution
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Live Management View */}
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Distribution Active
                    </CardTitle>
                    <CardDescription>
                      Manage participants across batches in real-time
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {batches.length} Batches
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {batches.map((batch) => {
                  const batchParticipants = participants.filter((p) =>
                    batch.participantIds.includes(p.userid)
                  )
                  const startDate = batch.startTime
                    ? new Date(batch.startTime).toLocaleString()
                    : "Not set"
                  const endDate = batch.endTime
                    ? new Date(batch.endTime).toLocaleString()
                    : "Not set"
                  const batchErrors = isEditing ? getBatchErrors(batch) : {}
                  const availableChallengesForBatch = challenges.filter(
                    (c) => !batch.challengeIds.includes(c.id)
                  )

                  return (
                    <Card key={batch.id} className="border-2">
                      <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-blue-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{batch.name}</h3>
                              {!isEditing && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {startDate} → {endDate}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-600 text-white">
                              {batch.participantIds.length} Participants
                            </Badge>
                            {isEditing && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBatch(batch.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={batch.participantIds.length > 0}
                                title={batch.participantIds.length > 0 ? "Cannot delete batch with participants" : "Delete batch"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Time Fields */}
                        {isEditing && (
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Start Time</Label>
                              <Input
                                type="datetime-local"
                                value={batch.startTime}
                                onChange={(e) =>
                                  handleBatchTimeChange(batch.id, "startTime", e.target.value)
                                }
                                className={batchErrors.startTime ? "border-red-500 mt-1" : "mt-1"}
                              />
                              {batchErrors.startTime && (
                                <p className="text-xs text-red-500 mt-1">{batchErrors.startTime}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">End Time</Label>
                              <Input
                                type="datetime-local"
                                value={batch.endTime}
                                onChange={(e) =>
                                  handleBatchTimeChange(batch.id, "endTime", e.target.value)
                                }
                                className={batchErrors.endTime ? "border-red-500 mt-1" : "mt-1"}
                              />
                              {batchErrors.endTime && (
                                <p className="text-xs text-red-500 mt-1">{batchErrors.endTime}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Challenges */}
                        <div className="mt-4">
                          <Label className="text-xs text-gray-600 mb-2 block">Challenges:</Label>
                          <div className="flex flex-wrap gap-2">
                            {batch.challengeIds.length === 0 ? (
                              <p className="text-sm text-gray-500">No challenges assigned</p>
                            ) : (
                              batch.challengeIds.map((challengeId) => {
                                const challenge = challenges.find((c) => c.id === challengeId)
                                return (
                                  <Badge key={challengeId} variant="outline" className="flex items-center gap-1">
                                    <Trophy className="h-3 w-3" />
                                    {challenge?.title || challengeId}
                                    {isEditing && (
                                      <button
                                        onClick={() =>
                                          handleRemoveChallengeFromBatch(batch.id, challengeId)
                                        }
                                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </Badge>
                                )
                              })
                            )}
                            {isEditing && availableChallengesForBatch.length > 0 && (
                              <Select
                                onValueChange={(value) => handleAddChallengeToBatch(batch.id, value)}
                              >
                                <SelectTrigger className="w-[200px] h-8">
                                  <SelectValue placeholder="+ Add Challenge" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableChallengesForBatch.map((challenge) => (
                                    <SelectItem key={challenge.id} value={challenge.id}>
                                      {challenge.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {batchParticipants.length > 0 ? (
                          <div className="space-y-2">
                            {batchParticipants.map((participant) => (
                              <div
                                key={participant.userid}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback
                                      className={`${getAvatarColor(participant.fullName)} text-white`}
                                    >
                                      {participant.fullName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {participant.fullName}
                                    </p>
                                    <p className="text-sm text-gray-500">{participant.email}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMoveParticipant(participant, batch.id)}
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Move
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-8">
                            No participants in this batch
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
                {isEditing && (
                  <Button
                    onClick={handleAddEmergencyBatch}
                    variant="outline"
                    className="w-full border-dashed border-2 py-6"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Emergency Batch
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Distribution
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will save the batch distribution and assign participants to their respective
                batches.
              </p>
              {existingSchedules.length > 0 && (
                <p className="text-amber-600 font-medium">
                  Warning: This will overwrite the existing schedule for this competition.
                </p>
              )}
              <p>Are you sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmFinalize}
              className="bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Participant Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Participant</DialogTitle>
            <DialogDescription>
              Select the target batch to move {selectedParticipant?.fullName} to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Batch</Label>
              <Select value={targetBatchId} onValueChange={setTargetBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches
                    .filter(
                      (b) =>
                        selectedParticipant &&
                        !b.participantIds.includes(selectedParticipant.userid)
                    )
                    .map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} ({batch.participantIds.length} participants)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMove} disabled={!targetBatchId}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Move Participant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
