"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Scale, FileText, CheckCircle2, ChevronUp, ChevronDown, Image as ImageIcon, Volume2, Target } from "lucide-react"
import { useState } from "react"
import type { Challenge } from "@/types/judge-submission"

interface ChallengeHeaderProps {
  challenge: Challenge | null
  isLoading: boolean
  progressStats: {
    totalAssigned: number
    graded: number
    remaining: number
    percentage: number
  }
}

export function ChallengeHeader({ challenge, isLoading, progressStats }: ChallengeHeaderProps) {
  const [isRubricExpanded, setIsRubricExpanded] = useState(false)
  const [isProblemExpanded, setIsProblemExpanded] = useState(true)
  const [isGuidelinesExpanded, setIsGuidelinesExpanded] = useState(false)
  const [isVisualCluesExpanded, setIsVisualCluesExpanded] = useState(false)

  const [previewImage, setPreviewImage] = useState<string | null>(null)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!challenge) return null

  const hasProblemContent = challenge.problemStatement || (challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0)
  const hasGuidelinesContent = challenge.guidelines || (challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0)
  const hasVisualClues = challenge.visualClueUrls && challenge.visualClueUrls.length > 0

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-2xl text-gray-900">{challenge.title}</CardTitle>
            </div>
            <div className="flex gap-2 ml-4">
              <Badge variant="outline" className="gap-1">
                <FileText className="w-3 h-3" />
                {progressStats.totalAssigned} submissions
              </Badge>
              <Badge
                variant={progressStats.graded === progressStats.totalAssigned ? "default" : "secondary"}
                className="gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                {progressStats.graded} graded
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Problem Statement Section */}
        {hasProblemContent && (
          <CardContent className="pt-0">
            <Collapsible open={isProblemExpanded} onOpenChange={setIsProblemExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-transparent">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    Problem Statement
                  </span>
                  {isProblemExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  {challenge.problemStatement && (
                    <div>
                      <p className="text-gray-700 leading-relaxed">{challenge.problemStatement}</p>
                    </div>
                  )}
                  
                  {challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0 && (
                    <div className="space-y-3">
                      {challenge.problemStatement && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-orange-600" />
                            Audio Instructions
                          </h4>
                        </div>
                      )}
                      {challenge.problemAudioUrls.map((audioUrl, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Audio {index + 1}
                          </div>
                          <audio controls className="w-full">
                            <source src={audioUrl} type="audio/mpeg" />
                            <source src={audioUrl} type="audio/wav" />
                            <source src={audioUrl} type="audio/ogg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}

        {/* Guidelines & Instructions Section */}
        {hasGuidelinesContent && (
          <CardContent className="pt-0">
            <Collapsible open={isGuidelinesExpanded} onOpenChange={setIsGuidelinesExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-transparent">
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    Guidelines & Instructions
                  </span>
                  {isGuidelinesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  {challenge.guidelines && (
                    <div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{challenge.guidelines}</p>
                    </div>
                  )}
                  
                  {challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0 && (
                    <div className="space-y-3">
                      {challenge.guidelines && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-orange-600" />
                            Audio Guidelines
                          </h4>
                        </div>
                      )}
                      {challenge.guidelinesAudioUrls.map((audioUrl, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Audio {index + 1}
                          </div>
                          <audio controls className="w-full">
                            <source src={audioUrl} type="audio/mpeg" />
                            <source src={audioUrl} type="audio/wav" />
                            <source src={audioUrl} type="audio/ogg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}

        {/* Visual Clues Section */}
        {hasVisualClues && (
          <CardContent className="pt-0">
            <Collapsible open={isVisualCluesExpanded} onOpenChange={setIsVisualCluesExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-transparent">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    Visual Clues ({challenge.visualClueUrls?.length || 0})
                  </span>
                  {isVisualCluesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                  {challenge.visualClueUrls?.map((imageUrl, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setPreviewImage(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Visual clue ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-2 text-xs text-gray-600 text-center">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}





        {/* Rubric Section */}
        {challenge.rubric.length > 0 && (
          <CardContent className="pt-0">
            <Collapsible open={isRubricExpanded} onOpenChange={setIsRubricExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-transparent">
                  <span className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Scoring Rubric ({challenge.rubric.length} criteria)
                  </span>
                  {isRubricExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid gap-4">
                  {challenge.rubric.map((criterion, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-semibold text-gray-900">{criterion.name}</h4>
                          <p className="text-sm text-gray-600">{criterion.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {(criterion.weight * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" 
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <ChevronUp className="w-8 h-8" />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg" 
            />
          </div>
        </div>
      )}
    </>
  )
}