"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getAuth } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import {
  doc,
  setDoc,
  getDocs,
  Timestamp,
  collection
} from "firebase/firestore"
import { getDoc } from "firebase/firestore" // add this at the top

import { getFirestore, orderBy, limit, query } from "firebase/firestore"

async function getLatestCompetition() {
  const competitionsRef = collection(db, "competitions")
  const latestQuery = query(competitionsRef, orderBy("createdAt", "desc"), limit(1))
  const querySnapshot = await getDocs(latestQuery)
  if (querySnapshot.empty) return null
  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() }
}

export default function NewCompetitionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [maincompetition, setMainCompetition] = useState<string | null>(null)
  const [startDeadline, setStartDeadline] = useState<string | null>(null)
  const [endDeadline, setEndDeadline] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problemStatement: "",
    rubric: "",
    guidelines: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const latest = await getLatestCompetition()
      if (latest) {
        setMainCompetition(latest.id)

        const start = latest.startDeadline?.toDate?.() ?? new Date(latest.startDeadline)
        const end = latest.endDeadline?.toDate?.() ?? new Date(latest.endDeadline)

        setStartDeadline(start.toISOString().slice(0, 16))
        setEndDeadline(end.toISOString().slice(0, 16))
      }

      const user = await getAuth().currentUser?.getIdTokenResult()
      const role = user?.claims?.role || null
      setUserRole(role)
    }

    fetchData()
  }, [])

  const getLatestCustomID = async (): Promise<string> => {
    const CHALLENGE_COLLECTION = process.env.NEXT_PUBLIC_CHALLENGE_DATABASE
    if (!CHALLENGE_COLLECTION) throw new Error("Missing env: NEXT_PUBLIC_CHALLENGE_DATABASE")

    const querySnapshot = await getDocs(collection(db, CHALLENGE_COLLECTION))
    const ids: number[] = []
    querySnapshot.forEach((doc) => {
      const numericID = parseInt(doc.id, 10)
      if (!isNaN(numericID)) ids.push(numericID)
    })

    const nextID = ids.length === 0 ? 1 : Math.max(...ids) + 1
    return nextID.toString().padStart(2, "0")
  }


const uploadToFirestore = async () => {
  const CHALLENGE_COLLECTION = process.env.NEXT_PUBLIC_CHALLENGE_DATABASE
  if (!CHALLENGE_COLLECTION) throw new Error("Missing env: NEXT_PUBLIC_CHALLENGE_DATABASE")

  const ID = await getLatestCustomID()

  const auth = getAuth()
  const user = auth.currentUser

  if (!user) throw new Error("User not authenticated")

  const userUID = user.uid
  const userDocRef = doc(db, "users", userUID)
  const userDocSnap = await getDoc(userDocRef)  // ✅ FIXED HERE

  if (!userDocSnap.exists()) throw new Error("User document not found")

  const userData = userDocSnap.data()
  const email = userData.email ?? ""
  const fullName = userData.fullName ?? ""

  await setDoc(doc(db, CHALLENGE_COLLECTION, ID), {
    title: formData.title,
    problemStatement: formData.problemStatement,
    rubric: formData.rubric,
    guidelines: formData.guidelines,
    startDeadline: Timestamp.fromDate(new Date(startDeadline!)),
    endDeadline: Timestamp.fromDate(new Date(endDeadline!)),
    competitionid: maincompetition ?? "",
    emailoflatestupdate: email,
    nameoflatestupdate: fullName,
    lastupdatetime: Timestamp.now(),
  })
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await uploadToFirestore()

      toast({
        title: "Success",
        description: "Challenge created successfully!",
      })

      router.push("/admin")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive",
      })
      console.error("Create error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleDeadlineChange = (key: "start" | "end", value: string) => {
    if (key === "start") setStartDeadline(value)
    else setEndDeadline(value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" onClick={() => router.push("/admin")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Challenge</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
              <CardDescription>Fill in the details for the new Challenge. All fields are required.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Challenge Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter Challenge title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problemStatement">Problem Statement</Label>
                  <Textarea
                    id="problemStatement"
                    name="problemStatement"
                    value={formData.problemStatement}
                    onChange={handleChange}
                    placeholder="Detailed problem statement"
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rubric">Detailed Rubric</Label>
                  <Textarea
                    id="rubric"
                    name="rubric"
                    value={formData.rubric}
                    onChange={handleChange}
                    placeholder="Rubric for evaluation"
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guidelines">Submission Guidelines</Label>
                  <Textarea
                    id="guidelines"
                    name="guidelines"
                    value={formData.guidelines}
                    onChange={handleChange}
                    placeholder="Submission guidelines"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDeadline">Start Deadline</Label>
                  <Input
                    id="startDeadline"
                    type="datetime-local"
                    value={startDeadline ?? ""}
                    onChange={(e) => handleDeadlineChange("start", e.target.value)}
                    disabled={userRole !== "superadmin"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDeadline">End Deadline</Label>
                  <Input
                    id="endDeadline"
                    type="datetime-local"
                    value={endDeadline ?? ""}
                    onChange={(e) => handleDeadlineChange("end", e.target.value)}
                    disabled={userRole !== "superadmin"}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Challenge"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/admin")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}