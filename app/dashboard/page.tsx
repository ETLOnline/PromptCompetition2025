"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Trophy } from "lucide-react"
import { getSubmissionCountByParticipant } from "@/lib/firebase/getSubmissionCountByParticipant"
import { countDocuments } from "@/lib/firebase/countDocuments"
import ChallengeList from "@/components/ChallengeList"
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [submissions, setSubmissions] = useState<number | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const [startDeadlineReached, setStartDeadlineReached] = useState<boolean>(false)
  const [endDeadlinePassed, setEndDeadlinePassed] = useState<boolean>(false)
  const [checkingDeadline, setCheckingDeadline] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const fetchDeadlines = async () => {
      try {
        const competitionsRef = collection(db, "competitions")
        const latestQuery = query(competitionsRef, orderBy("createdAt", "desc"), limit(1))
        const snapshot = await getDocs(latestQuery)

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          const data = doc.data()

          const start = data.startDeadline?.toDate?.() ?? new Date(data.startDeadline)
          const end = data.endDeadline?.toDate?.() ?? new Date(data.endDeadline)

          const now = new Date()
          const extendedEnd = new Date(end.getTime() + 2 * 60 * 1000) // end + 2 minutes

          setStartDeadlineReached(now >= start)
          setEndDeadlinePassed(now > extendedEnd)
        }
      } catch (error) {
        console.error("Error fetching deadlines:", error)
      } finally {
        setCheckingDeadline(false)
      }
    }

    fetchDeadlines()

    if (user?.uid) {
      getSubmissionCountByParticipant(user.uid).then(setSubmissions)
    }

    countDocuments(process.env.NEXT_PUBLIC_CHALLENGE_DATABASE!).then(setCount)
  }, [user, router])

  if (!user || checkingDeadline) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.displayName}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={async () => {
                await logout()
                router.push("/")
              }}
              className="hover:bg-gray-100"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#d3fff1] to-[#56ffbc] rounded-t-lg flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Active Competitions</CardTitle>
              <Trophy className="h-4 w-4 text-gray-700" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <p className="text-xs text-gray-600">Available for submission</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#d3fff1] to-[#56ffbc] rounded-t-lg flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">My Submissions</CardTitle>
              <FileText className="h-4 w-4 text-gray-700" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-900">{submissions}</div>
              <p className="text-xs text-gray-600">Total submissions made</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#d3fff1] to-[#56ffbc] rounded-t-lg flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Total Score</CardTitle>
              <Trophy className="h-4 w-4 text-gray-700" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-900">
                {"Pending"}
              </div>
              <p className="text-xs text-gray-600">Across all submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Challenges */}
        <div className="container py-10">
          {startDeadlineReached && !endDeadlinePassed ? (
            <ChallengeList />
          ) : !startDeadlineReached ? (
            <p className="text-center text-gray-700 text-lg font-medium">
              Challenges will be available once the competition starts.
            </p>
          ) : (
            <p className="text-center text-gray-700 text-lg font-medium">
              The competition has ended. Challenges are no longer available.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
