"use client"

import { useEffect, useState } from "react"
import { getLeaderboardEntries } from "@/lib/firebase/leaderboard"

export default function ViewLeaderboardTable() {
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    getLeaderboardEntries().then(setEntries)
  }, [])

  return (
    <div className="bg-white text-black rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🏆 Leaderboard</h2>
      <table className="w-full text-left border">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3">Rank</th>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={entry.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{entry.rank}</td>
              <td className="p-3">{entry.fullName}</td>
              <td className="p-3">{entry.email}</td>
              <td className="p-3">{entry.totalScore.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
