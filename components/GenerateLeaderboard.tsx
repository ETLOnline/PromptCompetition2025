"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"

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
      className="w-full mt-3 bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/90 text-[#07073a] font-semibold hover:from-[#56ffbc]/90 hover:to-[#56ffbc]/80 shadow-lg shadow-[#56ffbc]/25 transition-all duration-300"
    >
      <Trophy className="h-4 w-4 mr-2" />
      {loading ? "Generating..." : "Generate Leaderboard"}
    </Button>
  )
}
