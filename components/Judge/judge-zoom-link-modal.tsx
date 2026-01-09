"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Video, Calendar, Users } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface JudgeZoomLinkModalProps {
  isOpen: boolean
  onClose: () => void
  competitionId: string
  judgeId: string
  batchAssignments: Array<{
    batchId: string
    schedule: {
      batchName: string
      startTime: Date
      endTime: Date
    }
    assignedParticipants: Array<{
      uid: string
      fullName: string
      email: string
    }>
  }>
}

export const JudgeZoomLinkModal = ({
  isOpen,
  onClose,
  competitionId,
  judgeId,
  batchAssignments,
}: JudgeZoomLinkModalProps) => {
  const [zoomLinks, setZoomLinks] = useState<Record<string, Record<string, string>>>({})
  const [zoomLinkLoading, setZoomLinkLoading] = useState(false)

  useEffect(() => {
    const fetchZoomLinks = async () => {
      if (!isOpen || !judgeId || !competitionId) return

      try {
        setZoomLinkLoading(true)
        const judgeDocRef = doc(db, "competitions", competitionId, "judges", judgeId)
        const judgeDoc = await getDoc(judgeDocRef)

        if (judgeDoc.exists()) {
          const data = judgeDoc.data()
          setZoomLinks(data.zoomLinks || {})
        }
      } catch (error) {
        console.error("Error fetching zoom links:", error)
        setZoomLinks({})
      } finally {
        setZoomLinkLoading(false)
      }
    }

    fetchZoomLinks()
  }, [isOpen, judgeId, competitionId])

  const getZoomLinkForParticipant = (batchId: string, participantId: string) => {
    return zoomLinks[batchId]?.[participantId] || null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white border-0 shadow-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="space-y-4 pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Judge Meeting Links
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600 leading-relaxed">
            Access meeting links for your assigned participants by batch
          </DialogDescription>
        </DialogHeader>

        {/* Zoom Links Section */}
        <div className="space-y-4 py-4">
          {zoomLinkLoading && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <p className="text-xs text-gray-600">Loading meeting links...</p>
              </div>
            </div>
          )}

          {!zoomLinkLoading && batchAssignments.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-blue-900">No Assignments</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    You have no participant assignments for this competition.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!zoomLinkLoading && batchAssignments.map((batch) => (
            <div key={batch.batchId} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Batch Header */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{batch.schedule.batchName}</h3>
                    <p className="text-xs text-gray-600">
                      {batch.schedule.startTime.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}, {batch.schedule.startTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })} - {batch.schedule.endTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="divide-y divide-gray-100">
                {batch.assignedParticipants.map((participant) => {
                  const zoomLink = getZoomLinkForParticipant(batch.batchId, participant.uid)
                  return (
                    <div key={participant.uid} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {participant.fullName
                              .split(" ")
                              .map((word) => word[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {participant.fullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {participant.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {zoomLink ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 h-auto"
                              onClick={() => {
                                const fullUrl = zoomLink.startsWith('http') ? zoomLink : `https://${zoomLink}`
                                window.open(fullUrl, '_blank')
                              }}
                            >
                              <Video className="h-3 w-3 mr-1.5" />
                              Join Meeting
                            </Button>
                          ) : (
                            <div className="text-xs text-gray-500 italic">
                              No link available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {!zoomLinkLoading && batchAssignments.length > 0 && Object.keys(zoomLinks).length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-amber-900">No Meeting Links</h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Meeting links have not been set up for your assigned participants yet.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}