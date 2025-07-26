// app/admin/leaderboard/page.tsx
"use client"

import ViewLeaderboardTable from "@/components/ViewLeaderboard"

export default function AdminLeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#07073a] text-white p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-[#56ffbc]">Leaderboard Overview</h1>
        <ViewLeaderboardTable />
      </div>
    </div>
  )
}
