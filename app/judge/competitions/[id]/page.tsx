"use client"

import "@/lib/firebase"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { AlertTriangle, Loader2, ListChecks, LogOut, ChevronLeft } from 'lucide-react'
import { getFirestore, doc, getDoc } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { useAuth } from "@/components/auth-provider"
import { useJudgeAssignments } from "@/hooks/useJudgeAssignments"

export default function CompetitionChallengesPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { id: competitionId } = useParams<{ id: string }>()

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  const judgeId = user?.uid
  const { data, loading, error } = useJudgeAssignments(judgeId)

  // Get assigned challenge IDs for this competition
  const assignedChallengeIds = useMemo<string[] | undefined>(() => {
    if (!data) return undefined
    return data[competitionId]
  }, [data, competitionId])

  // Load challenge titles from /competitions/{competitionId}/challenges/{challengeId}
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [titlesLoading, setTitlesLoading] = useState(false)
  const [titlesError, setTitlesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchTitles() {
      setTitlesError(null)
      if (!assignedChallengeIds || assignedChallengeIds.length === 0) {
        setTitles({})
        return
      }
      setTitlesLoading(true)
      try {
        const db = getFirestore()
        const result: Record<string, string> = {}

        await Promise.all(
          assignedChallengeIds.map(async (challengeId) => {
            try {
              const snap = await getDoc(doc(db, "competitions", competitionId, "challenges", challengeId))
              const title =
                (snap.exists() ? (snap.data() as { title?: string })?.title : undefined) ?? challengeId
              result[challengeId] = title
            } catch {
              result[challengeId] = challengeId
            }
          })
        )

        if (!cancelled) setTitles(result)
      } catch (e: any) {
        if (!cancelled) setTitlesError(e?.message ?? "Failed to load challenge titles")
      } finally {
        if (!cancelled) setTitlesLoading(false)
      }
    }

    fetchTitles()
    return () => {
      cancelled = true
    }
  }, [assignedChallengeIds, competitionId])

  const isAuthResolving = !user
  const isAssignmentsLoading = loading || isAuthResolving
  const isLoading = isAssignmentsLoading || titlesLoading

  const notAssignedToCompetition = !isAssignmentsLoading && assignedChallengeIds === undefined
  const noChallengesAssigned =
    !isAssignmentsLoading && assignedChallengeIds !== undefined && assignedChallengeIds.length === 0

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <header className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Assigned Challenges</h1>
            <p className="text-sm text-muted-foreground">
              Competition ID: <span className="font-mono">{competitionId}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {judgeId && (
            <Badge variant="secondary" className="text-xs">
              UID: {judgeId}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Log out">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <Separator className="mb-6" />

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading challenges…</span>
        </div>
      )}

      {!isLoading && error && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to load assignments</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && notAssignedToCompetition && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              You are not assigned to this competition.
            </CardTitle>
            <CardDescription>
              If you believe this is a mistake, contact the competition organizer.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && noChallengesAssigned && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              {"\u274C"} {"No challenges assigned to you for this competition."}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && assignedChallengeIds && assignedChallengeIds.length > 0 && (
        <div className="space-y-4">
          {titlesError && (
            <Card className="border-amber-300">
              <CardHeader>
                <CardTitle className="text-amber-700">Some titles could not be loaded</CardTitle>
                <CardDescription>{titlesError}</CardDescription>
              </CardHeader>
            </Card>
          )}

          <ul className="space-y-3">
            {assignedChallengeIds.map((challengeId) => {
              const title = titles[challengeId] ?? challengeId
              const href = `/judge/competitions/${encodeURIComponent(competitionId)}/submissions/${encodeURIComponent(challengeId)}`
              return (
                <li key={challengeId} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium">
                      {"Challenge "}
                      <span className="font-mono">{challengeId}</span> {" – "} {title}
                    </span>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={href} aria-label={`Open challenge ${challengeId}`}>
                      Open
                    </Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </main>
  )
}
