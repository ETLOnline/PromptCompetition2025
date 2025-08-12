import { db } from './firebase'
import { collection, writeBatch, doc, setDoc, updateDoc, getDoc, getDocs, query, where } from 'firebase/firestore'
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
  marginPercentage?: number // Default 20%
}

interface ChallengeWithSubmissions {
  challenge: Challenge
  submissions: Submission[]
  submissionCount: number
}

interface JudgeLoad {
  judge: User
  assignments: Assignment[]
  totalSubmissions: number
  capacity: number
}

export async function distributeJudges({
  competitionId, 
  challenges, 
  submissionsByChallenge, 
  judges, 
  topParticipants,
  marginPercentage = 20
}: DistributeJudgesParams): Promise<DistributionResult> {
  if (!judges.length) {
    throw new Error('No judges available for assignment')
  }

  if (!challenges.length) {
    throw new Error('No challenges found')
  }

  // Filter and prepare challenges that have submissions from top participants
  const challengesWithSubmissions: ChallengeWithSubmissions[] = challenges
    .map(challenge => {
      const allChallengeSubmissions = submissionsByChallenge[challenge.id] || []
      const topParticipantSubmissions = allChallengeSubmissions.filter(sub =>
        topParticipants.includes(sub.participantId)
      )
      return {
        challenge,
        submissions: topParticipantSubmissions,
        submissionCount: topParticipantSubmissions.length
      }
    })
    .filter(item => item.submissionCount > 0)

  if (!challengesWithSubmissions.length) {
    throw new Error('No challenges with submissions from top participants found')
  }

  // Calculate total submissions and ideal load per judge
  const totalSubmissions = challengesWithSubmissions.reduce(
    (sum, item) => sum + item.submissionCount, 0
  )
  const idealLoadPerJudge = Math.ceil(totalSubmissions / judges.length)
  const maxLoadPerJudge = Math.ceil(idealLoadPerJudge * (1 + marginPercentage / 100))

  // Initialize judge loads
  const judgeLoads: JudgeLoad[] = judges.map(judge => ({
    judge,
    assignments: [],
    totalSubmissions: 0,
    capacity: maxLoadPerJudge
  }))

  // Sort challenges by submission count (largest first)
  const sortedChallenges = [...challengesWithSubmissions].sort(
    (a, b) => b.submissionCount - a.submissionCount
  )

  const unassignedChallenges: string[] = []
  const assignments: Assignment[] = []

  // Phase 1: Assign large challenges (those that exceed ideal load)
  const largeChallenges = sortedChallenges.filter(
    item => item.submissionCount > idealLoadPerJudge
  )
  
  for (const challengeItem of largeChallenges) {
    if (challengeItem.submissionCount <= maxLoadPerJudge) {
      // Challenge fits within max load - assign to judge with most remaining capacity
      const bestJudge = judgeLoads
        .filter(jl => jl.totalSubmissions + challengeItem.submissionCount <= jl.capacity)
        .sort((a, b) => (b.capacity - b.totalSubmissions) - (a.capacity - a.totalSubmissions))[0]

      if (bestJudge) {
        await assignChallengeToJudge(
          competitionId, 
          challengeItem, 
          bestJudge, 
          assignments
        )
      } else {
        // Need to split challenge among multiple judges
        await splitChallengeAmongJudges(
          competitionId,
          challengeItem,
          judgeLoads,
          assignments
        )
      }
    } else {
      // Challenge is too large even for max load - must split
      await splitChallengeAmongJudges(
        competitionId,
        challengeItem,
        judgeLoads,
        assignments
      )
    }
  }

  // Phase 2: Assign medium and small challenges as whole units
  const remainingChallenges = sortedChallenges.filter(
    item => item.submissionCount <= idealLoadPerJudge
  )

  for (const challengeItem of remainingChallenges) {
    // Find judge with most remaining capacity who can fit this challenge
    const suitableJudges = judgeLoads
      .filter(jl => jl.totalSubmissions + challengeItem.submissionCount <= jl.capacity)
      .sort((a, b) => (b.capacity - b.totalSubmissions) - (a.capacity - a.totalSubmissions))

    if (suitableJudges.length > 0) {
      await assignChallengeToJudge(
        competitionId,
        challengeItem,
        suitableJudges[0],
        assignments
      )
    } else {
      unassignedChallenges.push(challengeItem.challenge.id)
    }
  }

  // Phase 3: Balance loads by redistributing small challenges if needed
  await balanceJudgeLoads(
    competitionId,
    judgeLoads,
    remainingChallenges.filter(item => 
      !assignments.some(assignment => assignment.challengeId === item.challenge.id) &&
      !unassignedChallenges.includes(item.challenge.id)
    ),
    assignments,
    idealLoadPerJudge
  )

  const totalSubmissionsAssigned = assignments.reduce(
    (sum, assignment) => sum + assignment.submissionCount, 0
  )

  return {
    assignments,
    totalChallenges: challengesWithSubmissions.length,
    totalJudges: judges.length,
    totalSubmissionsAssigned,
    unassignedChallenges
  }
}

