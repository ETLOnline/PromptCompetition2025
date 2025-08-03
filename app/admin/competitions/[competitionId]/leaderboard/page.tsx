"use client"

import ViewLeaderboardTable from "@/components/ViewLeaderboard"
import { useParams } from "next/navigation"
import { Suspense } from "react"

export default function AdminLeaderboardPage() {
  const params = useParams()
  const competitionId = params?.competitionId as string
  if (!competitionId) {
    return <div className="p-6 text-red-600 font-semibold">Error: Competition ID not found in the URL</div>
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Competition Leaderboard</h1>
          </div>
          <p className="text-gray-600">Track participant rankings and performance</p>
        </div>
          <ViewLeaderboardTable competitionId={competitionId} />
      </div>
    </div>
  )
}
