"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Loader, CheckCircle } from "lucide-react"

export default function GenerateLeaderboardButton() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => setSuccess(false), 5000)
      return () => clearTimeout(timeout)
    }
  }, [success])

  const handleGenerateLeaderboard = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      const res = await fetch("http://localhost:8080/leaderboard/generate", {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")

      setSuccess(true)
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleGenerateLeaderboard}
      disabled={loading || success}
      className="w-full py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-800"
    >
      {loading ? (
        <>
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : success ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
          Leaderboard generated!
        </>
      ) : (
        <>
          <Trophy className="h-4 w-4 mr-2" />
          Generate Leaderboard
        </>
      )}
    </Button>
  )
}
