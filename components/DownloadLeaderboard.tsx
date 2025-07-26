"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getLeaderboardEntries } from "@/lib/firebase/leaderboard"

export default function DownloadLeaderboardButton() {
  const handleDownload = async () => {
    const entries = await getLeaderboardEntries()

    const csvContent = [
      ["Rank", "Full Name", "Email", "Score"],
      ...entries.map(e => [e.rank, e.fullName, e.email, e.totalScore])
    ]
    .map(row => row.join(","))
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
      className="w-full mt-3 bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/90 text-[#07073a] font-semibold hover:from-[#56ffbc]/90 hover:to-[#56ffbc]/80 shadow-lg shadow-[#56ffbc]/25 transition-all duration-300"
    >
      <Download className="h-4 w-4 mr-2" />
      Download Leaderboard
    </Button>
  )
}
