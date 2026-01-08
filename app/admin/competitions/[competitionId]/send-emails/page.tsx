"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/api"
import { sendLevel2Emails } from "@/lib/api"
import { useAuth } from "@clerk/nextjs"
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Mail, 
  Calendar, 
  Clock, 
  Users, 
  ChevronLeft, 
  Send, 
  CheckCircle2, 
  XCircle,
  Video,
  Eye,
  Edit2,
  Loader2
} from "lucide-react"

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
  participantIds?: string[]
}

interface ZoomLinks {
  [participantId: string]: string
}

interface EmailStatus {
  batchId: string
  sent: boolean
  timestamp?: Date
  sentTo?: {
    participants: string[]
    judges: string[]
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const toDate = (value: any): Date => {
  if (!value) return new Date()
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate()
  }
  if (value instanceof Date) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }
  if (typeof value === 'number') {
    return new Date(value)
  }
  return new Date()
}

const formatDateTime = (date: Date) => {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-blue-600",
    "bg-red-600",
    "bg-purple-600",
    "bg-green-600",
    "bg-indigo-600",
    "bg-pink-600",
    "bg-teal-600",
    "bg-orange-600",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash = hash & hash
  }
  return colors[Math.abs(hash) % colors.length]
}

// ============================================================================
// DEFAULT EMAIL TEMPLATES
// ============================================================================

const DEFAULT_PARTICIPANT_TEMPLATE = `Dear {participantName},

🎉 Congratulations on qualifying for Level 2 of Prompt Idol Pakistan! 🎉

We are thrilled to inform you that you have successfully advanced to the next stage of the competition.

📋 LEVEL 2 FORMAT:
Level 2 will be different from Level 1. In Level 2, you will participate in a live Zoom call with our judges. During this session:
• You will be assigned tasks to complete in real-time
• The judges will evaluate your approach and methodology
• You will have the opportunity to explain your thought process and answer questions about your submissions

🔗 HOW TO ACCESS:
1. Login with the same account you used in Level 1
2. In your dashboard, you will see "Prompt Idol Pakistan Level 2"
3. Click the "Continue" button on the competition card at the scheduled time below

📅 YOUR SCHEDULE:
Date & Time: {batchStartTime} to {batchEndTime}

🎥 ZOOM MEETING LINK:
{zoomLink}

⚠️ IMPORTANT:
• Please join the Zoom call on time
• Ensure you have a stable internet connection
• Keep your microphone and camera ready
• Have your development environment set up

We wish you the best of luck for Level 2!

Best regards,
The Prompt Idol Pakistan Team`

