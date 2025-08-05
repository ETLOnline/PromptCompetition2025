"use client"

import ViewLeaderboardTable from "@/components/ViewLeaderboard"
import { useParams } from "next/navigation"

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
            <h1 className="text-2xl font-semibold text-gray-900">Competition Leaderboard</h1>
          </div>
          <p className="text-gray-600">Track participant rankings and performance</p>
        </div>
        <ViewLeaderboardTable competitionId={competitionId} />
      </div>
    </div>
  )
}
