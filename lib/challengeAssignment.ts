import { db } from './firebase'
import { collection, doc, setDoc, updateDoc, getDoc, getDocs, query, where } from 'firebase/firestore'
import type {
  Challenge,
  Submission,
  User,
  Assignment,
  DistributionResult,
  Judge,
  UserIndex
} from '@/types/judging'

interface DistributeJudgesParams {
  competitionId: string
  challenges: Challenge[]
  submissionsByChallenge: Record<string, Submission[]>
  judges: User[]
  topParticipants: string[]
}

export async function distributeJudges({
  competitionId,
  challenges,
  submissionsByChallenge,
  judges,
  topParticipants
}: DistributeJudgesParams): Promise<DistributionResult> {
  if (!judges.length) {
    throw new Error('No judges available for assignment')
  }

  if (!challenges.length) {
    throw new Error('No challenges found')
  }

  // Filter challenges that have submissions from top participants
  const challengesWithSubmissions = challenges.filter(challenge => {
    const challengeSubmissions = submissionsByChallenge[challenge.id] || []
    const topParticipantSubmissions = challengeSubmissions.filter(sub =>
      topParticipants.includes(sub.participantId)
    )
    return topParticipantSubmissions.length > 0
  })

  if (!challengesWithSubmissions.length) {
    throw new Error('No challenges with submissions from top participants found')
  }

  const shuffledJudges = [...judges].sort(() => Math.random() - 0.5)

  const assignments: Assignment[] = []
  const unassignedChallenges: string[] = []
  let totalSubmissionsAssigned = 0

  for (let i = 0; i < challengesWithSubmissions.length; i++) {
    const challenge = challengesWithSubmissions[i]
    const judge = shuffledJudges[i % shuffledJudges.length]
    const allChallengeSubmissions = submissionsByChallenge[challenge.id] || []

    const challengeSubmissions = allChallengeSubmissions.filter(sub =>
      topParticipants.includes(sub.participantId)
    )

    if (challengeSubmissions.length === 0) {
      unassignedChallenges.push(challenge.id)
      continue
    }

    const assignment: Assignment = {
      judgeId: judge.id,
      judgeName: judge.fullName,
      challengeId: challenge.id,
      submissions: challengeSubmissions,
      submissionCount: challengeSubmissions.length
    }
    

    assignments.push(assignment)
    totalSubmissionsAssigned += challengeSubmissions.length

    await saveJudgeAssignment(competitionId, challenge.id, judge, challengeSubmissions)
    await updateUserIndex(judge.id, challenge.id, competitionId)
  }

  return {
    assignments,
    totalChallenges: challengesWithSubmissions.length,
    totalJudges: shuffledJudges.length,
    totalSubmissionsAssigned,
    unassignedChallenges
  }
}


async function saveJudgeAssignment(
    competitionId: string,
    challengeId: string,
    judge: User,
    submissions: Submission[]
    ): Promise<void> {
        
    const judgeData: Judge = {
        id: judge.id, 
        fullName: judge.fullName,
        email: judge.email,
        assignedSubmissions: submissions.map(s => s.id),
        assignedCount: submissions.length,
        reviewedCount: 0,
        status: 'Not Started',
        assignedAt: new Date()
    }

    const judgePath = `competitions/${competitionId}/challenges/${challengeId}/judges/${judge.id}`

    try {
        await setDoc(doc(db, judgePath), judgeData) 
        console.log(`Judge assignment saved: ${judge.fullName} -> ${challengeId}`)
    } catch (error) {
        console.error('Error saving judge assignment:', error)
        throw new Error(`Failed to save assignment for judge ${judge.fullName}`)
    }
    }


async function updateUserIndex(
  judgeId: string,
  challengeId: string,
  competitionId: string
): Promise<void> {
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

      await updateDoc(userIndexRef, {
        competitionIds
      })
    } else {
      const newUserIndex: UserIndex = {
        judgeId,
        competitionIds: {
          [competitionId]: [challengeId]
        }
      }
      await setDoc(userIndexRef, newUserIndex)
    }

    console.log(`User index updated for judge: ${judgeId}`)
  } catch (error) {
    console.error('Error updating user index:', error)
    throw new Error(`Failed to update user index for judge ${judgeId}`)
  }
}

export async function getJudgeAssignments(
  judgeId: string,
  competitionId: string
): Promise<Assignment[]> {
  try {
    const challengesRef = collection(db, `competitions/${competitionId}/challenges`)
    const challengesSnapshot = await getDocs(challengesRef)

    const assignments: Assignment[] = []

    for (const challengeDoc of challengesSnapshot.docs) {
      const judgeRef = doc(db, `competitions/${competitionId}/challenges/${challengeDoc.id}/judges/${judgeId}`)
      const judgeDoc = await getDoc(judgeRef)

      if (judgeDoc.exists()) {
        const judgeData = judgeDoc.data() as Judge
        const submissionsRef = collection(db, `competitions/${competitionId}/submissions`)
        const submissionsQuery = query(submissionsRef, where('challengeId', '==', challengeDoc.id))
        const submissionsSnapshot = await getDocs(submissionsQuery)

        const submissions: Submission[] = []
        submissionsSnapshot.forEach(doc => {
          if (judgeData.assignedSubmissions.includes(doc.id)) {
            submissions.push({ id: doc.id, ...doc.data() } as Submission)
          }
        })

        assignments.push({
          judgeId: judgeData.id,
          judgeName: judgeData.fullName,
          challengeId: challengeDoc.id,
          submissions,
          submissionCount: submissions.length
        })
      }
    }

    return assignments
  } catch (error) {
    console.error('Error fetching judge assignments:', error)
    return []
  }
}
