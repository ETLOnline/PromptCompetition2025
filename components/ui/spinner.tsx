import { cn } from "@/lib/utils"

interface SpinnerProps {
  className?: string
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className={cn("relative inline-flex", className)} role="status">
      <svg
        className="animate-spin w-full h-full"
        style={{ animationDuration: "0.9s" }}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background ring (track) */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#E5E7EB"
          strokeWidth="3"
          className="opacity-25"
        />
        {/* Foreground spinner (moving arc) */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#0f172a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="62.83"
          strokeDashoffset="47"
          className="opacity-75"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