async function assignChallengeToJudge(
  competitionId: string,
  challengeItem: ChallengeWithSubmissions,
  judgeLoad: JudgeLoad,
  assignments: Assignment[]
): Promise<void> {
  const assignment: Assignment = {
    judgeId: judgeLoad.judge.id,
    judgeName: judgeLoad.judge.fullName,
    challengeId: challengeItem.challenge.id,
    submissions: challengeItem.submissions,
    submissionCount: challengeItem.submissionCount
  }

  assignments.push(assignment)
  judgeLoad.assignments.push(assignment)
  judgeLoad.totalSubmissions += challengeItem.submissionCount

  await saveJudgeAssignment(
    competitionId,
    challengeItem.challenge.id,
    judgeLoad.judge,
    challengeItem.submissions
  )
  
  await updateUserIndex(
    judgeLoad.judge.id,
    challengeItem.challenge.id,
    competitionId,
    challengeItem.submissionCount
  )

  console.log(`Assigned challenge ${challengeItem.challenge.id} (${challengeItem.submissionCount} submissions) to judge ${judgeLoad.judge.fullName}`)
}

async function splitChallengeAmongJudges(
  competitionId: string,
  challengeItem: ChallengeWithSubmissions,
  judgeLoads: JudgeLoad[],
  assignments: Assignment[]
): Promise<void> {
  // Sort judges by remaining capacity (most capacity first)
  const availableJudges = judgeLoads
    .filter(jl => jl.capacity - jl.totalSubmissions > 0)
    .sort((a, b) => (b.capacity - b.totalSubmissions) - (a.capacity - a.totalSubmissions))

  if (availableJudges.length === 0) {
    console.warn(`No available judges to split challenge ${challengeItem.challenge.id}`)
    return
  }

  // Shuffle submissions for fair distribution
  const shuffledSubmissions = [...challengeItem.submissions].sort(() => Math.random() - 0.5)
  let submissionIndex = 0

  for (const judgeLoad of availableJudges) {
    if (submissionIndex >= shuffledSubmissions.length) break

    const remainingCapacity = judgeLoad.capacity - judgeLoad.totalSubmissions
    const submissionsToAssign = Math.min(
      remainingCapacity,
      shuffledSubmissions.length - submissionIndex
    )

    if (submissionsToAssign > 0) {
      const assignedSubmissions = shuffledSubmissions.slice(
        submissionIndex,
        submissionIndex + submissionsToAssign
      )

      const assignment: Assignment = {
        judgeId: judgeLoad.judge.id,
        judgeName: judgeLoad.judge.fullName,
        challengeId: challengeItem.challenge.id,
        submissions: assignedSubmissions,
        submissionCount: assignedSubmissions.length
      }

      assignments.push(assignment)
      judgeLoad.assignments.push(assignment)
      judgeLoad.totalSubmissions += assignedSubmissions.length

      await saveJudgeAssignment(
        competitionId,
        challengeItem.challenge.id,
        judgeLoad.judge,
        assignedSubmissions
      )

      await updateUserIndex(
        judgeLoad.judge.id,
        challengeItem.challenge.id,
        competitionId,
        assignedSubmissions.length
      )


      submissionIndex += submissionsToAssign

      console.log(`Split challenge ${challengeItem.challenge.id}: assigned ${assignedSubmissions.length} submissions to judge ${judgeLoad.judge.fullName}`)
    }
  }

  if (submissionIndex < shuffledSubmissions.length) {
    console.warn(`Could not assign ${shuffledSubmissions.length - submissionIndex} submissions from challenge ${challengeItem.challenge.id}`)
  }
}

