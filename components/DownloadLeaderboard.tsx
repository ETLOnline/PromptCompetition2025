"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader, CheckCircle } from "lucide-react"
import { getLeaderboardEntries } from "@/lib/firebase/leaderboard"

type DownloadLeaderboardButtonProps = {
  competitionId: string
}

export default function DownloadLeaderboardButton({ competitionId }: DownloadLeaderboardButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => setSuccess(false), 5000)
      return () => clearTimeout(timeout)
    }
  }, [success])

  const handleDownload = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      const { entries } = await getLeaderboardEntries(competitionId)

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

      setSuccess(true)
    } catch (error) {
      alert("❌ Failed to download leaderboard.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleDownload}
      disabled={loading || success}
      className="w-full py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-800"
    >
      {loading ? (
        <>
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : success ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
          Leaderboard downloaded!
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download Leaderboard
        </>
      )}
    </Button>
  )
}
