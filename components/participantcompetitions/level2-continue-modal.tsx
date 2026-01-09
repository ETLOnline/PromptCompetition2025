"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Zap, Trophy, CheckCircle2, Video } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Level2ContinueModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  competitionTitle: string
  competitionId: string
  isLoading?: boolean
}

export const Level2ContinueModal = ({
  isOpen,
  onClose,
  competitionTitle,
  competitionId,
  onConfirm,
  isLoading = false,
}: Level2ContinueModalProps) => {
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
        {/* Header with gradient */}
        <DialogHeader className="space-y-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Continue Level 2 Competition
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-slate-600 leading-relaxed">
            You're about to continue your Level 2 competition journey for <span className="font-semibold text-slate-900">{competitionTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Info Section */}
        <div className="space-y-3 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Access to advanced challenges</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Direct evaluation by expert judges</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Compete for top prizes</span>
            </div>
          </div>

          {/* Zoom Link Section */}
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
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto order-1 sm:order-2 bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Continue Competition
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
