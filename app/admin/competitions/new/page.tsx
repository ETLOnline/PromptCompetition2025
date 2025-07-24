"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// -------------------------------- firebase --------------------------------
import { db } from "@/firebase"
import { doc, setDoc, getDocs, Timestamp, collection } from "firebase/firestore"

export default function NewCompetitionPage() {
  // const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problemStatement: "",
    rubric: "",
    guidelines: "",
    deadline: "",
  })

const getLatestCustomID = async () => {
  const querySnapshot = await getDocs(collection(db, "testing"))

  const ids: number[] = []

  querySnapshot.forEach((doc) => {
    const id = doc.id
    const numericID = parseInt(id, 10)
    if (!isNaN(numericID)) {
      ids.push(numericID)
    }
  })

    if (ids.length === 0) return "01"

    const maxID = Math.max(...ids)
    const nextID = (maxID + 1).toString()

    return nextID // e.g., "04" if "03" was the latest
  }

  const uploadToFirestore = async () => {
    let ID = await getLatestCustomID();

    await setDoc(doc(db, "testing", ID), {
        title: formData.title,
        problemStatement: formData.problemStatement,
        rubric: formData.rubric,
        guidelines: formData.guidelines,
        deadline: Timestamp.fromDate(new Date(formData.deadline)),
      })
  }

  // useEffect(() => {
  //   if (!user) {
  //     router.push("/auth/login")
  //     return
  //   }
  // }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Competition created successfully!",
        })
        router.push("/admin")
      } else {
        throw new Error("Failed to create competition")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create competition. Please try again.",
        variant: "destructive",
      })
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

  // if (!user || user.role !== "admin") return null

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
                    placeholder="Detailed problem statement that participants will work on"
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
                    placeholder="Detailed rubric for LLM-based evaluation"
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
                    placeholder="Submission guideline highlights for this challenge"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Submission Deadline</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} onClick={uploadToFirestore}>
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
