"use client"

import { useEffect, useState } from "react"

interface CountdownProps {
  targetDate: Date
}

export function Countdown({ targetDate }: CountdownProps) {
  const calculateTimeRemaining = () => {
    const now = new Date()
    const difference = targetDate.getTime() - now.getTime()

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

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 1000)

    // Clear interval on component unmount
    return () => clearInterval(timer)
  }, [targetDate])

  if (timeRemaining.expired) {
    return null // Competition has started or passed, no need to show countdown
  }

  const formatTime = (num: number) => String(num).padStart(2, "0")

  return (
    <div className="flex items-center justify-center gap-4 text-gray-800 font-semibold text-2xl md:text-3xl mt-6">
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold text-gray-900">{formatTime(timeRemaining.days)}</span>
        <span className="text-sm text-gray-500">Days</span>
      </div>
      <span className="text-gray-400">:</span>
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold text-gray-900">{formatTime(timeRemaining.hours)}</span>
        <span className="text-sm text-gray-500">Hours</span>
      </div>
      <span className="text-gray-400">:</span>
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold text-gray-900">{formatTime(timeRemaining.minutes)}</span>
        <span className="text-sm text-gray-500">Minutes</span>
      </div>
      <span className="text-gray-400">:</span>
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold text-gray-900">{formatTime(timeRemaining.seconds)}</span>
        <span className="text-sm text-gray-500">Seconds</span>
      </div>
    </div>
  )
}
