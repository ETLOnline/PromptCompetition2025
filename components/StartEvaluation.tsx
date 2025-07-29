"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Loader } from "lucide-react"

export default function StartEvaluationButton() {
  const [loading, setLoading] = useState(false)

  const handleStartEvaluation = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8080/bulk-evaluate/start-evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Evaluation failed")
      //alert("✅ Judge llm evaluation completed and uploaded to Firestore.")
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
      disabled={loading}
      className="w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold hover:from-gray-600 hover:to-gray-500 hover:shadow-md shadow-sm transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center justify-center">
        <div className="bg-gradient-to-r from-gray-600 to-gray-500 rounded-lg p-1 mr-2">
          {loading ? (
            <Loader className="h-4 w-4 text-white animate-spin" />
          ) : (
            <BarChart3 className="h-4 w-4 text-white" />
          )}
        </div>
        {loading ? "Evaluating..." : "Start Evaluation"}
      </div>
    </Button>
  )
}
