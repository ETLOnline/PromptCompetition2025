// components/LlmEvaluation/ExpandableText.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ExpandableTextProps {
  text: string
  maxLength?: number
  className?: string
}

export function ExpandableText({ text, maxLength = 250, className = "" }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const needsTruncation = text.length > maxLength

  const displayText = isExpanded || !needsTruncation 
    ? text 
    : text.slice(0, maxLength) + "..."

  if (!needsTruncation) {
    return (
      <div className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${className}`}>
        {text}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {displayText}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-xs h-7 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        {isExpanded ? (
          <>
            Show Less
            <ChevronUp className="ml-1 w-3 h-3" />
          </>
        ) : (
          <>
            Read More
            <ChevronDown className="ml-1 w-3 h-3" />
          </>
        )}
      </Button>
    </div>
  )
}
