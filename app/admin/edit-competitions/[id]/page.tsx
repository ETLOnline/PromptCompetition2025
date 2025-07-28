"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getDoc, doc, updateDoc } from "firebase/firestore"
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
    startDeadline: "",
    endDeadline: "",
    location: "",
    prizeMoney: "",
    isActive: false,
    isLocked: false,
    createdAt: "",
  })

  // Convert ISO string with Z to datetime-local compatible string
  const formatForDatetimeLocal = (isoString: string) => {
    if (!isoString) return ""
    const date = new Date(isoString)
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)
    return localDate.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
  }

  useEffect(() => {
    const fetchCompetition = async () => {
      const docRef = doc(db, "competitions", competitionId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setFormData({
          title: data.title || "",
          description: data.description || "",
          startDeadline: formatForDatetimeLocal(data.startDeadline || ""),
          endDeadline: formatForDatetimeLocal(data.endDeadline || ""),
          location: data.location || "",
          prizeMoney: data.prizeMoney || "",
          isActive: data.isActive ?? false,
          isLocked: data.isLocked ?? false,
          createdAt: formatForDatetimeLocal(data.createdAt || ""),
        })
      }
    }

    if (competitionId) fetchCompetition()
  }, [competitionId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const toISOString = (value: string) => new Date(value).toISOString()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateDoc(doc(db, "competitions", competitionId), {
        ...formData,
        startDeadline: toISOString(formData.startDeadline),
        endDeadline: toISOString(formData.endDeadline),
        createdAt: toISOString(formData.createdAt),
      })
      router.push("/admin/edit-competitions")
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
            <Button variant="ghost" onClick={() => router.push("/admin/edit-competitions")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Competitions
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
              <CardDescription>Update all editable fields below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDeadline">Start Deadline</Label>
                  <Input
                    id="startDeadline"
                    name="startDeadline"
                    type="datetime-local"
                    value={formData.startDeadline}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDeadline">End Deadline</Label>
                  <Input
                    id="endDeadline"
                    name="endDeadline"
                    type="datetime-local"
                    value={formData.endDeadline}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" value={formData.location} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prizeMoney">Prize Money</Label>
                  <Input id="prizeMoney" name="prizeMoney" value={formData.prizeMoney} onChange={handleChange} required />
                </div>

                <div className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-5 w-5 rounded-md border border-gray-300 bg-white text-[#56ffbc] focus:ring-2 focus:ring-[#56ffbc] transition duration-150"
                />
                <Label htmlFor="isActive" className="text-gray-700">Is Active</Label>
                </div>


                <div className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    id="isLocked"
                    name="isLocked"
                    checked={formData.isLocked}
                    onChange={handleChange}
                    className="h-5 w-5 rounded-md border border-gray-300 bg-white text-[#56ffbc] focus:ring-2 focus:ring-[#56ffbc] transition duration-150"
                />
                <Label htmlFor="isLocked" className="text-gray-700">Is Locked</Label>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/admin/edit-competitions")}>
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