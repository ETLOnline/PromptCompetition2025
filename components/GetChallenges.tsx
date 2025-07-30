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
import { getDocs, type Timestamp, collection, query, orderBy, limit, where, deleteDoc, doc } from "firebase/firestore"
import { getAuth } from "firebase/auth"

type Challenge = {
  id: string
  title: string
  description: string
  problemStatement: string
  guidelines: string
  rubric: string
  startDeadline: Timestamp
  competitionid: string
  emailoflatestupdate: string
  lastupdatetime: Timestamp
}

export default function GetChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRoleAndChallenges = async () => {
      try {
        const auth = getAuth()
        const tokenResult = await auth.currentUser?.getIdTokenResult()
        const role = tokenResult?.claims?.role || null
        setUserRole(role)
        console.log("User Role:", role)

        const CHALLENGE_COLLECTION = process.env.NEXT_PUBLIC_CHALLENGE_DATABASE
        if (!CHALLENGE_COLLECTION) {
          throw new Error("NEXT_PUBLIC_CHALLENGE_DATABASE is not defined in the environment")
        }

        console.log("Fetching challenges for competition...")
        const competitionsRef = collection(db, "competitions")
        const latestQuery = query(competitionsRef, orderBy("createdAt", "desc"), limit(1))
        const snapshot = await getDocs(latestQuery)
        // console.log("Competition snapshot:", snapshot)

        if (snapshot.empty) {
          console.warn("No competitions found.")
          return
        }

        const maincompetitionid = snapshot.docs[0].id
        // console.log("Main Competition ID:", maincompetitionid)

        const challengesQuery = query(
          collection(db, "competitions", maincompetitionid, "challenges")
        )
        
        const challengesSnap = await getDocs(challengesQuery)

        const fetched: Challenge[] = challengesSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Challenge, "id">),
        }))

        setChallenges(fetched)
      } catch (error) {
        console.error("Error fetching challenges or user role:", error)
      }
    }

    fetchUserRoleAndChallenges()
  }, [])

  const handleDelete = async (competitionId: string, challengeId: string) => {
    try {
      await deleteDoc(doc(db, "competitions", competitionId, "challenges", challengeId))
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId))
    } catch (err) {
      console.error("Error deleting challenge:", err)
    }
  }

  return (
    <div className="bg-gradient-to-r from-slate-100 to-slate-150 p-6 rounded-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Challenges</h2>
          <p className="text-gray-700 font-medium">Manage and monitor your competition events</p>
        </div>
        <Button
          onClick={() => router.push("/admin/competitions/new")}
          className="bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-md transition-all duration-200 font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      <div className="grid gap-6">
        {challenges.map((challenge) => {
          const startDate = challenge.startDeadline.toDate()
          const updateDate = challenge.lastupdatetime?.toDate()
          const isExpired = startDate < new Date()

          return (
            <Card
              key={challenge.id}
              className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-gray-200"
            >
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-100 to-slate-150 rounded-t-xl">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-3">{challenge.title}</CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 text-xs font-medium uppercase ${
                        isExpired
                          ? "bg-red-50 border-red-200 text-red-800"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      {isExpired ? (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Expired
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-gradient-to-r from-gray-700 to-gray-600">
                      <Calendar className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Start:</span>
                      <div className="font-bold text-gray-900">{startDate.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-gradient-to-r from-gray-700 to-gray-600">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Updated By:</span>
                      <div className="font-bold text-gray-900 truncate">{challenge.emailoflatestupdate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-gradient-to-r from-gray-700 to-gray-600">
                      <Clock className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Last Update:</span>
                      <div className="font-bold text-gray-900">{updateDate?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap pt-4 border-t border-gray-200">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-gray-700 to-gray-600 text-white font-medium hover:shadow-md transition-all duration-200"
                    onClick={() => {
                      if (isExpired) {
                        setShowModal(true)
                      } else {
                        router.push(`/admin/competitions/${challenge.id}/edit`)
                      }
                    }}
                  >
                    Edit
                  </Button>

                  {["admin", "superadmin"].includes(userRole || "") && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:shadow-md transition-all duration-200"
                      onClick={() => {
                        setChallengeToDelete(challenge.id)
                        setDeleteConfirmOpen(true)
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
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 bg-transparent"
              onClick={() => {
                setChallengeToDelete(null)
                setDeleteConfirmOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:shadow-md transition-all duration-200"
              onClick={async () => {
                if (!challengeToDelete) return
                await handleDelete(challengeToDelete)
                setChallengeToDelete(null)
                setDeleteConfirmOpen(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Not Allowed Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-white border border-gray-200 text-gray-900 shadow-xl rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-amber-50">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">Editing Not Allowed</DialogTitle>
            </div>
            <DialogDescription className="text-gray-700 font-medium">
              You can't edit this challenge because the competition has already started.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-gradient-to-r from-gray-700 to-gray-600 text-white font-medium hover:shadow-md transition-all duration-200"
              onClick={() => setShowModal(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
