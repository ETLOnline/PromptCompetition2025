"use client"

import "@/lib/firebase"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ClipboardList, FolderOpen, Loader2, LogOut } from 'lucide-react'
import { getFirestore, doc, getDoc } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { useJudgeAssignments } from "@/hooks/useJudgeAssignments"
import { useAuth } from "@/components/auth-provider"

export default function JudgeDashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  // If not authenticated, redirect to home.
  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  const judgeId = user?.uid
  const { data, loading, error } = useJudgeAssignments(judgeId)

  const entries = useMemo(() => Object.entries(data ?? {}), [data])
  const hasAssignments = entries.length > 0

  // Load competition titles from /competitions/{competitionId}
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [titlesLoading, setTitlesLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchTitles() {
      if (entries.length === 0) {
        setTitles({})
        return
      }
      setTitlesLoading(true)
      try {
        const db = getFirestore()
        const result: Record<string, string> = {}
        await Promise.all(
          entries.map(async ([competitionId]) => {
            try {
              const snap = await getDoc(doc(db, "competitions", competitionId))
              const title =
                (snap.exists() ? (snap.data() as { title?: string })?.title : undefined) ?? competitionId
              result[competitionId] = title
            } catch {
              result[competitionId] = competitionId
            }
          })
        )
        if (!cancelled) setTitles(result)
      } finally {
        if (!cancelled) setTitlesLoading(false)
      }
    }
    fetchTitles()
    return () => {
      cancelled = true
    }
  }, [entries])

  // Show a small loading state while auth is resolving or data is fetching
  const isLoading = loading || !user

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Judge Dashboard</h1>
          <p className="text-muted-foreground">Competitions and challenges assigned to you</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            UID: {judgeId ?? "—"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Log out">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <Separator className="mb-6" />

      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" aria-hidden="true" />
          <span className="ml-2 text-sm text-muted-foreground">Loading your assignments…</span>
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

      {!isLoading && !error && !hasAssignments && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              You have no assigned competitions.
            </CardTitle>
            <CardDescription>Assignments will appear here when a competition admin assigns you.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && hasAssignments && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {entries.map(([competitionId, challengeIds]) => {
            const competitionTitle = titles[competitionId] ?? (titlesLoading ? "Loading…" : competitionId)
            return (
              <Card key={competitionId}>
                <CardHeader>
                  <CardTitle className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      <span className="font-semibold">{competitionTitle}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">ID: {competitionId}</span>
                  </CardTitle>
                  <CardDescription>
                    {challengeIds.length} assigned {challengeIds.length === 1 ? "challenge" : "challenges"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-end">
                  <Button asChild size="sm" variant="secondary">
                    <Link 
                      href={`/judge/competitions/${encodeURIComponent(competitionId)}`}
                      aria-label={`View challenges for competition ${competitionId}`}
                    >
                      View challenges
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
