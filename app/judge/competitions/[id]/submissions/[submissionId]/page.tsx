"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChevronLeft, Loader2, AlertTriangle, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/components/auth-provider"
import { useSubmissionData } from "@/hooks/useSubmissionData"
import { SubmissionAccordionItem } from "@/components/JudgeSubmission/SubmissionAccordionItem"
import { RubricCard } from "@/components/JudgeSubmission/RubricCard"
import type { Submission } from "@/types/judge-submission"

export default function JudgeSubmissionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params.id as string
  const challengeId = params.submissionId as string
  const { user, logout } = useAuth()
  
  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  const { loading, error, challenge, submissions, refetch } = useSubmissionData(competitionId, challengeId, user.uid)

  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set())
  const [showRubric, setShowRubric] = useState(false)
  const [rubricPinned, setRubricPinned] = useState(false)
  const [problemStatementExpanded, setProblemStatementExpanded] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")


  const filteredSubmissions = useMemo(() => {
    if (filterStatus === "all") return submissions
    return submissions.filter((sub) => sub.status === filterStatus)
  }, [submissions, filterStatus])

  const progress = useMemo(() => {
    const total = submissions.length
    const evaluated = submissions.filter((sub) => sub.status === "evaluated").length
    return { total, evaluated, percentage: total > 0 ? Math.round((evaluated / total) * 100) : 0 }
  }, [submissions])

  function toggleSubmission(submissionId: string) {
    setExpandedSubmissions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
  }

  function handleSubmissionUpdate(updatedSubmission: Submission) {
    refetch()
  }

  function jumpToSubmission(submissionId: string) {
    setExpandedSubmissions(new Set([submissionId]))
    document.getElementById(`submission-${submissionId}`)?.scrollIntoView({ behavior: "smooth" })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{challenge?.title ?? `Challenge ${challengeId}`}</h1>
              <p className="text-sm text-muted-foreground">
                Competition: <span className="font-mono">{competitionId}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Progress: {progress.evaluated}/{progress.total} ({progress.percentage}%)
              </Badge>
              <Badge variant="outline">Judge: {user.uid}</Badge>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Problem Statement */}
            {challenge?.problemStatement && (
              <Card>
                <Collapsible open={problemStatementExpanded} onOpenChange={setProblemStatementExpanded}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Problem Statement</CardTitle>
                        {problemStatementExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{challenge.problemStatement}</p>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Submissions</SelectItem>
                    <SelectItem value="selected_for_manual_review">Pending Review</SelectItem>
                    <SelectItem value="evaluated">Evaluated</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setShowRubric(!showRubric)}>
                  {showRubric ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showRubric ? "Hide" : "Show"} Rubric
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select onValueChange={jumpToSubmission}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Jump to submission..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubmissions.map((submission) => (
                      <SelectItem key={submission.id} value={submission.id}>
                        Participant {submission.participantId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading submissions...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Failed to load submissions
                  </CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={refetch}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Submissions Accordion */}
            {!loading && !error && (
              <div className="space-y-4">
                {filteredSubmissions.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No submissions found for the selected filter.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <div key={submission.id} id={`submission-${submission.id}`}>
                      <SubmissionAccordionItem
                        submission={submission}
                        competitionId={competitionId}
                        judgeId={user.uid}
                        isExpanded={expandedSubmissions.has(submission.id)}
                        onToggle={() => toggleSubmission(submission.id)}
                        onUpdate={handleSubmissionUpdate}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Evaluation Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completed</span>
                      <span>
                        {progress.evaluated}/{progress.total}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{progress.percentage}% complete</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setExpandedSubmissions(new Set(filteredSubmissions.map((s) => s.id)))}
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setExpandedSubmissions(new Set())}
                  >
                    Collapse All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setFilterStatus("selected_for_manual_review")}
                  >
                    Show Pending Only
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Rubric Card */}
      {showRubric && (
        <RubricCard
          challenge={challenge}
          isPinned={rubricPinned}
          onTogglePin={() => setRubricPinned(!rubricPinned)}
          onClose={() => setShowRubric(false)}
          className={rubricPinned ? "lg:col-span-1" : ""}
        />
      )}
    </div>
  )
}
