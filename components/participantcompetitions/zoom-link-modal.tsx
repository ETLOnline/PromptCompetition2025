"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Video } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ZoomLinkModalProps {
  isOpen: boolean
  onClose: () => void
  competitionId: string
}

export const ZoomLinkModal = ({
  isOpen,
  onClose,
  competitionId,
}: ZoomLinkModalProps) => {
  const { user } = useAuth()
  const [zoomLink, setZoomLink] = useState<string | null>(null)
  const [zoomLinkLoading, setZoomLinkLoading] = useState(false)

  useEffect(() => {
    const fetchZoomLink = async () => {
      if (!isOpen || !user?.id || !competitionId) return

      try {
        setZoomLinkLoading(true)
        const participantDocRef = doc(db, "competitions", competitionId, "participants", user.id)
        const participantDoc = await getDoc(participantDocRef)

        if (participantDoc.exists()) {
          const data = participantDoc.data()
          setZoomLink(data.zoomLink || null)
        }
      } catch (error) {
        console.error("Error fetching zoom link:", error)
        setZoomLink(null)
      } finally {
        setZoomLinkLoading(false)
      }
    }

    fetchZoomLink()
  }, [isOpen, user?.id, competitionId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="space-y-4 pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Meeting Information
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600 leading-relaxed">
            Access your competition meeting details below
          </DialogDescription>
        </DialogHeader>

        {/* Zoom Link Section */}
        <div className="space-y-3 py-4">
          {zoomLink && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <h4 className="text-sm font-semibold text-green-900">Competition Meeting</h4>
                  <p className="text-xs text-green-700 leading-relaxed">
                    Join the live competition session via Zoom
                  </p>
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
                    Join Zoom Meeting
                  </Button>
                </div>
              </div>
            </div>
          )}

          {zoomLinkLoading && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <p className="text-xs text-gray-600">Loading meeting details...</p>
              </div>
            </div>
          )}

          {!zoomLink && !zoomLinkLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-blue-900">No Meeting Scheduled</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    There is currently no meeting scheduled for this competition.
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