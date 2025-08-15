"use client"

import { useState, useCallback } from "react"
import type { Notification } from "@/types/judge-submission"

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])

    const addNotification = useCallback((type: Notification["type"], message: string, timeout = 5000) => {
        const id = Date.now().toString()
        const notification: Notification = {
        id,
        type,
        message,
        timestamp: new Date().toISOString(),
        autoDismiss: timeout > 0,
        timeout,
        }

        setNotifications((prev) => [...prev, notification])

        if (timeout > 0) {
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id))
        }, timeout)
        }

        return id
    }, [])

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, [])

    const clearAllNotifications = useCallback(() => {
        setNotifications([])
    }, [])

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
  }
}
