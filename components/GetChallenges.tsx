"use client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { db } from "@/lib/firebase"
import {
  getDocs,
  Timestamp,
  collection,
  query,
  orderBy,
  limit,
  where,
  deleteDoc,
  doc
} from "firebase/firestore"
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

        const CHALLENGE_COLLECTION = process.env.NEXT_PUBLIC_CHALLENGE_DATABASE
        if (!CHALLENGE_COLLECTION) {
          throw new Error("NEXT_PUBLIC_CHALLENGE_DATABASE is not defined in the environment")
        }

        const competitionsRef = collection(db, "competitions")
        const latestQuery = query(competitionsRef, orderBy("createdAt", "desc"), limit(1))
        const snapshot = await getDocs(latestQuery)

        if (snapshot.empty) {
          console.warn("No competitions found.")
          return
        }

        const maincompetitionid = snapshot.docs[0].id

        const challengesQuery = query(
          collection(db, CHALLENGE_COLLECTION),
          where("competitionid", "==", maincompetitionid)
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

  const handleDelete = async (challengeId: string) => {
    const CHALLENGE_COLLECTION = process.env.NEXT_PUBLIC_CHALLENGE_DATABASE
    if (!CHALLENGE_COLLECTION) return

    try {
      await deleteDoc(doc(db, CHALLENGE_COLLECTION, challengeId))
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId))
    } catch (err) {
      console.error("Error deleting challenge:", err)
    }
  }

  return (
    <div className="mb-8 bg-[#07073a] text-white min-h-screen p-6 rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#56ffbc] mb-2">Challenges</h2>
          <p className="text-gray-400">Manage and monitor your competition events</p>
        </div>
        <Button
          onClick={() => router.push("/admin/competitions/new")}
          className="bg-[#56ffbc] text-[#07073a] hover:bg-[#56ffbc]/90 transition-all duration-300 font-semibold shadow-lg shadow-[#56ffbc]/25"
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
              className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20 hover:border-[#56ffbc]/40 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-[#56ffbc]/10"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-[#56ffbc] mb-3">
                      {challenge.title}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 border ${
                        isExpired
                          ? "border-red-500 text-red-400"
                          : "border-[#56ffbc] text-[#56ffbc]"
                      }`}
                    >
                      {isExpired ? "Expired" : "Upcoming"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-4">
                  <div>
                    <span className="mr-2">Start:</span>
                    <span className="font-semibold text-[#56ffbc]">
                      {startDate.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="mr-2">Updated By:</span>
                    <span className="font-semibold text-[#56ffbc]">
                      {challenge.emailoflatestupdate}
                    </span>
                  </div>
                  <div>
                    <span className="mr-2">Last Update:</span>
                    <span className="font-semibold text-[#56ffbc]">
                      {updateDate?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="bg-[#56ffbc] text-black font-semibold hover:bg-[#42e0a8] transition-colors"
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
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold"
                        onClick={() => {
                          setChallengeToDelete(challenge.id)
                          setDeleteConfirmOpen(true)
                        }}
                      >
                        Delete
                      </Button>

                        {/* Delete Confirmation Dialog */}
                        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                          <DialogContent className="bg-[#0c0c4f] border-[#56ffbc]/30 text-white rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-red-400">Are you sure?</DialogTitle>
                              <DialogDescription className="text-gray-300">
                                This action will permanently delete the challenge. This cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setChallengeToDelete(null)
                                  setDeleteConfirmOpen(false)
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold"
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
                      </>
                    )}


                  <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="bg-[#0c0c4f] border-[#56ffbc]/30 text-white rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-[#56ffbc]">Editing Not Allowed</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          You can't edit this challenge because the competition has already started.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          className="bg-[#56ffbc] text-[#07073a] hover:bg-[#42e0a8] font-semibold"
                          onClick={() => setShowModal(false)}
                        >
                          Got it
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
