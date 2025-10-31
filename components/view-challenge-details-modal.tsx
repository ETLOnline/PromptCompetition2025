import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FileText, Target, Eye, Send } from "lucide-react"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Challenge {
  id: string
  title: string
  description?: string
  problemStatement: string
  guidelines: string
  difficulty?: string
  points?: number
  timeLimit?: number
}

interface ViewChallengeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  challenge: Challenge | null
  competitionId: string
  participantId: string
}

export const ViewChallengeDetailsModal = ({ 
  isOpen, 
  onClose, 
  challenge, 
  competitionId, 
  participantId 
}: ViewChallengeDetailsModalProps) => {
  const [userSubmission, setUserSubmission] = useState<string>("")
  const [loadingSubmission, setLoadingSubmission] = useState(false)

  useEffect(() => {
    if (isOpen && challenge) {
      fetchUserSubmission()
    } else {
      setUserSubmission("")
    }
  }, [isOpen, challenge])

  const fetchUserSubmission = async () => {
    if (!challenge) return
    
    try {
      setLoadingSubmission(true)
      const submissionId = `${participantId}_${challenge.id}`
      const submissionRef = doc(db, "competitions", competitionId, "submissions", submissionId)
      const submissionSnap = await getDoc(submissionRef)
      
      if (submissionSnap.exists()) {
        const submissionData = submissionSnap.data()
        setUserSubmission(submissionData.promptText || "No submission text found")
      } else {
        setUserSubmission("No submission found")
      }
    } catch (error) {
      console.error("Error fetching user submission:", error)
      setUserSubmission("Error loading submission")
    } finally {
      setLoadingSubmission(false)
    }
  }

  if (!challenge) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="bg-white border-0 shadow-2xl max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold text-gray-900">Challenge Details</DialogTitle>
              <p className="text-gray-600 text-sm">View complete information about this challenge</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Challenge Title and Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 break-words leading-tight">
              {challenge.title}
            </h3>
            {challenge.description && (
              <div className="bg-white rounded-md p-4 max-h-32 overflow-y-auto border">
                <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                  {challenge.description}
                </p>
              </div>
            )}
          </div>

          {/* Problem Statement */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <Label className="text-base font-semibold text-blue-900">Problem Statement</Label>
            </div>
            <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border">
              <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                {challenge.problemStatement}
              </p>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-600 flex-shrink-0" />
              <Label className="text-base font-semibold text-green-900">Guidelines</Label>
            </div>
            <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border">
              <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                {challenge.guidelines}
              </p>
            </div>
          </div>

          {/* User Submission */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <Label className="text-base font-semibold text-purple-900">Your Submission</Label>
            </div>
            <div className="bg-white rounded-md p-4 max-h-64 overflow-y-auto border">
              {loadingSubmission ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap font-mono">
                  {userSubmission}
                </p>
              )}
            </div>
            {!loadingSubmission && userSubmission && userSubmission !== "No submission found" && userSubmission !== "Error loading submission" && (
              <div className="mt-2 text-xs text-purple-700 bg-purple-100 px-3 py-1 rounded-full inline-block">
                Characters: {userSubmission.length} | Words: {userSubmission.split(/\s+/).filter(Boolean).length}
              </div>
            )}
          </div>

          {/* Challenge Metadata */}
          {(challenge.difficulty || challenge.points || challenge.timeLimit) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-base font-semibold text-gray-900 mb-3 block">Challenge Info</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {challenge.difficulty && (
                  <div className="bg-white rounded-md p-3 border">
                    <p className="text-xs text-gray-600 mb-1">Difficulty</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{challenge.difficulty}</p>
                  </div>
                )}
                {challenge.points && (
                  <div className="bg-white rounded-md p-3 border">
                    <p className="text-xs text-gray-600 mb-1">Points</p>
                    <p className="text-sm font-medium text-gray-900">{challenge.points}</p>
                  </div>
                )}
                {challenge.timeLimit && (
                  <div className="bg-white rounded-md p-3 border">
                    <p className="text-xs text-gray-600 mb-1">Time Limit</p>
                    <p className="text-sm font-medium text-gray-900">{challenge.timeLimit} min</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}