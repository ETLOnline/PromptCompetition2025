// Final code with create/delete protection after competition start
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  Scale,
} from "lucide-react"
import { db } from "@/lib/firebase"
import {
  getDocs,
  type Timestamp,
  collection,
  query,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore"
import { getAuth } from "firebase/auth"

type Challenge = {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  rubric: Array<{
    name: string
    description: string
    weight: number
  }>
  startDeadline: Timestamp
  endDeadline: Timestamp
  lastupdatetime: Timestamp
  nameOfLatestUpdate: string
  emailoflatestupdate: string
}

export default function GetChallenges({ competitionId }: { competitionId: string }) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [competitionStartTime, setCompetitionStartTime] = useState<Date | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null)
  const [expandedChallenges, setExpandedChallenges] = useState<Set<string>>(new Set())
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)


  const toggleChallengeExpansion = (challengeId: string) => {
    setExpandedChallenges((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId)
      } else {
        newSet.add(challengeId)
      }
      return newSet
    })
  }

  useEffect(() => {
    const fetchUserRoleAndChallenges = async () => {
      try {
        const auth = getAuth()
        const tokenResult = await auth.currentUser?.getIdTokenResult()
        const role = (tokenResult?.claims?.role as string) || null
        setUserRole(role)

        const compDocRef = doc(db, "competitions", competitionId)
        const compSnap = await getDoc(compDocRef)
        if (compSnap.exists()) {
          const startTimestamp = compSnap.data()?.startDeadline
          if (startTimestamp) {
            const startDate = new Date(startTimestamp) // ← simple conversion
            setCompetitionStartTime(startDate)
          }
        }

        const challengesQuery = query(collection(db, "competitions", competitionId, "challenges"))

        const challengesSnap = await getDocs(challengesQuery)

        const fetched: Challenge[] = challengesSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Challenge, "id">),
        }))

        setChallenges(fetched)
      } catch (error) {
        console.error("Error fetching challenges:", error)
      }
    }

    fetchUserRoleAndChallenges()
  }, [competitionId])

  // const handleDelete = async (challengeId: string) => {
  //   try {
  //     await deleteDoc(doc(db, "competitions", competitionId, "challenges", challengeId))
  //     setChallenges((prev) => prev.filter((c) => c.id !== challengeId))
  //     const competitionDocRef = doc(db, "competitions", competitionId)
  //     await updateDoc(competitionDocRef, {
  //       ChallengeCount: increment(-1),
  //     })
  //   } catch (err) {
  //     console.error("Error deleting challenge:", err)
  //   }
  // }

  const handleDelete = async (challengeId: string) => {
    try {
      // Delete the challenge document
      await deleteDoc(doc(db, "competitions", competitionId, "challenges", challengeId))
      
      // Update local state to remove the challenge
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId))
      
      // Try to get submissions collection - handle case where collection doesn't exist
      try {
        const submissionsRef = collection(db, "competitions", competitionId, "submissions")
        const submissionsSnapshot = await getDocs(submissionsRef)
        
        // Check if submissions collection exists and has documents
        if (!submissionsSnapshot.empty) {
          // Filter submissions that belong to the deleted challenge
          const submissionsToDelete = submissionsSnapshot.docs.filter(doc => {
            const submissionId = doc.id
            // Validate submissionId format
            if (!submissionId || typeof submissionId !== 'string') {
              return false
            }
            
            // Extract challengeId from submissionId format: participantId_challengeId
            const parts = submissionId.split('_')
            if (parts.length >= 2) {
              const submissionChallengeId = parts[parts.length - 1] // Get the last part after splitting by '_'
              return submissionChallengeId === challengeId
            }
            return false
          })
          
          // Delete all related submissions if any exist
          if (submissionsToDelete.length > 0) {
            const deletePromises = submissionsToDelete.map(submissionDoc => 
              deleteDoc(doc(db, "competitions", competitionId, "submissions", submissionDoc.id))
            )
            
            await Promise.all(deletePromises)
          }
        }
      } catch (submissionError) {
        // Handle case where submissions collection doesn't exist or other submission-related errors
        // Continue with challenge deletion even if submission cleanup fails
      }
      
      // Update competition document to decrement challenge count
      const competitionDocRef = doc(db, "competitions", competitionId)
      await updateDoc(competitionDocRef, {
        ChallengeCount: increment(-1),
      })
      
    } catch (err) {
      console.error("Error deleting challenge:", err)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-0 shadow-sm mt-10">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
            <p className="text-gray-600 text-sm">Manage and monitor your competition events</p>
          </div>
          <Button
            onClick={() => {
              if (competitionStartTime && competitionStartTime < new Date()) {
                setShowCreateModal(true)
              } else {
                router.push(`/admin/competitions/${competitionId}/challenges/new`)
              }
            }}
            className="bg-gray-900 text-white hover:bg-gray-800 px-5 py-2 rounded-lg font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid gap-6">
          {challenges.map((challenge) => {
            const updateDate = challenge.lastupdatetime?.toDate()
            // const startDate = challenge.startDeadline?.toDate()
            // const endDate = challenge.endDeadline?.toDate()
            const isExpired = competitionStartTime < new Date()
            const isExpanded = expandedChallenges.has(challenge.id)

            return (
              <Collapsible
                key={challenge.id}
                open={isExpanded}
                onOpenChange={() => toggleChallengeExpansion(challenge.id)}
              >
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <CardHeader className="bg-gray-50 p-5 rounded-t-xl border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-semibold text-gray-900">{challenge.title}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${isExpired ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}
                      >
                        {isExpired ? (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" /> Live Now
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" /> Active
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-6">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-gray-800">
                          <Calendar className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <span className="text-gray-700 font-medium">Start:</span>
                          <div className="font-bold text-gray-900">{competitionStartTime?.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-gray-800">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <span className="text-gray-700 font-medium">Updated By:</span>
                          <div className="font-bold text-gray-900 truncate">{challenge.emailoflatestupdate}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-gray-800">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <span className="text-gray-700 font-medium">Last Update:</span>
                          <div className="font-bold text-gray-900">{updateDate?.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    <CollapsibleContent className="space-y-6">
                      <div className="border-t border-gray-200 pt-6">
                        <div className="grid gap-6">
                          {/* Challenge Deadlines */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Challenge Timeline
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Start Date:</span>
                                <div className="font-semibold text-gray-900">{competitionStartTime?.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>

                          {/* Problem Statement */}
                          {challenge.problemStatement && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Problem Statement
                              </h4>
                              <p className="text-gray-700 whitespace-pre-wrap">{challenge.problemStatement}</p>
                            </div>
                          )}

                          {/* Guidelines */}
                          {challenge.guidelines && (
                            <div className="bg-green-50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Guidelines
                              </h4>
                              <p className="text-gray-700 whitespace-pre-wrap">{challenge.guidelines}</p>
                            </div>
                          )}

                          {/* Rubric */}
                          {challenge.rubric && challenge.rubric.length > 0 && (
                            <div className="bg-purple-50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Scale className="w-4 h-4" />
                                Evaluation Rubric
                              </h4>
                              <div className="space-y-3">
                                {challenge.rubric.map((criterion, index) => (
                                  <div key={index} className="bg-white rounded-md p-3 border border-purple-200">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-gray-900">{criterion.name}</h5>
                                      <Badge variant="secondary" className="text-xs">
                                        Weight: {criterion.weight}
                                      </Badge>
                                    </div>
                                    <p className="text-gray-600 text-sm">{criterion.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>

                    <div className="flex gap-3 flex-wrap items-center">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-4 py-2 bg-transparent"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              Show Details
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      <Button
                        size="sm"
                        className="bg-gray-900 text-white hover:bg-gray-800 font-semibold px-4 py-2"
                        onClick={() => {
                          if (isExpired && userRole !== "superadmin") {
                            // normal users can't edit expired competitions
                            setShowModal(true)
                          } else {
                            // superadmin OR non-expired case
                            router.push(
                              `/admin/competitions/${competitionId}/challenges/${challenge.id}/edit`
                            )
                          }
                        }}
                      >
                        Edit
                      </Button>

                      {(userRole === "admin" || userRole === "superadmin") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-600 text-white hover:bg-red-700 font-semibold px-4 py-2"
                          onClick={() => {
                            if (competitionStartTime && competitionStartTime < new Date() && userRole !== "superadmin") {
                              setShowModal(true)
                            } else {
                              setChallengeToDelete(challenge.id)
                              setDeleteConfirmOpen(true)
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Collapsible>
            )
          })}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
// Updated Dialog component
<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
  <DialogContent className="bg-white border border-gray-200 text-gray-900 shadow-xl rounded-xl">
    <DialogHeader>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-full bg-red-50">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <DialogTitle className="text-xl font-bold text-gray-900">Are you sure?</DialogTitle>
      </div>
      <DialogDescription className="text-gray-700 font-medium">
        This action will permanently delete the challenge. This cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="flex justify-end gap-2">
      <Button
        variant="outline"
        className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
        disabled={isDeleting}
        onClick={() => {
          setChallengeToDelete(null)
          setDeleteConfirmOpen(false)
        }}
      >
        Cancel
      </Button>
      <Button
        className="bg-red-600 text-white hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isDeleting}
        onClick={async () => {
          if (!challengeToDelete) return
          
          setIsDeleting(true)
          try {
            await handleDelete(challengeToDelete)
            setChallengeToDelete(null)
            setDeleteConfirmOpen(false)
          } finally {
            setIsDeleting(false)
          }
        }}
      >
        {isDeleting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Deleting...
          </>
        ) : (
          "Delete"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Shared Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-white border border-gray-200 text-gray-900 shadow-xl rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-amber-50">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">Action Not Allowed</DialogTitle>
            </div>
            <DialogDescription className="text-gray-700 font-medium">
              You can't modify or delete challenges after the competition has started.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800 font-semibold"
              onClick={() => setShowModal(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Not Allowed Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white border border-gray-200 text-gray-900 shadow-xl rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-amber-50">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">Challenge Creation Not Allowed</DialogTitle>
            </div>
            <DialogDescription className="text-gray-700 font-medium">
              You can't create a new challenge because the competition has already started.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800 font-semibold"
              onClick={() => setShowCreateModal(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
