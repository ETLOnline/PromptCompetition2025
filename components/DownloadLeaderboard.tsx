"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getLeaderboardEntries } from "@/lib/firebase/leaderboard"

export default function DownloadLeaderboardButton() {
  const handleDownload = async () => {
    const { entries } = await getLeaderboardEntries()

    const csvContent = [
      ["Rank", "Full Name", "Email", "Score"],
      ...entries.map((e) => [e.rank, e.fullName, e.email, e.totalScore]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "leaderboard.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      size="lg"
      onClick={handleDownload}
      className="w-full mt-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold hover:from-gray-600 hover:to-gray-500 hover:shadow-md shadow-sm transition-all duration-200 rounded-lg"
    >
      <div className="flex items-center justify-center">
        <div className="bg-gradient-to-r from-gray-600 to-gray-500 rounded-lg p-1 mr-2">
          <Download className="h-4 w-4 text-white" />
        </div>
        Download Leaderboard
      </div>
    </Button>
  )
}
