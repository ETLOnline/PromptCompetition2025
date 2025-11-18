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
    mode: "online" as "online" | "offline",
    venue: "",
    systemPrompt: "", 
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [prizeMoneyError, setPrizeMoneyError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const validatePrizeMoney = (value: string): boolean => {
    // Allow only numbers and commas
    const regex = /^[0-9,]*$/
    return regex.test(value)
  }

  const handleFormChange = (field: string, value: string) => {
    if (field === "prizeMoney") {
      if (!validatePrizeMoney(value)) {
        setPrizeMoneyError("Only numbers and commas are allowed")
        return
      } else {
        setPrizeMoneyError(null)
      }
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormError(null)
    setTouched(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const { title, description, prizeMoney, startTime, endTime, mode, venue, systemPrompt } = formData

    if (!title || !description || !prizeMoney || !startTime || !endTime || !mode || !systemPrompt) {
      setFormError("All fields are required.")
      return
    }

    // NEW VALIDATION: Check venue for offline mode
    if (mode === "offline" && !venue.trim()) {
      setFormError("Venue location is required for offline competitions.")
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
      console.log("Prompt", systemPrompt)
      
      const createData: CreateCompetitionData = {
        title,
        description,
        prizeMoney,
        startDeadline: startDateTime.toISOString(),
        endDeadline: endDateTime.toISOString(),
        createdAt: new Date().toISOString(),
        mode: mode as "online" | "offline",
        venue: mode === "offline" ? venue : undefined,
        systemPrompt,
        ChallengeCount: 0
      }

      await onSubmit(createData)

      // Reset form on success
      setFormData({
        title: "",
        description: "",
        prizeMoney: "",
        startTime: "",
        endTime: "",
        systemPrompt: "",
        mode: "online",
        venue: ""
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
      systemPrompt: "",
      mode: "online",
      venue: ""
    })
    setFormError(null)
    setPrizeMoneyError(null)
    setTouched(false)
    onClose()
  }

  const handleAttemptClose = () => {
    if (!touched) {
      handleClose()
      return
    }
    // show confirmation
    setShowDiscardConfirm(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleAttemptClose() }}>
        <DialogContent
          className="bg-white border-0 shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            // Prevent Radix from closing automatically and handle attempt
            e.preventDefault()
            handleAttemptClose()
          }}
        >
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

              <div>
                <Label htmlFor="systemPrompt" className="text-sm font-medium text-gray-700 mb-2 block">
                  System Prompt
                </Label>
                <p className="text-s italic text-gray-600 mb-2">
                  Important: Do not include output format here. Re-writing it could cause errors.
                </p>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => handleFormChange("systemPrompt", e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 font-mono text-sm min-h-[300px] max-h-[500px] overflow-y-auto resize-y"
                  placeholder="write the base system instruction or system prompt here..."
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
                    className={`border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                      prizeMoneyError ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : ""
                    }`}
                    placeholder="e.g., PKR 5,000"
                  />
                  {prizeMoneyError && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {prizeMoneyError}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="mode" className="text-sm font-medium text-gray-700 mb-2 block">
                    Competition Mode
                  </Label>
                  <Select value={formData.mode} onValueChange={(value) => handleFormChange("mode", value)}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">🌐 Online</SelectItem>
                      <SelectItem value="offline">🏢 Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* NEW: Conditional Venue Field */}
              {formData.mode === "offline" && (
                <div className="animate-in fade-in-50 duration-200">
                  <Label htmlFor="venue" className="text-sm font-medium text-gray-700 mb-2 block">
                    Venue Location
                  </Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => handleFormChange("venue", e.target.value)}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="e.g., Convention Center, 123 Main St, City, Country"
                  />
                </div>
              )}

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
                onClick={() => {
                  // treat explicit cancel click as an attempt to close
                  handleAttemptClose()
                }}
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

      {/* Discard changes confirmation dialog */}
      <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">Discard Changes?</DialogTitle>
            <p className="text-base text-gray-600 mt-2">Are you sure you want to discard the entered data?</p>
          </DialogHeader>

          <DialogFooter className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowDiscardConfirm(false)} className="flex-1">
              Continue editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDiscardConfirm(false)
                handleClose()
              }}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}