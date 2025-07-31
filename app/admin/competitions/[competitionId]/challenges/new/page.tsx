"use client"

import type React from "react"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getAuth } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDocs, Timestamp, collection, getDoc } from "firebase/firestore"
import { orderBy, limit, query } from "firebase/firestore"

export default function NewCompetitionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const { toast } = useToast()

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
      const competitionDoc = await getDoc(doc(db, "competitions", competitionId))
      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        const start = data.startDeadline?.toDate?.() ?? new Date(data.startDeadline)
        const end = data.endDeadline?.toDate?.() ?? new Date(data.endDeadline)
        setStartDeadline(start.toISOString().slice(0, 16))
        setEndDeadline(end.toISOString().slice(0, 16))
      }

      const user = await getAuth().currentUser?.getIdTokenResult()
      const claims = user?.claims as { role?: string }
      const role = claims?.role ?? null
      setUserRole(role)

    }

    fetchData()
  }, [competitionId])

  const getLatestCustomID = async (competitionId: string): Promise<string> => {
    const querySnapshot = await getDocs(
      collection(db, "competitions", competitionId, "challenges")
    )
    const ids: number[] = []

    querySnapshot.forEach((doc) => {
      const numericID = Number.parseInt(doc.id, 10)
      if (!isNaN(numericID)) ids.push(numericID)
    })

    const nextID = ids.length === 0 ? 1 : Math.max(...ids) + 1
    return nextID.toString().padStart(2, "0")
  }

  const uploadToFirestore = async () => {
    const ID = await getLatestCustomID(competitionId)
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) throw new Error("User not authenticated")

    const userUID = user.uid
    const userDocRef = doc(db, "users", userUID)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) throw new Error("User document not found")

    const userData = userDocSnap.data()
    const email = userData.email ?? ""
    const fullName = userData.fullName ?? ""

    await setDoc(
      doc(db, "competitions", competitionId, "challenges", ID),
      {
        title: formData.title,
        problemStatement: formData.problemStatement,
        rubric: formData.rubric,
        guidelines: formData.guidelines,
        startDeadline: Timestamp.fromDate(new Date(startDeadline!)),
        endDeadline: Timestamp.fromDate(new Date(endDeadline!)),
        emailoflatestupdate: email,
        nameoflatestupdate: fullName,
        lastupdatetime: Timestamp.now(),
      }
    )
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
      router.push(`/admin/dashboard?competitionId=${competitionId}`)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-150">
      <header className="bg-gradient-to-r from-slate-100 to-slate-150 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full flex items-center py-6 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Challenge</h1>
            </div>
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push(`/admin/dashboard?competitionId=${competitionId}`)}
                className="mr-4 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-150 rounded-t-xl">
              <CardTitle className="text-xl font-bold text-gray-900">Challenge Details</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Fill in the details for the new Challenge. All fields are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Challenge Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter Challenge title"
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problemStatement" className="text-sm font-medium text-gray-700">
                    Problem Statement
                  </Label>
                  <Textarea
                    id="problemStatement"
                    name="problemStatement"
                    value={formData.problemStatement}
                    onChange={handleChange}
                    placeholder="Detailed problem statement"
                    rows={6}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200 resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rubric" className="text-sm font-medium text-gray-700">
                    Detailed Rubric
                  </Label>
                  <Textarea
                    id="rubric"
                    name="rubric"
                    value={formData.rubric}
                    onChange={handleChange}
                    placeholder="Rubric for evaluation"
                    rows={6}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200 resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guidelines" className="text-sm font-medium text-gray-700">
                    Submission Guidelines
                  </Label>
                  <Textarea
                    id="guidelines"
                    name="guidelines"
                    value={formData.guidelines}
                    onChange={handleChange}
                    placeholder="Submission guidelines"
                    rows={4}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDeadline" className="text-sm font-medium text-gray-700">
                      Start Deadline
                    </Label>
                    <Input
                      id="startDeadline"
                      type="datetime-local"
                      value={startDeadline ?? ""}
                      onChange={(e) => handleDeadlineChange("start", e.target.value)}
                      disabled={userRole !== "superadmin"}
                      className={`transition-all duration-200 ${
                        userRole !== "superadmin"
                          ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                      }`}
                      required
                    />
                    {userRole !== "superadmin" && (
                      <p className="text-xs text-amber-600 font-medium">Only superadmins can modify deadlines</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDeadline" className="text-sm font-medium text-gray-700">
                      End Deadline
                    </Label>
                    <Input
                      id="endDeadline"
                      type="datetime-local"
                      value={endDeadline ?? ""}
                      onChange={(e) => handleDeadlineChange("end", e.target.value)}
                      disabled={userRole !== "superadmin"}
                      className={`transition-all duration-200 ${
                        userRole !== "superadmin"
                          ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                      }`}
                      required
                    />
                    {userRole !== "superadmin" && (
                      <p className="text-xs text-amber-600 font-medium">Only superadmins can modify deadlines</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium px-6"
                  >
                    {loading ? "Creating..." : "Create Challenge"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/dashboard?competitionId=${competitionId}`)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 bg-transparent px-6"
                  >
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
