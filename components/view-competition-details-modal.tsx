import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar, Eye, MapPin, DollarSign } from "lucide-react"
import { formatCompetitionDateTime } from "@/lib/format-competition-date-time"

interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  isActive?: boolean
  isLocked?: boolean
  location?: string
  prizeMoney?: string
}

interface ViewCompetitionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  competition: Competition | null
}

export const ViewCompetitionDetailsModal = ({ isOpen, onClose, competition }: ViewCompetitionDetailsModalProps) => {
  if (!competition) return null

  const formattedSchedule = formatCompetitionDateTime(competition.startDeadline, competition.endDeadline)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="bg-white border-0 shadow-2xl max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // prevent closing when clicking outside
          e.preventDefault()
        }}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold text-gray-900">Competition Details</DialogTitle>
              <p className="text-gray-600 text-sm">View complete information about this competition</p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 break-words leading-tight">
              {competition.title}
            </h3>
            <div className="bg-white rounded-md p-4 max-h-32 overflow-y-auto border">
              <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                {competition.description}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <Label className="text-base font-semibold text-blue-900">Schedule</Label>
              </div>
              <div className="space-y-2">
                <div className="text-base sm:text-lg font-bold text-gray-900 break-words">
                  {formattedSchedule.dateDisplay}
                </div>
                <div className="text-sm text-gray-600 break-words">{formattedSchedule.timeDisplay}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {competition.location && (
                <div className="bg-green-50 rounded-lg p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <Label className="text-base font-semibold text-green-900">Location</Label>
                  </div>
                  <div className="text-sm text-gray-900 capitalize font-medium break-words overflow-wrap-anywhere">
                    {competition.location}
                  </div>
                </div>
              )}
              {competition.prizeMoney && (
                <div className="bg-yellow-50 rounded-lg p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <Label className="text-base font-semibold text-yellow-900">Prize Money</Label>
                  </div>
                  <div className="text-sm text-gray-900 font-medium break-words overflow-wrap-anywhere">
                    {competition.prizeMoney}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-base font-semibold text-gray-900 mb-3 block">Status</Label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${competition.isActive ? "bg-green-400" : "bg-red-400"}`}></div>
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {competition.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${competition.isLocked ? "bg-gray-400" : "bg-green-400"}`}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {competition.isLocked ? "Locked" : "Unlocked"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}