const DEFAULT_JUDGE_TEMPLATE = `Dear {judgeName},

You have been assigned to evaluate participants for Level 2 of Prompt Idol Pakistan.

📋 EVALUATION SCHEDULE:
Batch: {batchName}
Date & Time: {batchStartTime} to {batchEndTime}

👥 ASSIGNED PARTICIPANTS:
{participantsList}

🔗 ZOOM DETAILS:
{zoomLinksList}

📝 EVALUATION GUIDELINES:
• Assess the participant's approach to solving the challenges
• Evaluate their problem-solving methodology
• Ask questions to understand their thought process
• Provide constructive feedback

Please ensure you are available at the scheduled time and have reviewed the evaluation criteria.

Thank you for your participation as a judge!

Best regards,
The Prompt Idol Pakistan Team`

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SendEmailsPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const { toast } = useToast()
  const { getToken } = useAuth()

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<{ [batchId: string]: boolean }>({})
  const [competitionName, setCompetitionName] = useState("")
  
  // Data states
  const [judges, setJudges] = useState<Judge[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  
  // Email template states
  const [participantTemplate, setParticipantTemplate] = useState(DEFAULT_PARTICIPANT_TEMPLATE)
  const [judgeTemplate, setJudgeTemplate] = useState(DEFAULT_JUDGE_TEMPLATE)
  
  // Zoom links for each participant
  const [zoomLinks, setZoomLinks] = useState<ZoomLinks>({})
  
  // Email status tracking
  const [emailStatuses, setEmailStatuses] = useState<{ [batchId: string]: EmailStatus }>({})
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    batchId: string
    batchName: string
    participantEmails: { name: string; email: string; content: string }[]
    judgeEmails: { name: string; email: string; content: string }[]
  }>({
    open: false,
    batchId: "",
    batchName: "",
    participantEmails: [],
    judgeEmails: [],
  })

  // Preview dialog state
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean
    type: 'participant' | 'judge'
    content: string
  }>({
    open: false,
    type: 'participant',
    content: ''
  })

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchAllData()
  }, [competitionId])

  const fetchAllData = async () => {
    try {
      setLoading(true)

      // Fetch competition name
      const competitionDoc = await getDoc(doc(db, "competitions", competitionId))
      if (competitionDoc.exists()) {
        setCompetitionName(competitionDoc.data().title || "Competition")
      }

      // Fetch judges
      const judgesSnapshot = await getDocs(
        collection(db, "competitions", competitionId, "judges")
      )
      const judgesData: Judge[] = []
      judgesSnapshot.forEach((doc) => {
        const data = doc.data()
        judgesData.push({
          userid: data.judgeId || doc.id,
          fullName: data.judgeName || "Unknown Judge",
          email: "", // Will be fetched from users collection if needed
        })
      })

      // Fetch judge emails from users collection
      const judgeDetailsPromises = judgesData.map(async (judge) => {
        const userDoc = await getDoc(doc(db, "users", judge.userid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          judge.email = userData.email || ""
          judge.fullName = userData.fullName || judge.fullName
        }
        return judge
      })
      const judgesWithEmails = await Promise.all(judgeDetailsPromises)
      setJudges(judgesWithEmails)

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
          participantIds: data.participantIds || [],
        })
      })
      batchesData.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      setBatches(batchesData)

      // Fetch participants and their zoom links
      const participantsSnapshot = await getDocs(
        collection(db, "competitions", competitionId, "participants")
      )
      const participantsData: Participant[] = []
      const latestZoomLinks: ZoomLinks = {}
      
      participantsSnapshot.forEach((doc) => {
        const data = doc.data()
        participantsData.push({
          userid: doc.id,
          email: data.email || "",
          fullName: data.fullName || data.email || "Unknown Participant",
          assignedBatchId: data.assignedBatchId || undefined,
          assignedJudgeIds: data.assignedJudgeIds || [],
        })
        
        // Get zoom link from participant document (latest source of truth)
        if (data.zoomLink) {
          latestZoomLinks[doc.id] = data.zoomLink
        }
      })
      setParticipants(participantsData)

      // Fetch email records for status tracking only
      const emailRecordsSnapshot = await getDocs(
        collection(db, "competitions", competitionId, "emailRecords")
      )
      const existingEmailStatuses: { [batchId: string]: EmailStatus } = {}

      // Get the most recent email record for each batch
      const batchRecords: { [batchId: string]: any } = {}
      emailRecordsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.batchId) {
          const timestamp = toDate(data.timestamp)
          // Keep only the most recent record per batch
          if (!batchRecords[data.batchId] || 
              timestamp > toDate(batchRecords[data.batchId].timestamp)) {
            batchRecords[data.batchId] = data
          }
        }
      })

      // Build email statuses from most recent records
      Object.values(batchRecords).forEach((data: any) => {
        existingEmailStatuses[data.batchId] = {
          batchId: data.batchId,
          sent: true,
          timestamp: toDate(data.timestamp),
          sentTo: data.sentTo,
        }
      })

      setZoomLinks(latestZoomLinks)
      setEmailStatuses(existingEmailStatuses)

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
  // COMPUTED VALUES
  // ============================================================================

  const participantsByBatch = useMemo(() => {
    const grouped: { [batchId: string]: Participant[] } = {}
    batches.forEach((batch) => {
      grouped[batch.id] = participants.filter(
        (p) => p.assignedBatchId === batch.id
      )
    })
    return grouped
  }, [batches, participants])

  // ============================================================================
  // EMAIL TEMPLATE GENERATION
  // ============================================================================

  const generateParticipantEmail = (participant: Participant, batch: Batch) => {
    const zoomLink = zoomLinks[participant.userid] || "To be provided"
    return participantTemplate
      .replace(/{participantName}/g, participant.fullName)
      .replace(/{batchStartTime}/g, formatDateTime(batch.startTime))
      .replace(/{batchEndTime}/g, formatDateTime(batch.endTime))
      .replace(/{batchName}/g, batch.batchName)
      .replace(/{zoomLink}/g, zoomLink)
  }

  const generateJudgeEmail = (judge: Judge, batch: Batch, assignedParticipants: Participant[]) => {
    const participantsList = assignedParticipants
      .map((p, index) => `${index + 1}. ${p.fullName} (${p.email})`)
      .join('\n')
    
    const zoomLinksList = assignedParticipants
      .map((p) => {
        const zoomLink = zoomLinks[p.userid] || "To be provided"
        return `• ${p.fullName}: ${zoomLink}`
      })
      .join('\n')

    return judgeTemplate
      .replace(/{judgeName}/g, judge.fullName)
      .replace(/{batchName}/g, batch.batchName)
      .replace(/{batchStartTime}/g, formatDateTime(batch.startTime))
      .replace(/{batchEndTime}/g, formatDateTime(batch.endTime))
      .replace(/{participantsList}/g, participantsList)
      .replace(/{zoomLinksList}/g, zoomLinksList)
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleZoomLinkChange = (participantId: string, link: string) => {
    setZoomLinks((prev) => ({
      ...prev,
      [participantId]: link,
    }))
  }

  const handlePreviewEmail = (type: 'participant' | 'judge', batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    if (!batch) return

    const batchParticipants = participantsByBatch[batchId] || []
    if (batchParticipants.length === 0) return

    let content = ""
    if (type === 'participant') {
      content = generateParticipantEmail(batchParticipants[0], batch)
    } else {
      const judgeId = batchParticipants[0]?.assignedJudgeIds?.[0]
      const judge = judges.find((j) => j.userid === judgeId)
      if (judge) {
        content = generateJudgeEmail(judge, batch, batchParticipants)
      }
    }

    setPreviewDialog({
      open: true,
      type,
      content,
    })
  }

  const handleSendEmails = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    if (!batch) return

    const batchParticipants = participantsByBatch[batchId] || []
    if (batchParticipants.length === 0) {
      toast({
        title: "No Participants",
        description: "This batch has no assigned participants.",
        variant: "destructive",
      })
      return
    }

    // Check if all participants have zoom links
    const missingZoomLinks = batchParticipants.filter(
      (p) => !zoomLinks[p.userid] || zoomLinks[p.userid].trim() === ""
    )
    if (missingZoomLinks.length > 0) {
      toast({
        title: "Missing Zoom Links",
        description: `Please provide Zoom links for all participants before sending emails.`,
        variant: "destructive",
      })
      return
    }

    // Generate emails
    const participantEmails = batchParticipants.map((p) => ({
      name: p.fullName,
      email: p.email,
      content: generateParticipantEmail(p, batch),
    }))

    // Get unique judges for this batch
    const judgeIds = new Set<string>()
    batchParticipants.forEach((p) => {
      p.assignedJudgeIds?.forEach((jId) => judgeIds.add(jId))
    })

    const judgeEmails = Array.from(judgeIds).map((judgeId) => {
      const judge = judges.find((j) => j.userid === judgeId)
      if (!judge) return null

      const assignedParticipants = batchParticipants.filter((p) =>
        p.assignedJudgeIds?.includes(judgeId)
      )

      return {
        name: judge.fullName,
        email: judge.email,
        content: generateJudgeEmail(judge, batch, assignedParticipants),
      }
    }).filter(Boolean) as { name: string; email: string; content: string }[]

    setConfirmDialog({
      open: true,
      batchId,
      batchName: batch.batchName,
      participantEmails,
      judgeEmails,
    })
  }

  const confirmSendEmails = async () => {
    const { batchId, participantEmails, judgeEmails } = confirmDialog
    const batch = batches.find((b) => b.id === batchId)
    if (!batch) return

    try {
      setSending((prev) => ({ ...prev, [batchId]: true }))
      setConfirmDialog({ ...confirmDialog, open: false })

      const batchParticipants = participantsByBatch[batchId] || []
      const batchZoomLinks: ZoomLinks = {}
      batchParticipants.forEach((p) => {
        if (zoomLinks[p.userid]) {
          batchZoomLinks[p.userid] = zoomLinks[p.userid]
        }
      })

      const response = await sendLevel2Emails(
        competitionId,
        {
          batchId,
          batchName: batch.batchName,
          batchStartTime: batch.startTime.toISOString(),
          batchEndTime: batch.endTime.toISOString(),
          participantEmails,
          judgeEmails,
          zoomLinks: batchZoomLinks,
        },
        getToken
      )

      // Update email status
      setEmailStatuses((prev) => ({
        ...prev,
        [batchId]: {
          batchId,
          sent: true,
          timestamp: new Date(),
          sentTo: {
            participants: participantEmails.map((e) => e.email),
            judges: judgeEmails.map((e) => e.email),
          },
        },
      }))

      toast({
        title: "Emails Sent Successfully",
        description: `Sent ${response.sentCount} emails for ${batch.batchName}`,
      })

      // Refresh data to get updated records
      await fetchAllData()

    } catch (error: any) {
      console.error("Error sending emails:", error)
      toast({
        title: "Error Sending Emails",
        description: error.message || "Failed to send emails. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSending((prev) => ({ ...prev, [batchId]: false }))
    }
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading email notification system...</p>
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
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Level 2 Email Notifications</h1>
          <p className="text-muted-foreground">
            Send confirmation emails to participants and judges for {competitionName}
          </p>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* EMAIL TEMPLATES */}
      {/* ====================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Customize the email templates for participants and judges. Use placeholders like {"{participantName}"}, {"{judgeName}"}, {"{batchName}"}, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="participant-template">Participant Email Template</Label>
            <Textarea
              id="participant-template"
              value={participantTemplate}
              onChange={(e) => setParticipantTemplate(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="judge-template">Judge Email Template</Label>
            <Textarea
              id="judge-template"
              value={judgeTemplate}
              onChange={(e) => setJudgeTemplate(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* ====================================================================== */}
      {/* BATCH SECTIONS */}
      {/* ====================================================================== */}
      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No batches scheduled for this competition.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {batches.map((batch) => {
            const batchParticipants = participantsByBatch[batch.id] || []
            const emailStatus = emailStatuses[batch.id]
            const isSending = sending[batch.id]

            return (
              <Card key={batch.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl">{batch.batchName}</CardTitle>
                        {emailStatus?.sent && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Emails Sent
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateTime(batch.startTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          to {formatDateTime(batch.endTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {batchParticipants.length} Participants
                        </div>
                      </div>
                      {emailStatus?.sent && (
                        <p className="text-xs text-muted-foreground">
                          Sent on {emailStatus.timestamp ? formatDateTime(emailStatus.timestamp) : 'Unknown'}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewEmail('participant', batch.id)}
                        disabled={batchParticipants.length === 0}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview Participant Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewEmail('judge', batch.id)}
                        disabled={batchParticipants.length === 0}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview Judge Email
                      </Button>
                      <Button
                        onClick={() => handleSendEmails(batch.id)}
                        disabled={batchParticipants.length === 0 || isSending}
                        className="gap-2"
                        variant={emailStatus?.sent ? "secondary" : "default"}
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            {emailStatus?.sent ? "Resend Emails" : "Send Emails"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {batchParticipants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No participants assigned to this batch</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {batchParticipants.map((participant) => {
                        const assignedJudges = judges.filter((j) =>
                          participant.assignedJudgeIds?.includes(j.userid)
                        )

                        return (
                          <Card key={participant.userid} className="border-2">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                {/* Participant Info */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold ${getAvatarColor(
                                        participant.fullName
                                      )}`}
                                    >
                                      {getInitials(participant.fullName)}
                                    </div>
                                    <div>
                                      <p className="font-semibold">{participant.fullName}</p>
                                      <p className="text-sm text-muted-foreground">{participant.email}</p>
                                    </div>
                                  </div>

                                  {emailStatus?.sent && emailStatus.sentTo?.participants.includes(participant.email) && (
                                    <Badge variant="secondary" className="gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Email Sent
                                    </Badge>
                                  )}
                                </div>

                                {/* Assigned Judges */}
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Assigned Judges:</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {assignedJudges.length === 0 ? (
                                      <Badge variant="outline" className="gap-1">
                                        <XCircle className="h-3 w-3" />
                                        No judges assigned
                                      </Badge>
                                    ) : (
                                      assignedJudges.map((judge) => (
                                        <Badge key={judge.userid} variant="outline" className="gap-2">
                                          <div
                                            className={`flex h-5 w-5 items-center justify-center rounded-full text-white text-xs ${getAvatarColor(
                                              judge.fullName
                                            )}`}
                                          >
                                            {getInitials(judge.fullName)}
                                          </div>
                                          {judge.fullName}
                                          {emailStatus?.sent && emailStatus.sentTo?.judges.includes(judge.email) && (
                                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                                          )}
                                        </Badge>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Zoom Link Input */}
                                <div className="space-y-2">
                                  <Label htmlFor={`zoom-${participant.userid}`} className="flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    Zoom Meeting Link
                                    {emailStatus?.sent && (
                                      <Badge variant="outline" className="text-xs ml-2">
                                        Can be edited and resent
                                      </Badge>
                                    )}
                                  </Label>
                                  <Input
                                    id={`zoom-${participant.userid}`}
                                    placeholder="https://zoom.us/j/..."
                                    value={zoomLinks[participant.userid] || ""}
                                    onChange={(e) => handleZoomLinkChange(participant.userid, e.target.value)}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
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

      {/* ====================================================================== */}
      {/* CONFIRMATION DIALOG */}
      {/* ====================================================================== */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Confirm Email Sending</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send emails for <strong>{confirmDialog.batchName}</strong>. Please review the details below:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Participant Emails */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participant Emails ({confirmDialog.participantEmails.length})
              </h4>
              <Accordion type="single" collapsible className="w-full">
                {confirmDialog.participantEmails.map((email, index) => (
                  <AccordionItem key={index} value={`participant-${index}`}>
                    <AccordionTrigger className="text-sm">
                      {email.name} ({email.email})
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="text-xs bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono">
                        {email.content}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <Separator />

            {/* Judge Emails */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Judge Emails ({confirmDialog.judgeEmails.length})
              </h4>
              <Accordion type="single" collapsible className="w-full">
                {confirmDialog.judgeEmails.map((email, index) => (
                  <AccordionItem key={index} value={`judge-${index}`}>
                    <AccordionTrigger className="text-sm">
                      {email.name} ({email.email})
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="text-xs bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono">
                        {email.content}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSendEmails}>
              Confirm and Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ====================================================================== */}
      {/* PREVIEW DIALOG */}
      {/* ====================================================================== */}
      <AlertDialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ ...previewDialog, open })}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {previewDialog.type === 'participant' ? 'Participant' : 'Judge'} Email Preview
            </AlertDialogTitle>
            <AlertDialogDescription>
              This is a sample of how the email will look. Actual emails will be personalized for each recipient.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <pre className="text-sm bg-muted p-6 rounded-lg whitespace-pre-wrap font-mono">
              {previewDialog.content}
            </pre>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setPreviewDialog({ ...previewDialog, open: false })}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
