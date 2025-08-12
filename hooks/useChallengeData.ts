import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore'
import { getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import type { User, Challenge, Submission, LeaderboardEntry, Competition } from '@/types/judging'


// Individual data fetching functions for direct import
export const fetchCompetitionData = async (competitionId: string) => {
    try {
        const competitionRef = doc(db, `competitions/${competitionId}`)
        const competitionDoc = await getDoc(competitionRef)
        
        if (competitionDoc.exists()) {
            const data = competitionDoc.data()
            
            const comp: Competition = {
                id: competitionDoc.id,
                title: data.title,
                configurations: {
                    selectedTopN: data.configurations?.selectedTopN || 0,
                    timestamp: data.configurations?.timestamp?.toDate() || new Date(),
                    userId: data.configurations?.userId || ''
                }
            }
            
            return comp
        }
        return null
    } catch (err) {
        console.error('Error fetching competition:', err)
        throw err
    }
}

export const fetchTopParticipantsData = async (competitionId: string, topN: number) => {
    try {
        const leaderboardRef = collection(db, `competitions/${competitionId}/leaderboard`)
        const q = query(leaderboardRef, orderBy('rank', 'asc'), limit(topN))
        const snapshot = await getDocs(q)

        const entries: LeaderboardEntry[] = []
        const participantIds: string[] = []
        
        snapshot.forEach((doc) => {
            const data = doc.data()
            const entry: LeaderboardEntry = {
                id: doc.id,
                fullName: data.fullName || 'Unknown',
                totalScore: data.totalScore || 0,
                rank: data.rank || 0,
            }
            entries.push(entry)
            participantIds.push(doc.id)
        })
        
        return { entries, participantIds }
    } catch (err) {
        console.error('Error fetching top participants:', err)
        throw err
    }
}

export const fetchChallengesData = async (competitionId: string) => {
    try {
        const challengesRef = collection(db, `competitions/${competitionId}/challenges`)
        const snapshot = await getDocs(challengesRef)
        
        const challengesList: Challenge[] = []
        snapshot.forEach((doc) => {
            challengesList.push({
                id: doc.id,
                title: doc.title || "Unknown",
            })
        })
        
        return challengesList
    } catch (err) {
        console.error('Error fetching challenges:', err)
        throw err
    }
}

// Updated fetchJudgesData to use backend API
export const fetchJudgesData = async () => {
    try {
        if (!auth.currentUser) {
            throw new Error('User not authenticated')
        }

        const token = await getIdToken(auth.currentUser)
        const url = `http://localhost:8080/superadmin/users?role=judge`
        const res = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })
        
        if (!res.ok) {
            throw new Error(`Failed to fetch judges: ${res.status} ${res.statusText}`)
        }
        
        const data = await res.json()
        const judgeUsers = data.users || []
        
        // Transform the response to match the User interface
        const judgesList: User[] = judgeUsers.map((judge: any) => ({
            id: judge.id || judge.uid,
            fullName: judge.fullName || judge.displayName || 'Unknown Judge',
            email: judge.email || '',
        }))
            
        
        return judgesList
    } catch (err) {
        console.error('Error fetching judges:', err)
        throw err
    }
}

export const fetchSubmissionsData = async (competitionId: string, participantIds: string[]) => {
    try {
        const submissionsRef = collection(db, `competitions/${competitionId}/submissions`)
        const snapshot = await getDocs(submissionsRef)
        
        const submissionsByChallenge: Record<string, Submission[]> = {}
        
        snapshot.forEach((doc) => {
            const data = doc.data()
            
            // Only include submissions from top participants
            if (!participantIds.includes(data.participantId)) {
                return
            }
            
            const submission: Submission = {
                id: doc.id,
                participantId: data.participantId,
                challengeId: data.challengeId,
                promptText: data.promptText || '',
                finalScore: data.finalScore,
                llmEvaluated: data.llmEvaluated || false,
                status: data.status || 'pending',
            }
            
            if (!submissionsByChallenge[submission.challengeId]) {
                submissionsByChallenge[submission.challengeId] = []
            }
            submissionsByChallenge[submission.challengeId].push(submission)
        })

        return submissionsByChallenge
    } catch (err) {
        console.error('Error fetching submissions:', err)
        throw err
    }
}