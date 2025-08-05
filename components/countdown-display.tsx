import { useCountdown } from "@/hooks/useCountdown"
import { Clock } from "lucide-react"

interface CountdownDisplayProps {
  targetDate: number // Unix timestamp in milliseconds
}

export function CountdownDisplay({ targetDate }: CountdownDisplayProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate)

  if (isExpired) {
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
        {days > 0 && `${days}d `}
        {hours.toString().padStart(2, "0")}:
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </span>
    </div>
  )
}
