"use client"

import React from "react"
import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAdminCompetitionSubmissions } from "@/lib/api"
import { fetchWithAuth } from "@/lib/api"
import type { Submission } from "@/types/submissions"

interface CompetitionSubmissions {
  submissions: Submission[]
  totalCount: number
  competitionId: string
}

// --- API FUNCTIONS ---
export async function fetchCompetitionSubmissionsData(
  competitionId: string
): Promise<CompetitionSubmissions> {
  try {
    const data = await fetchAdminCompetitionSubmissions(competitionId)
    return data
  } catch (error) {
    console.error("Error fetching competition submissions:", error)
    throw error
  }
}

// --- PAGE COMPONENT ---
export default function SubmissionsPage() {
  const params = useParams()
  const competitionId = params?.competitionId as string
  const [competitionData, setCompetitionData] = useState<CompetitionSubmissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const authed = await checkAuth()
      if (authed) {
        await loadData(competitionId)
      }
    }
    init()
  }, [competitionId])

  const loadData = async (competitionId: string) => {
    try {
      setLoading(true)
      const data = await fetchCompetitionSubmissionsData(competitionId)
      setCompetitionData(data)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const checkAuth = async () => {
    try {
      await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`
      )
      return true
    } catch (error) {
      router.push("/")
      return false
    }
  }

  if (loading) return <SubmissionsLoading />
  if (error) return <SubmissionsError error={error} competitionId={competitionId} />
  if (!competitionData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with gradient accent */}
        <div className="mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Competition Submissions
                </h1>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                View and manage all participant submissions for this competition
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Section */}
        <div className="mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 p-1">
              <div className="bg-white rounded-xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Total Submissions Stat */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-blue-100 to-blue-150 border border-blue-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-700 mb-1">
                            {competitionData.totalCount}
                          </div>
                          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                            Total Submissions
                          </div>
                        </div>
                      </div>
                      <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transform origin-left animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Unique Participants Stat */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-150 border border-emerald-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-emerald-700 mb-1">
                            {new Set(competitionData.submissions.map(s => s.participantId)).size}
                          </div>
                          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                            Unique Participants
                          </div>
                        </div>
                      </div>
                      <div className="h-1 bg-emerald-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transform origin-left animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Submissions List */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">All Submissions</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white p-1">
              <div className="bg-white rounded-xl">
                {competitionData.submissions.length === 0 ? (
                  <EmptySubmissionsState />
                ) : (
                  <SubmissionsList submissions={competitionData.submissions} />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// --- SUBMISSIONS LIST COMPONENT ---
function SubmissionsList({ submissions }: { submissions: Submission[] }) {
  return (
    <div className="divide-y divide-gray-100">
      {submissions.map((submission, index) => (
        <div
          key={submission.id}
          className="p-6 hover:bg-gray-50/50 transition-colors duration-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    Challenge {submission.challengeId}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {submission.status || 'pending'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Submitted {new Date(submission.submissionTime).toLocaleString()}
                </div>
                {/* User Information */}
                {submission.user ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {(submission.user.fullName || submission.user.displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {submission.user.fullName || submission.user.displayName || 'Unknown User'}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {submission.user.email || 'No email provided'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1 truncate">
                          ID: {submission.participantId}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        ?
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          User ID: {submission.participantId}
                        </div>
                        <div className="text-xs text-gray-600">
                          User details not available
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {submission.promptText}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- EMPTY STATE COMPONENT ---
function EmptySubmissionsState() {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
      <p className="text-gray-500 max-w-md mx-auto">
        There are no submissions for this competition yet. Submissions will appear here once participants start submitting their solutions.
      </p>
    </div>
  )
}

// --- ENHANCED LOADING & ERROR COMPONENTS ---
function SubmissionsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading Header */}
        <div className="mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-2">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-8 w-64" />
              </div>
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
          </div>
        </div>

        {/* Loading Stats */}
        <div className="mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 p-1">
              <div className="bg-white rounded-xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="text-right space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-1 w-full rounded-full" />
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="text-right space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-1 w-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Loading Submissions Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <Skeleton className="w-6 h-6 rounded-lg" />
            <Skeleton className="h-6 w-48" />
            <div className="flex-1">
              <Skeleton className="h-px w-full" />
            </div>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-3 w-32" />
                        {/* User info skeleton */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SubmissionsError({ error, competitionId }: { error: any; competitionId: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden max-w-lg w-full">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-1">
          <div className="bg-white rounded-xl p-8">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Error Content */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-red-700 mb-2">
                    Failed to Load Submissions
                  </h3>
                  <p className="text-sm font-medium text-red-600 mb-4 leading-relaxed">
                    {error instanceof Error ? error.message : "An unexpected error occurred while loading the submission data."}
                  </p>
                  <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                      Competition ID
                    </div>
                    <div className="text-sm font-mono text-red-700 break-all">
                      {competitionId}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}