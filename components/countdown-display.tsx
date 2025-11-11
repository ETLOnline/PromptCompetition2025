"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface CountdownDisplayProps {
  targetDate: Date // Now expecting a Date object
  onExpire?: () => void // Optional callback when timer expires
}

export function CountdownDisplay({ targetDate, onExpire }: CountdownDisplayProps) {
  // console.log("CountdownDisplay rendered with targetDate:", targetDate) // <-- Add this
  const [hasExpired, setHasExpired] = useState(false)

  const calculateTimeRemaining = () => {
    const now = new Date().getTime()
    const difference = targetDate.getTime() - now

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, expired: false }
  }

  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining())

  // Reset hasExpired when targetDate changes
  useEffect(() => {
    const initialTime = calculateTimeRemaining()
    setHasExpired(initialTime.expired) // Set to true if already expired on mount
  }, [targetDate])

  useEffect(() => {
    // console.log("CountdownDisplay mounted") // <-- Logs only once on mount
    const timer = setInterval(() => {
      const newTime = calculateTimeRemaining()
      setTimeRemaining(newTime)
      
      // Call onExpire callback only once when timer transitions to expired
      if (newTime.expired && !hasExpired && onExpire) {
        setHasExpired(true)
        onExpire()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate, onExpire, hasExpired])

  if (timeRemaining.expired) {
    return (
      <span className="text-red-600 font-medium text-sm flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
        <Clock className="h-4 w-4" />
        Ended
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-800 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <Clock className="h-4 w-4 text-gray-500" />
      <span className="font-mono tracking-tight">
        {timeRemaining.days > 0 && `${timeRemaining.days}d `}
        {String(timeRemaining.hours).padStart(2, "0")}:
        {String(timeRemaining.minutes).padStart(2, "0")}:
        {String(timeRemaining.seconds).padStart(2, "0")}
      </span>
    </div>
  )
}
