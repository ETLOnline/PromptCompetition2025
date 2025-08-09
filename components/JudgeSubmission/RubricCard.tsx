"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Pin, PinOff } from "lucide-react"
import type { Challenge } from "../../types/judge-submission"

interface RubricCardProps {
    challenge: Challenge | null
    isPinned: boolean
    onTogglePin: () => void
    onClose: () => void
    className?: string
}

export function RubricCard({ challenge, isPinned, onTogglePin, onClose, className }: RubricCardProps) {
  if (!challenge?.rubric) return null

  return (
    <Card className={`${className} ${isPinned ? "sticky top-4" : "fixed top-4 right-4 z-50 w-80"} shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Scoring Rubric</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onTogglePin} className="h-8 w-8 p-0">
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit">
          Total: {challenge.rubric.totalPoints} points
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {challenge.rubric.criteria.map((criterion, index) => (
          <div key={index} className="border-l-2 border-primary/20 pl-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{criterion.name}</h4>
              <Badge variant="outline" className="text-xs">
                {criterion.maxPoints} pts
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{criterion.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
