"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Challenge = {
  id: string
  title: string
  deadline: Timestamp
  competitionid: string
}

export default function ChallengeList() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [competitionId, setCompetitionId] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchChallenges = async () => {
      const CHALLENGE_COLLECTION = process.env.NEXT_PUBLIC_CHALLENGE_DATABASE
      if (!CHALLENGE_COLLECTION) {
        throw new Error("Environment variable NEXT_PUBLIC_CHALLENGE_DATABASE is not defined.")
      }

      // 1. Get latest competition ID
      const competitionsRef = collection(db, "competitions")
      const latestQuery = query(competitionsRef, orderBy("createdAt", "desc"), limit(1))
      const snapshot = await getDocs(latestQuery)

      if (snapshot.empty) {
        console.warn("No competitions found.")
        return
      }

      const maincompetitionid = snapshot.docs[0].id
      setCompetitionId(maincompetitionid)


      // 2. Directly fetch challenges nested under that competition
      const challengesRef = collection(db, "competitions", maincompetitionid, "challenges")
      const challengeSnapshot = await getDocs(challengesRef)

      const data = challengeSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Challenge, "id">),
      }))

      setChallenges(data)
    }

    fetchChallenges()
  }, [])

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Challenges</h2>
      <div className="grid gap-6">
        {challenges.map((challenge) => (
          <Card key={challenge.id} className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">{challenge.title}</CardTitle>
              <CardDescription className="mt-1 text-gray-700">
                Deadline: {challenge.deadline?.toDate().toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                  onClick={() => competitionId && router.push(`/competition/${competitionId}/${challenge.id}`)}
                  className="bg-[#56ffbc] text-gray-900 hover:bg-[#45e0a6]"
                >
                  Participate
                </Button>

            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
