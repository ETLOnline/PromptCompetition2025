"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, X, Trophy, Calendar, MapPin, DollarSign, Settings, Clock, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function EditCompetitionPage() {
  const [isOver, setIsOver] = useState(false)
  const [showCompetitionEndedDialog, setShowCompetitionEndedDialog] = useState(false)
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
        const endDate = new Date(data.endDeadline)
        const now = new Date()
        setIsOver(now > endDate) // set competition status
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
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const toISOString = (value: string) => new Date(value).toISOString()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isOver) {
      setShowCompetitionEndedDialog(true) // Show the dialog instead of alert
      return
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Edit Competition
            </h1>
            <p className="text-lg text-muted-foreground">Update competition details and settings</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/edit-competitions")}
            className="gap-2 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Competitions
          </Button>
        </div>
        {/* Main Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Competition Details</CardTitle>
                <CardDescription className="text-base">
                  Update all editable fields below to modify the competition
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Competition Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Enter competition title"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      required
                      placeholder="Provide a detailed description of the competition"
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location *
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="Competition venue or location"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prizeMoney" className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Prize Money *
                    </Label>
                    <Input
                      id="prizeMoney"
                      name="prizeMoney"
                      value={formData.prizeMoney}
                      onChange={handleChange}
                      required
                      placeholder="Enter prize amount"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
              {/* Schedule Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Schedule</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDeadline" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Deadline *
                    </Label>
                    <Input
                      id="startDeadline"
                      name="startDeadline"
                      type="datetime-local"
                      value={formData.startDeadline}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDeadline" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      End Deadline *
                    </Label>
                    <Input
                      id="endDeadline"
                      name="endDeadline"
                      type="datetime-local"
                      value={formData.endDeadline}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
              {/* Settings Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Competition Settings</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleCheckboxChange("isActive", checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                        Active Competition
                      </Label>
                      <p className="text-xs text-muted-foreground">Enable this competition for public participation</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card">
                    <Checkbox
                      id="isLocked"
                      checked={formData.isLocked}
                      onCheckedChange={(checked) => handleCheckboxChange("isLocked", checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="isLocked" className="text-sm font-medium cursor-pointer">
                        Lock Competition
                      </Label>
                      <p className="text-xs text-muted-foreground">Prevent further modifications to this competition</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button type="submit" disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Saving Changes..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/edit-competitions")}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Competition Ended Dialog */}
      <Dialog open={showCompetitionEndedDialog} onOpenChange={setShowCompetitionEndedDialog}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mb-4">
              <Info className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900">Competition Ended</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-2">
              This competition has already ended and can no longer be edited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center pt-4">
            <Button onClick={() => setShowCompetitionEndedDialog(false)} className="w-full sm:w-auto">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
