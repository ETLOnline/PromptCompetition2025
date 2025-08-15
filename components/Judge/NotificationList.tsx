"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import type { Notification } from "@/types/judge-submission"

interface NotificationListProps {
  notifications: Notification[]
  removeNotification: (id: string) => void
}

export function NotificationList({ notifications, removeNotification }: NotificationListProps) {
  if (notifications.length === 0) return null

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getVariant = (type: Notification["type"]) => {
    switch (type) {
      case "error":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <Alert key={notification.id} variant={getVariant(notification.type)} className="pr-12">
          <div className="flex items-start gap-2">
            {getIcon(notification.type)}
            <AlertDescription className="flex-1">{notification.message}</AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => removeNotification(notification.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      ))}
    </div>
  )
}
