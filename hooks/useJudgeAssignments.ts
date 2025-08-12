"use client"

import { useEffect, useState } from "react"
import { getAssignedCompetitions, type AssignedMap } from "@/lib/judge/getAssignedCompetitions"

type State = {
  data: AssignedMap
  loading: boolean
  error: string | null
}

/**
 * React-friendly hook to load a judge's assignments.
 * - Input: judgeId
 * - Output: { data, loading, error }
 */
export function useJudgeAssignments(judgeId?: string): State {
  const [data, setData] = useState<AssignedMap>({})
  const [loading, setLoading] = useState<boolean>(!!judgeId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!judgeId) {
        setData({})
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const res = await getAssignedCompetitions(judgeId)
        if (!cancelled) {
          setData(res)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load assignments")
          setData({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [judgeId])

  return { data, loading, error }
}
