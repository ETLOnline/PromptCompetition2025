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
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, User, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { db } from "@/lib/firebase"
import { getDocs, type Timestamp, collection, query, doc, getDoc, deleteDoc ,updateDoc, increment} from "firebase/firestore"
import { getAuth } from "firebase/auth"

type Challenge = {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  rubric: string
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
  const router = useRouter()

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
            const startDate = new Date(startTimestamp)  // ← simple conversion
            setCompetitionStartTime(startDate)
          }
        }

        const challengesQuery = query(
          collection(db, "competitions", competitionId, "challenges")
        )

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

  const handleDelete = async (challengeId: string) => {
    try {
      await deleteDoc(doc(db, "competitions", competitionId, "challenges", challengeId))
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId))
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
            const isExpired = competitionStartTime < new Date()

            return (
              <Card key={challenge.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-gray-50 p-5 rounded-t-xl border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-semibold text-gray-900">{challenge.title}</CardTitle>
                    <Badge variant="outline" className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${isExpired ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
                      {isExpired ? <><AlertCircle className="w-3 h-3 mr-1" /> Live Now</> : <><CheckCircle className="w-3 h-3 mr-1" /> Active</>}
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
                        <div className="font-bold text-gray-900">{competitionStartTime.toLocaleString()}</div>
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

                  <div className="flex gap-3 flex-wrap">
                    <Button
                      size="sm"
                      className="bg-gray-900 text-white hover:bg-gray-800 font-semibold px-4 py-2"
                      onClick={() => {
                        if (isExpired) setShowModal(true)
                        else router.push(`/admin/competitions/${competitionId}/challenges/${challenge.id}/edit`)
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
                          if (competitionStartTime && competitionStartTime < new Date()) {
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
            )
          })}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
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
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => {
              setChallengeToDelete(null)
              setDeleteConfirmOpen(false)
            }}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700 font-semibold" onClick={async () => {
              if (!challengeToDelete) return
              await handleDelete(challengeToDelete)
              setChallengeToDelete(null)
              setDeleteConfirmOpen(false)
            }}>Delete</Button>
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
            <Button className="bg-gray-900 text-white hover:bg-gray-800 font-semibold" onClick={() => setShowModal(false)}>
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
            <Button className="bg-gray-900 text-white hover:bg-gray-800 font-semibold" onClick={() => setShowCreateModal(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
