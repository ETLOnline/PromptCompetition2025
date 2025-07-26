"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"

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
      className="w-full bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/90 text-[#07073a] font-semibold hover:from-[#56ffbc]/90 hover:to-[#56ffbc]/80 shadow-lg shadow-[#56ffbc]/25 transition-all duration-300"
    >
      <BarChart3 className="h-4 w-4 mr-2" />
      {loading ? "Evaluating..." : "Start Evaluation"}
    </Button>
  )
}
