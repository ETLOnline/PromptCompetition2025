"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, AlertTriangle, RotateCcw, Zap } from "lucide-react"
import type { Challenge, User, Submission } from "@/types/judging"

import { resetDistributionForCompetition } from "@/lib/judgingApi" // adjust path as needed
import { distributeJudges } from '@/lib/challengeAssignment'


interface DistributionTableProps {
  competitionId: string
  challenges: Challenge[]
  judges: User[]
  submissionsByChallenge: Record<string, Submission[]>
  loading: boolean
  prefillAssignments?: Record<string, Record<string, number>> // judgeId -> challengeId -> assigned submission count
  disableEqual?: boolean
}

export default function DistributionTable({
  competitionId,
  challenges,
  judges,
  submissionsByChallenge,
  loading,
  prefillAssignments,
  disableEqual,
}: DistributionTableProps) {
  // State to hold assignments counts: challengeId -> judgeId -> number (0 or 1)
  const [assignments, setAssignments] = useState<Record<string, Record<string, number>>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  // Initialize assignments based on prefillAssignments
  useEffect(() => {
    const initial: Record<string, Record<string, number>> = {}

    challenges.forEach((challenge) => {
      initial[challenge.id] = {}
      judges.forEach((judge) => {
        initial[challenge.id][judge.id] = 0
      })
    })

    if (prefillAssignments) {
      judges.forEach((judge) => {
        const assignedChallenges = prefillAssignments[judge.id] || {}
        Object.entries(assignedChallenges).forEach(([challengeId, assignedCount]) => {
          if (initial[challengeId] && initial[challengeId][judge.id] !== undefined) {
            initial[challengeId][judge.id] = assignedCount
          }
        })
      })
    }



    setAssignments(initial)
  }, [challenges, judges, prefillAssignments])

  // Calculate totals and errors
  const calculations = useMemo(() => {
    const challengeTotals: Record<string, number> = {}
    const judgeTotals: Record<string, number> = {}
    const errors: Record<string, string> = {}

    challenges.forEach((challenge) => {
      challengeTotals[challenge.id] = 0
      judges.forEach((judge) => {
        const count = assignments[challenge.id]?.[judge.id] || 0
        challengeTotals[challenge.id] += count
        judgeTotals[judge.id] = (judgeTotals[judge.id] || 0) + count
      })

      const available = submissionsByChallenge[challenge.id]?.length || 0
      const assigned = challengeTotals[challenge.id]

      if (assigned > available) {
        errors[challenge.id] = `Assigned ${assigned} but only ${available} submissions available`
      }
    })

    const totalAssigned = Object.values(challengeTotals).reduce((sum, count) => sum + count, 0)
    const totalAvailable = Object.values(submissionsByChallenge).reduce((sum, subs) => sum + subs.length, 0)

    return {
      challengeTotals,
      judgeTotals,
      errors,
      totalAssigned,
      totalAvailable,
      isValid: Object.keys(errors).length === 0 && totalAssigned <= totalAvailable,
    }
  }, [assignments, challenges, judges, submissionsByChallenge])

  // Equal distribution handler calling backend
  const handleEqualDistribute = async () => {
    if (isProcessing) return

    setIsProcessing(true)

    try {
      // Define topParticipants — you may get this from props or state as needed.
      // For now, let's assume all participants are "top participants" (can be refined).
      // Collect all participant IDs from submissions:
      const allParticipantsSet = new Set<string>()
      Object.values(submissionsByChallenge).forEach(submissions => {
        submissions.forEach(sub => allParticipantsSet.add(sub.participantId))
      })
      const topParticipants = Array.from(allParticipantsSet)

      // Call distributeJudges with required parameters
      const distributionResult = await distributeJudges({
        competitionId,
        challenges,
        submissionsByChallenge,
        judges,
        topParticipants,
        marginPercentage: 20, // optional, default is 20%
      })

      // distributionResult.assignments contains assignments made by distributeJudges
      // Now update the local assignments state to reflect this

      // assignments: Record<challengeId, Record<judgeId, number>>
      // We need to build this from distributionResult.assignments array

      const newAssignments: Record<string, Record<string, number>> = {}

      // Initialize all to 0 first
      challenges.forEach(challenge => {
        newAssignments[challenge.id] = {}
        judges.forEach(judge => {
          newAssignments[challenge.id][judge.id] = 0
        })
      })

      // Fill in assigned counts (for your UI)
      distributionResult.assignments.forEach(assignment => {
        if (!newAssignments[assignment.challengeId]) return
        newAssignments[assignment.challengeId][assignment.judgeId] = assignment.submissionCount
      })


      setAssignments(newAssignments)

    } catch (error) {
      console.error("Equal distribution failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }
  // Reset distribution handler calling backend
  const handleResetDistribution = async () => {
    if (isProcessing) return

    setIsProcessing(true)
    try {
      await resetDistributionForCompetition(competitionId, judges, challenges)
      setAssignments({})
    } catch (error) {
      console.error("Reset distribution failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Early return for empty data
  if (challenges.length === 0 || judges.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {challenges.length === 0 ? "No challenges available" : "No judges available"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Judge Distribution</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {calculations.totalAssigned} / {calculations.totalAvailable} assigned
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleEqualDistribute}
                disabled={loading || disableEqual || isProcessing}
                variant="default"
                className="flex items-center gap-2"
                title={disableEqual ? "Existing distribution detected for this competition" : undefined}
              >
                {(loading || isProcessing) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Equal Distribution
              </Button>

              <Button
                onClick={handleResetDistribution}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                disabled={loading || isProcessing}
              >
                <RotateCcw className="h-4 w-4" />
                Reset Distribution
              </Button>
            </div>

            {disableEqual && (
              <Badge variant="secondary" className="mt-2">
                Existing distribution detected
              </Badge>
            )}

            {Object.keys(calculations.errors).length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {Object.entries(calculations.errors).map(([challengeId, error]) => {
                      const challenge = challenges.find((c) => c.id === challengeId)
                      return (
                        <div key={challengeId}>
                          <strong>C{challenges.indexOf(challenge!) + 1}</strong>: {error}
                        </div>
                      )
                    })}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Distribution Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Challenge</th>
                    {judges.map((judge, index) => (
                      <th key={judge.id} className="text-center p-4 font-medium min-w-[120px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <div className="font-medium">J{index + 1}</div>
                              <div className="text-xs text-muted-foreground font-normal truncate max-w-[100px]">
                                {judge.fullName}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-center">
                              <div className="font-medium">{judge.fullName}</div>
                              <div className="text-xs text-muted-foreground">{judge.email}</div>
                              <div className="text-xs mt-1">
                                Total: {calculations.judgeTotals[judge.id] || 0} submissions
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </th>
                    ))}
                    <th className="text-center p-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((challenge, challengeIndex) => {
                    const available = submissionsByChallenge[challenge.id]?.length || 0
                    const assigned = calculations.challengeTotals[challenge.id] || 0
                    const hasError = calculations.errors[challenge.id]

                    return (
                      <tr key={challenge.id} className="border-b hover:bg-muted/25">
                        <td className="p-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <div className="font-medium">C{challengeIndex + 1}</div>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {available} submissions
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <div>
                                <div className="font-medium">{challenge.title}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {available} submissions available
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        {judges.map((judge) => (
                          <td key={judge.id} className="p-4 text-center">
                            <Input
                              type="number"
                              min={0}
                              max={available}
                              value={assignments[challenge.id]?.[judge.id] || 0}
                              disabled // manual editing disabled
                              className="w-16 text-center mx-auto"
                            />
                          </td>
                        ))}
                        <td className="p-4 text-center">
                          <Badge
                            variant={hasError ? "destructive" : assigned === available ? "default" : "secondary"}
                            className="min-w-[60px]"
                          >
                            {assigned} / {available}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/50 font-medium">
                    <td className="p-4">Judge Totals</td>
                    {judges.map((judge) => (
                      <td key={judge.id} className="p-4 text-center">
                        <Badge variant="outline">{calculations.judgeTotals[judge.id] || 0}</Badge>
                      </td>
                    ))}
                    <td className="p-4 text-center">
                      <Badge variant={calculations.isValid ? "default" : "destructive"}>
                        {calculations.totalAssigned}
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{calculations.totalAssigned}</div>
              <p className="text-xs text-muted-foreground">Total Assignments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{calculations.totalAvailable}</div>
              <p className="text-xs text-muted-foreground">Available Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {calculations.totalAvailable > 0
                  ? Math.round((calculations.totalAssigned / calculations.totalAvailable) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Coverage</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
