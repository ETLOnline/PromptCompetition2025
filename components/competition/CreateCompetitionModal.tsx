"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, AlertCircle } from "lucide-react"
import type { CreateCompetitionData } from "../../types/competition"

interface CreateCompetitionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateCompetitionData) => Promise<void>
  loading?: boolean
}

export default function CreateCompetitionModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: CreateCompetitionModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prizeMoney: "",
    startTime: "",
    endTime: "",
    location: "online",
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormError(null)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const { title, description, prizeMoney, startTime, endTime, location } = formData

    if (!title || !description || !prizeMoney || !startTime || !endTime || !location) {
      setFormError("All fields are required.")
      return
    }

    const startDateTime = new Date(startTime)
    const endDateTime = new Date(endTime)

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setFormError("Invalid start or end date/time.")
      return
    }

    if (endDateTime <= startDateTime) {
      setFormError("End date and time must be after the start date and time.")
      return
    }

    // Additional validation: ensure start time is in the future
    const now = new Date()
    if (startDateTime <= now) {
      setFormError("Start date and time must be in the future.")
      return
    }

    try {
      const createData: CreateCompetitionData = {
        title,
        description,
        prizeMoney,
        startDeadline: startDateTime.toISOString(),
        endDeadline: endDateTime.toISOString(),
        createdAt: new Date().toISOString(),
        location,
        ChallengeCount: 0,
      }

      await onSubmit(createData)

      // Reset form on success
      setFormData({
        title: "",
        description: "",
        prizeMoney: "",
        startTime: "",
        endTime: "",
        location: "online",
      })
      onClose()
    } catch (error) {
      console.error("Error creating competition:", error)
      setFormError("Failed to create competition. Please try again.")
    }
  }

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      prizeMoney: "",
      startTime: "",
      endTime: "",
      location: "online",
    })
    setFormError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-0 shadow-2xl max-w-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">Create New Competition</DialogTitle>
              <p className="text-gray-600 text-sm">Set up a new competition for participants to join</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
                Competition Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                placeholder="e.g., AI Prompt Engineering Challenge 2024"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 min-h-[100px]"
                placeholder="Describe what this competition is about, its goals, and what participants can expect..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prizeMoney" className="text-sm font-medium text-gray-700 mb-2 block">
                  Prize Money
                </Label>
                <Input
                  id="prizeMoney"
                  value={formData.prizeMoney}
                  onChange={(e) => handleFormChange("prizeMoney", e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="e.g., $5,000"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-sm font-medium text-gray-700 mb-2 block">
                  Location
                </Label>
                <Select value={formData.location} onValueChange={(value) => handleFormChange("location", value)}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">🌐 Online</SelectItem>
                    <SelectItem value="offsite">🏢 Offsite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 mb-2 block">
                  Start Date & Time
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleFormChange("startTime", e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 mb-2 block">
                  End Date & Time
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleFormChange("endTime", e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{formError}</p>
            </div>
          )}

          <DialogFooter className="gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Creating..." : "Create Competition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
