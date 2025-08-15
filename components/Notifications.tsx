import type { Notification } from "@/types/judge-submission"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, X } from "lucide-react"

interface NotificationsProps {
  notifications: Notification[]
  removeNotification: (id: string) => void
}

export function Notifications({ notifications, removeNotification }: NotificationsProps) {
  if (notifications.length === 0) return null

  const renderNotification = (notification: Notification) => {
    const icons = {
      success: CheckCircle2,
      error: AlertCircle,
      warning: AlertCircle,
      info: AlertCircle,
    }
    const colors = {
      success: "bg-emerald-50 border-emerald-200 text-emerald-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-amber-50 border-amber-200 text-amber-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    }
    const Icon = icons[notification.type]

    return (
      <div key={notification.id} className={`flex items-start gap-3 p-4 rounded-lg border ${colors[notification.type]} shadow-lg`} role="alert">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeNotification(notification.id)}
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">{notifications.map(renderNotification)}</div>
}
