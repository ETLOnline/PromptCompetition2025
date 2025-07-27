"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Settings } from "lucide-react"

// ---------------------- Firebase ----------------------
import { db } from "@/lib/firebase"
import { getDocs, Timestamp, collection } from "firebase/firestore"

type Challenge = {
  id: string
  title: string
  description: string
  problemStatement: string
  guidelines: string
  rubric: string
  deadline: Timestamp
}

export default function GetChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const CHALLENGE_COLLECTION = process.env.NEXT_PUBLIC_CHALLENGE_DATABASE
        if (!CHALLENGE_COLLECTION) {
          throw new Error("NEXT_PUBLIC_CHALLENGE_DATABASE is not defined in the environment")
        }

        const querySnapshot = await getDocs(collection(db, CHALLENGE_COLLECTION))
        const fetched: Challenge[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Challenge, "id">),
        }))
        setChallenges(fetched)
      } catch (error) {
        console.error("Error fetching challenges:", error)
      }
    }

    fetchChallenges()
  }, [])

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
          const deadlineDate = challenge.deadline.toDate()
          const isExpired = deadlineDate < new Date()

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
                    <CardDescription className="mt-2 text-gray-400">
                      {challenge.description}
                    </CardDescription>
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
                <div className="flex justify-between items-center mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                    <div>
                      <span className="mr-2">Deadline:</span>
                      <span className="font-semibold text-[#56ffbc]">
                        {deadlineDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="bg-[#56ffbc] text-black font-semibold hover:bg-[#42e0a8] transition-colors"
                    onClick={() => router.push(`/admin/competitions/${challenge.id}/edit`)}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
