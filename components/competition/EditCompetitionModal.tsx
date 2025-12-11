//EditCompetitionModal.tsx
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Edit, Save, X, Info, Trash2, AlertCircle } from "lucide-react"
import type { Competition, EditCompetitionData } from "@/types/competition"

interface EditCompetitionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EditCompetitionData) => Promise<void>
  onDelete: () => void
  competition: Competition | null
  loading?: boolean
  deleteLoading?: boolean
}

export default function EditCompetitionModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  competition,
  loading = false,
  deleteLoading = false,
}: EditCompetitionModalProps) {
  const [editFormData, setEditFormData] = useState<EditCompetitionData>({
    title: "",
    description: "",
    startDeadline: "",
    endDeadline: "",
    mode: "online" as "online" | "offline",          // CHANGED from 'location: ""'
    venue: "",         // NEW FIELD
    level: "Level 1" as "Level 1" | "Level 2" | "custom",  // NEW FIELD
    prizeMoney: "",
    isActive: false,
    isLocked: false,
    isFeatured: false,
    systemPrompt: "",
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [touched, setTouched] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [editFormError, setEditFormError] = useState<string | null>(null)
  const [prizeMoneyError, setPrizeMoneyError] = useState<string | null>(null)

  const formatForDatetimeLocal = (utcIsoString: string): string => {
    if (!utcIsoString) return ""

    const utcDate = new Date(utcIsoString)
    const year = utcDate.getFullYear()
    const month = String(utcDate.getMonth() + 1).padStart(2, "0")
    const day = String(utcDate.getDate()).padStart(2, "0")
    const hours = String(utcDate.getHours()).padStart(2, "0")
    const minutes = String(utcDate.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const validatePrizeMoney = (value: string): boolean => {
    // Allow only numbers and commas
    const regex = /^[0-9,]*$/
    return regex.test(value)
  }

  useEffect(() => {
    if (competition && isOpen) {
      setEditFormData({
        title: competition.title || "",
        description: competition.description || "",
        startDeadline: formatForDatetimeLocal(competition.startDeadline || ""),
        endDeadline: formatForDatetimeLocal(competition.endDeadline || ""),
        mode: (competition.mode as "online" | "offline") || "online",  // CHANGED - with fallback for old data
        venue: competition.venue || "",                              // NEW FIELD
        level: (competition.level as "Level 1" | "Level 2" | "custom") || "Level 1",  // NEW FIELD
        prizeMoney: competition.prizeMoney || "",
        isActive: competition.isActive ?? false,
        isLocked: competition.isLocked ?? false,
        isFeatured: competition.isFeatured ?? false,
        systemPrompt: competition.systemPrompt || "",
      })
    }
  }, [competition, isOpen])

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    console.log(e)

    if (name === "prizeMoney") {
      if (!validatePrizeMoney(value)) {
        setPrizeMoneyError("Only numbers and commas are allowed")
        return
      } else {
        setPrizeMoneyError(null)
      }
    }

    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    setTouched(true)

    // Clear error when user starts typing
    setEditFormError(null)
  }

  const handleEditCheckboxChange = (name: string, checked: boolean) => {
    setEditFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))

    // Clear error when user changes checkbox
    setEditFormError(null)
    setPrizeMoneyError(null)
    setTouched(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditFormError(null)

    if (!competition) return

    // NEW VALIDATION: Check venue for offline mode
    if (editFormData.mode === "offline" && !editFormData.venue?.trim()) {
      setEditFormError("Venue location is required for offline competitions.")
      return
    }

    // Validate the new dates from the form
    const newStartDateTime = new Date(editFormData.startDeadline || "")
    const newEndDateTime = new Date(editFormData.endDeadline || "")

    if (isNaN(newStartDateTime.getTime()) || isNaN(newEndDateTime.getTime())) {
      setEditFormError("Invalid start or end date/time.")
      return
    }

    if (newEndDateTime <= newStartDateTime) {
      setEditFormError("End date and time must be after the start date and time.")
      return
    }

    try {
      const submitData: EditCompetitionData = {
        ...editFormData,
        startDeadline: newStartDateTime.toISOString(),
        endDeadline: newEndDateTime.toISOString(),
        venue: editFormData.mode === "offline" ? editFormData.venue : undefined,  // NEW: Clear venue if online
      }

      await onSubmit(submitData)
      onClose()
    } catch (error) {
      console.error("Error updating competition:", error)
      setEditFormError("Failed to update competition. Please try again.")
    }
  }

  const handleDeleteCompetition = async () => {
    try {
      await onDelete()
      setShowDeleteDialog(false)
      onClose()
    } catch (error) {
      console.error("Error deleting competition:", error)
    }
  }

  const handleCloseAttempt = () => {
    if (!touched) {
      onClose()
      return
    }
    setShowDiscardConfirm(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseAttempt() }}>
        <DialogContent
          className="bg-white border-0 shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            e.preventDefault()
            handleCloseAttempt()
          }}
        >
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">Edit Competition</DialogTitle>
                <p className="text-gray-600 text-sm">Update competition details and settings</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Info className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700 mb-2 block">
                    Competition Title
                  </Label>
                  <Input
                    id="edit-title"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditFormChange}
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700 mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    rows={4}
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-level" className="text-sm font-medium text-gray-700 mb-2 block">
                    Competition Level
                  </Label>
                  <select
                    id="edit-level"
                    name="level"
                    value={editFormData.level || "Level 1"}
                    onChange={(e) => {
                      const value = e.target.value as "Level 1" | "Level 2" | "custom"
                      setEditFormData(prev => ({ ...prev, level: value }))
                      setTouched(true)
                      setEditFormError(null)
                    }}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="custom">custom</option>
                  </select>
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
                    name="systemPrompt"  
                    value={editFormData.systemPrompt}
                    onChange={handleEditFormChange}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 font-mono text-sm min-h-[300px] max-h-[500px] overflow-y-auto resize-y"
                    placeholder="write the base system instruction or system prompt here..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-mode" className="text-sm font-medium text-gray-700 mb-2 block">
                      Competition Mode
                    </Label>
                    <select
                      id="edit-mode"
                      name="mode"
                      value={editFormData.mode}
                      onChange={(e) => {
                        const value = e.target.value as "online" | "offline"
                        setEditFormData(prev => ({ ...prev, mode: value }))
                        setTouched(true)
                        setEditFormError(null)
                        // Clear venue if switching to online
                        if (value === "online") {
                          setEditFormData(prev => ({ ...prev, venue: "" }))
                        }
                      }}
                      required
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="online">🌐 Online</option>
                      <option value="offline">🏢 Offline</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="edit-prizeMoney" className="text-sm font-medium text-gray-700 mb-2 block">
                      Prize Money
                    </Label>
                    <Input
                      id="edit-prizeMoney"
                      name="prizeMoney"
                      value={editFormData.prizeMoney}
                      onChange={handleEditFormChange}
                      required
                      className={`border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                        prizeMoneyError ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : ""
                      }`}
                    />
                    {prizeMoneyError && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {prizeMoneyError}
                      </p>
                    )}
                  </div>
                </div>

                {/* NEW: Conditional Venue Field */}
                {editFormData.mode === "offline" && (
                  <div className="animate-in fade-in-50 duration-200">
                    <Label htmlFor="edit-venue" className="text-sm font-medium text-gray-700 mb-2 block">
                      Venue Location
                    </Label>
                    <Input
                      id="edit-venue"
                      name="venue"
                      value={editFormData.venue}
                      onChange={handleEditFormChange}
                      required
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      placeholder="e.g., Convention Center, 123 Main St, City, Country"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Info className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Schedule</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDeadline" className="text-sm font-medium text-gray-700 mb-2 block">
                    Start Date & Time
                  </Label>
                  <Input
                    id="edit-startDeadline"
                    name="startDeadline"
                    type="datetime-local"
                    value={editFormData.startDeadline}
                    onChange={handleEditFormChange}
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-endDeadline" className="text-sm font-medium text-gray-700 mb-2 block">
                    End Date & Time
                  </Label>
                  <Input
                    id="edit-endDeadline"
                    name="endDeadline"
                    type="datetime-local"
                    value={editFormData.endDeadline}
                    onChange={handleEditFormChange}
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Info className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Competition Settings</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card">
                  <Checkbox
                    id="edit-isActive"
                    checked={editFormData.isActive}
                    onCheckedChange={(checked) => handleEditCheckboxChange("isActive", checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="edit-isActive" className="text-sm font-medium cursor-pointer">
                      Active Competition
                    </Label>
                    <p className="text-xs text-gray-600">Enable this competition for public participation</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card">
                  <Checkbox
                    id="edit-isLocked"
                    checked={editFormData.isLocked}
                    onCheckedChange={(checked) => handleEditCheckboxChange("isLocked", checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="edit-isLocked" className="text-sm font-medium cursor-pointer">
                      Lock Competition
                    </Label>
                    <p className="text-xs text-gray-600">Prevent further modifications to this competition</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card">
                  <Checkbox
                    id="edit-isFeatured"
                    checked={editFormData.isFeatured}
                    onCheckedChange={(checked) => handleEditCheckboxChange("isFeatured", checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="edit-isFeatured" className="text-sm font-medium cursor-pointer">
                      Featured Competition
                    </Label>
                    <p className="text-xs text-gray-600">Mark this competition as featured</p>
                  </div>
                </div>
              </div>
            </div>

            {editFormError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{editFormError}</p>
              </div>
            )}

            <DialogFooter className="gap-3 pt-6 border-t">
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Competition
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCloseAttempt()}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gray-900 hover:bg-gray-800 text-white border-0"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
        {/* Discard confirmation */}
        <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
          <DialogContent className="sm:max-w-[425px] p-6">
            <DialogHeader className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                <Info className="w-8 h-8" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">Discard Changes?</DialogTitle>
              <p className="text-base text-gray-600 mt-2">Are you sure you want to discard the changes you made?</p>
            </DialogHeader>

            <DialogFooter className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDiscardConfirm(false)} className="flex-1">
                Continue editing
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDiscardConfirm(false)
                  setTouched(false)
                  onClose()
                }}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Discard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[380px] p-5">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="p-2.5 rounded-full bg-red-100 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">Delete Competition</DialogTitle>
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete this competition? This action cannot be undone and all associated data
              will be permanently removed.
            </p>
          </DialogHeader>

          <DialogFooter className="flex gap-3 pt-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteLoading}
              className="flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCompetition}
              disabled={deleteLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-sm"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
