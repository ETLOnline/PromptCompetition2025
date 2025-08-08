import { db } from './firebase'
import { collection, doc, setDoc, updateDoc, getDoc, getDocs, query, where } from 'firebase/firestore'
import type { Challenge, Submission, User, Judge, UserIndex } from '@/types/judging'

interface ManualAssignment {
  challengeId: string
  judgeId: string
  count: number
}

interface ManualDistributionParams {
  competitionId: string
  assignments: ManualAssignment[]
  challenges: Challenge[]
  submissionsByChallenge: Record<string, Submission[]>
  judges: User[]
  topParticipants: string[]
}

export async function distributeJudgesManually({
  competitionId,
  assignments,
  challenges,
  submissionsByChallenge,
  judges,
  topParticipants
}: ManualDistributionParams) {
  // Validate assignments
  for (const assignment of assignments) {
    const available = submissionsByChallenge[assignment.challengeId]?.filter(sub => 
      topParticipants.includes(sub.participant_ID)
    ).length || 0
    
    if (assignment.count > available) {
      throw new Error(`Cannot assign ${assignment.count} submissions to challenge ${assignment.challengeId}. Only ${available} available.`)
    }
  }

  // Group assignments by challenge
  const assignmentsByChallenge = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.challengeId]) {
      acc[assignment.challengeId] = []
    }
    acc[assignment.challengeId].push(assignment)
    return acc
  }, {} as Record<string, ManualAssignment[]>)

  const results = []

  // Process each challenge
  for (const [challengeId, challengeAssignments] of Object.entries(assignmentsByChallenge)) {
    const challenge = challenges.find(c => c.id === challengeId)
    if (!challenge) continue

    const allSubmissions = submissionsByChallenge[challengeId]?.filter(sub => 
      topParticipants.includes(sub.participant_ID)
    ) || []

    // Shuffle submissions for fair distribution
    const shuffledSubmissions = [...allSubmissions].sort(() => Math.random() - 0.5)
    let submissionIndex = 0

    // Distribute submissions according to manual assignments
    for (const assignment of challengeAssignments) {
      if (assignment.count === 0) continue

      const judge = judges.find(j => j.id === assignment.judgeId)
      if (!judge) continue

      // Take the next N submissions
      const assignedSubmissions = shuffledSubmissions.slice(submissionIndex, submissionIndex + assignment.count)
      submissionIndex += assignment.count

      if (assignedSubmissions.length > 0) {
        // Save judge assignment
        await saveJudgeAssignment(competitionId, challengeId, judge, assignedSubmissions)
        
        // Update user index
        await updateUserIndex(judge.id, challengeId, competitionId)

        results.push({
          judgeId: judge.id,
          judgeName: judge.fullName,
          challengeId,
          challengeTitle: challenge.title,
          submissionCount: assignedSubmissions.length
        })
      }
    }
  }

  return {
    success: true,
    assignments: results,
    totalAssigned: results.reduce((sum, r) => sum + r.submissionCount, 0)
  }
}

async function saveJudgeAssignment(
  competitionId: string, 
  challengeId: string, 
  judge: User, 
  submissions: Submission[]
) {
  const judgeData: Judge = {
    id: judge.id,
    fullName: judge.fullName,
    email: judge.email,
    assignedSubmissions: submissions.map(s => s.id),
    assignedCount: submissions.length,
    reviewedCount: 0,
    status: "Not Started",
    assignedAt: new Date()
  }

  const judgePath = `competitions/${competitionId}/challenges/${challengeId}/judges/${judge.id}`
  
  try {
    await setDoc(doc(db, judgePath), judgeData)
    console.log(`Manual assignment saved: ${judge.fullName} -> ${challengeId} (${submissions.length} submissions)`)
  } catch (error) {
    console.error('Error saving manual assignment:', error)
    throw new Error(`Failed to save assignment for judge ${judge.fullName}`)
  }
}

async function updateUserIndex(judgeId: string, challengeId: string, competitionId: string) {
  const userIndexPath = `userIndex/${judgeId}`
  
  try {
    const userIndexRef = doc(db, userIndexPath)
    const userIndexDoc = await getDoc(userIndexRef)
    
    if (userIndexDoc.exists()) {
      const existingData = userIndexDoc.data() as UserIndex
      const competitionIds = existingData.competitionIds || {}
      
      if (competitionIds[competitionId]) {
        if (!competitionIds[competitionId].includes(challengeId)) {
          competitionIds[competitionId].push(challengeId)
        }
      } else {
        competitionIds[competitionId] = [challengeId]
      }
      
      await updateDoc(userIndexRef, { competitionIds })
    } else {
      const newUserIndex: UserIndex = {
        judgeId,
        competitionIds: {
          [competitionId]: [challengeId]
        }
      }
      await setDoc(userIndexRef, newUserIndex)
    }
  } catch (error) {
    console.error('Error updating user index:', error)
    throw new Error(`Failed to update user index for judge ${judgeId}`)
  }
}
