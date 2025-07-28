"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getDoc, doc, updateDoc, Timestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"

export default function EditCompetitionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.id as string

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problemStatement: "",
    rubric: "",
    guidelines: "",
  })

  useEffect(() => {
    const fetchCompetition = async () => {
      const docRef = doc(db, process.env.NEXT_PUBLIC_CHALLENGE_DATABASE!, competitionId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setFormData({
          title: data.title || "",
          description: data.description || "",
          problemStatement: data.problemStatement || "",
          rubric: data.rubric || "",
          guidelines: data.guidelines || "",
        })
      }
    }

    if (competitionId) fetchCompetition()
  }, [competitionId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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

      await updateDoc(doc(db, process.env.NEXT_PUBLIC_CHALLENGE_DATABASE!, competitionId), {
        ...formData,
        emailoflatestupdate: email,
        nameoflatestupdate: fullName,
        lastupdatetime: Timestamp.now(),
      })

      router.push("/admin")
    } catch (error) {
      console.error("Error updating competition:", error)
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Competition</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle>Competition Details</CardTitle>
              <CardDescription>Update the competition details below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Competition Title</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problemStatement">Problem Statement</Label>
                  <Textarea
                    id="problemStatement"
                    name="problemStatement"
                    value={formData.problemStatement}
                    onChange={handleChange}
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
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
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
