"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, limit, type Timestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Clock, ChevronRight, Sparkles, RefreshCw } from "lucide-react"

type Challenge = {
  id: string
  title: string
  deadline: Timestamp
  competitionid: string
}
type GetChallengesProps = {
  maincompetitionid: string
}

export default function ChallengeList({ maincompetitionid }: GetChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true)
      const CHALLENGE_COLLECTION = process.env.NEXT_PUBLIC_CHALLENGE_DATABASE
      if (!CHALLENGE_COLLECTION) {
        console.error("Environment variable NEXT_PUBLIC_CHALLENGE_DATABASE is not defined.")
        setLoading(false)
        return
      }

      try {
        console.log("Main Competition ID:", maincompetitionid)

        // 2. Directly fetch challenges nested under that competition
        const challengesRef = collection(db, "competitions", maincompetitionid, "challenges")
        const challengeSnapshot = await getDocs(challengesRef)
        const data = challengeSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Challenge, "id">),
        }))
        setChallenges(data)
      } catch (error) {
        console.error("Error fetching challenges:", error)
        setChallenges([]) // Ensure challenges array is empty on error
      } finally {
        setLoading(false)
      }
    }
    fetchChallenges()
  }, [])

  const formatDeadline = (timestamp: Timestamp) => {
    const dateObj = timestamp?.toDate()
    if (!dateObj) return "N/A"
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
            <RefreshCw className="h-10 w-10 text-slate-500 animate-spin" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Loading Challenges
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Fetching the latest challenges for this competition...
          </p>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      {challenges.length === 0 ? (
        <div className="text-center py-16 space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
              <Target className="h-10 w-10 text-slate-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              No Challenges Available
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              There are no challenges listed for this competition yet. Please check back later.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {challenges.map((challenge) => (
            <Card
              key={challenge.id}
              className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0 overflow-hidden"
            >
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-1">
                      {challenge.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Starts: {formatDeadline(challenge.startDeadline)} &nbsp;|&nbsp; 
                        Ends: {formatDeadline(challenge.endDeadline)}
                      </span>
                    </CardDescription>

                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex justify-end">
                <Button
                  onClick={() => maincompetitionid && router.push(`/participants/competitions/${maincompetitionid}/${challenge.id}`)}
                  className="bg-[#10142c] text-white gap-2 px-6 py-3 h-12 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-semibold"
                >
                  Participate
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
