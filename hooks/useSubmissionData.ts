"use client"

import { useState, useEffect, useCallback } from "react"
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import type { Challenge, Submission } from "@/types/judge-submission"

export function useSubmissionData(competitionId: string, challengeId: string, judgeId: string) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [submissions, setSubmissions] = useState<Submission[]>([])

    const fetchData = useCallback(async () => {
        if (!competitionId || !challengeId || !judgeId) return
        
        setLoading(true)
        setError(null)

        try {
        const db = getFirestore()

        // 1. Fetch judge's assigned submissions
        const judgeRef = doc(db, "competitions", competitionId, "challenges", challengeId, "judges", judgeId)
        const judgeSnap = await getDoc(judgeRef)

        if (!judgeSnap.exists()) {
            setError("Judge not found")
            return
        }

        const judgeData = judgeSnap.data()
        const assignedSubmissionIds = judgeData?.assignedSubmissions || []

        if (assignedSubmissionIds.length === 0) {
            setChallenge(null)
            setSubmissions([])
            return
        }
        
        
        // 2. Fetch challenge data
        const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
        const challengeSnap = await getDoc(challengeRef)

        if (challengeSnap.exists()) {
            const challengeData = { id: challengeId, ...challengeSnap.data() } as Challenge
            setChallenge(challengeData)
        }
        
        // 3. Fetch submissions data for assigned submissions
        const submissionsRef = collection(db, "competitions", competitionId, "submissions")

        // Get all docs from the collection
        const allDocsSnap = await getDocs(submissionsRef)

        // Filter only the ones whose IDs are in assignedSubmissionIds
        const filteredDocs = allDocsSnap.docs.filter(doc =>
            assignedSubmissionIds.includes(doc.id)
        )

        // Map them into Submission objects
        const allSubmissions: Submission[] = filteredDocs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Submission[]
        
        setSubmissions(allSubmissions)

        } catch (e: any) {
        setError(e?.message ?? "Failed to load data")
        } finally {
        setLoading(false)
        }
    }, [competitionId, challengeId, judgeId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const refetch = () => {
        fetchData()
    }

    return {
        loading,
        error,
        challenge,
        submissions,
        refetch,
    }
}