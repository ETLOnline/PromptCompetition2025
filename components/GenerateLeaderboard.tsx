"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Loader } from "lucide-react"

export default function GenerateLeaderboardButton() {
  const [loading, setLoading] = useState(false)

  const handleGenerateLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8080/leaderboard/generate", {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")
      // You can trigger a toast/snackbar here instead of alert
      console.log("✅ Leaderboard generation completed.")
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleGenerateLeaderboard}
      disabled={loading}
      className="w-full mt-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold hover:from-gray-600 hover:to-gray-500 hover:shadow-md shadow-sm transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center justify-center">
        <div className="bg-gradient-to-r from-gray-600 to-gray-500 rounded-lg p-1 mr-2">
          {loading ? <Loader className="h-4 w-4 text-white animate-spin" /> : <Trophy className="h-4 w-4 text-white" />}
        </div>
        {loading ? "Generating..." : "Generate Leaderboard"}
      </div>
    </Button>
  )
}
