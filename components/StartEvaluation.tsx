"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Loader, CheckCircle } from "lucide-react"

export default function StartEvaluationButton({ competitionId }: { competitionId: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => {
        setSuccess(false)
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [success])

  const handleStartEvaluation = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/start-evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId }), 
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Evaluation failed")
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
      onClick={handleStartEvaluation}
      disabled={loading || success}
      className="w-full py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-800"
    >
      {loading ? (
        <>
          <Loader className="h-4 w-4 mr-2 animate-spin" />
          Evaluating...
        </>
      ) : success ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
          Evaluation completed!
        </>
      ) : (
        <>
          <BarChart3 className="h-4 w-4 mr-2" />
          Start Evaluation
        </>
      )}
    </Button>
  )
}
