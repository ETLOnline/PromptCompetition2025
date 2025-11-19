import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FileText, Target, Eye, Send, Headphones, Image as ImageIcon, X } from "lucide-react"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Challenge {
  id: string
  title: string
  description?: string
  problemStatement: string
  guidelines: string
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls?: string[]
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
  const [previewImage, setPreviewImage] = useState<string | null>(null)

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
            
            {/* Problem Statement Text */}
            {challenge.problemStatement && (
              <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border mb-4">
                <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                  {challenge.problemStatement}
                </p>
              </div>
            )}
            
            {/* Problem Audio Files */}
            {challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {/* <Headphones className="w-4 h-4 text-blue-600 flex-shrink-0" /> */}
                  {/* <Label className="text-sm font-medium text-blue-800">Problem Audio ({challenge.problemAudioUrls.length})</Label> */}
                </div>
                <div className="space-y-3">
                  {challenge.problemAudioUrls.map((url, index) => (
                    <div key={index} className="bg-white rounded-md p-3 border">
                      <div className="text-sm text-gray-700 mb-2 font-medium">Audio {index + 1}</div>
                      <audio controls src={url} className="w-full h-8" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-600 flex-shrink-0" />
              <Label className="text-base font-semibold text-green-900">Guidelines</Label>
            </div>
            
            {/* Guidelines Text */}
            {challenge.guidelines && (
              <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border mb-4">
                <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                  {challenge.guidelines}
                </p>
              </div>
            )}
            
            {/* Guidelines Audio Files */}
            {challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {/* <Headphones className="w-4 h-4 text-green-600 flex-shrink-0" /> */}
                  {/* <Label className="text-sm font-medium text-green-800">Guidelines Audio ({challenge.guidelinesAudioUrls.length})</Label> */}
                </div>
                <div className="space-y-3">
                  {challenge.guidelinesAudioUrls.map((url, index) => (
                    <div key={index} className="bg-white rounded-md p-3 border">
                      <div className="text-sm text-gray-700 mb-2 font-medium">Audio {index + 1}</div>
                      <audio controls src={url} className="w-full h-8" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visual Clues */}
          {challenge.visualClueUrls && challenge.visualClueUrls.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <Label className="text-base font-semibold text-amber-900">Visual Clues ({challenge.visualClueUrls.length})</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {challenge.visualClueUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className="relative group cursor-pointer"
                    onClick={() => setPreviewImage(url)}
                  >
                    <div className="aspect-square overflow-hidden rounded-md border border-amber-200">
                      <img 
                        src={url} 
                        alt={`Visual clue ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-md flex items-center justify-center transition-all">
                      <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </Dialog>
  )
}