async function balanceJudgeLoads(
  competitionId: string,
  judgeLoads: JudgeLoad[],
  unassignedChallenges: ChallengeWithSubmissions[],
  assignments: Assignment[],
  idealLoadPerJudge: number
): Promise<void> {
  // Sort judges by current load (least loaded first)
  const sortedJudges = [...judgeLoads].sort((a, b) => a.totalSubmissions - b.totalSubmissions)
  
  // Sort unassigned challenges by submission count (smallest first for easier fitting)
  const sortedUnassigned = [...unassignedChallenges].sort((a, b) => a.submissionCount - b.submissionCount)

  for (const challengeItem of sortedUnassigned) {
    // Find judge with load below ideal who can fit this challenge
    const suitableJudge = sortedJudges.find(jl => 
      jl.totalSubmissions < idealLoadPerJudge &&
      jl.totalSubmissions + challengeItem.submissionCount <= jl.capacity
    )

    if (suitableJudge) {
      await assignChallengeToJudge(
        competitionId,
        challengeItem,
        suitableJudge,
        assignments
      )
      console.log(`Balanced: assigned challenge ${challengeItem.challenge.id} to judge ${suitableJudge.judge.fullName}`)
    }
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
  competitionId: string,
  assignedSubmissionCount: number
): Promise<void> {
  const userIndexRef = doc(db, `userIndex/${judgeId}`);

  try {
    const userIndexDoc = await getDoc(userIndexRef);

    if (userIndexDoc.exists()) {
      const existingData = userIndexDoc.data() as UserIndex;
      const competitionIds = existingData.competitionIds || {};

      if (!competitionIds[competitionId]) {
        competitionIds[competitionId] = {};
      }

      competitionIds[competitionId][challengeId] = assignedSubmissionCount;

      await updateDoc(userIndexRef, { competitionIds });
    } else {
      const newUserIndex: UserIndex = {
        judgeId,
        competitionIds: {
          [competitionId]: {
            [challengeId]: assignedSubmissionCount,
          },
        },
      };
      await setDoc(userIndexRef, newUserIndex);
    }
  } catch (error) {
    console.error("Error updating user index:", error);
    throw new Error(`Failed to update user index for judge ${judgeId}`);
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
      const challengeId = challengeDoc.id
      const judgeRef = doc(db, `competitions/${competitionId}/challenges/${challengeId}/judges/${judgeId}`)
      const judgeDoc = await getDoc(judgeRef)

      if (judgeDoc.exists()) {
        const judgeData = judgeDoc.data() as Judge

        // Filter assigned submissions that belong to this challenge
        const relevantSubmissionIds = judgeData.assignedSubmissions.filter(id =>
          id.endsWith(`_${challengeId}`)
        )

        // Fetch these submissions directly
        const submissionFetches = relevantSubmissionIds.map(async (submissionId) => {
          const submissionRef = doc(db, `competitions/${competitionId}/submissions/${submissionId}`)
          const submissionSnap = await getDoc(submissionRef)
          return submissionSnap.exists() ? { id: submissionSnap.id, ...submissionSnap.data() } as Submission : null
        })

        const fetchedSubmissions = await Promise.all(submissionFetches)
        const submissions = fetchedSubmissions.filter(Boolean) as Submission[]

        assignments.push({
          judgeId: judgeData.id,
          judgeName: judgeData.fullName,
          challengeId,
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

// Changes the status of submissions of top N participants to selected_for_manual_review
export async function updateSubmissionsStatus(
  competitionId: string,
  submissions: Submission[],
  status: string = 'selected_for_manual_review'
): Promise<void> {
  if (!submissions.length) return

  const batch = writeBatch(db)

  submissions.forEach(submission => {
    const submissionRef = doc(db, `competitions/${competitionId}/submissions`, submission.id)
    batch.update(submissionRef, { status })
  })

  try {
    await batch.commit()
    console.log(`Updated status for ${submissions.length} submissions to "${status}"`)
  } catch (error) {
    console.error('Failed to update submissions status:', error)
    throw new Error(`Failed to update submissions status to "${status}"`)
  }
}