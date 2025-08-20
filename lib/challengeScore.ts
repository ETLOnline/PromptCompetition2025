import { db } from './firebase'
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'

/**
 * Get the maximum possible score for a single challenge.
 * (Weights already sum to 1, so no normalization is needed.)
 */
async function getMaxScore(competitionId: string, challengeId: string): Promise<number> {
  const challengeRef = doc(db, 'competitions', competitionId, 'challenges', challengeId)
  const challengeSnap = await getDoc(challengeRef)

  if (!challengeSnap.exists()) return 0

  const { rubric } = challengeSnap.data() as { rubric: { weight: number }[] }
  if (!rubric || rubric.length === 0) return 0

  // Since weights already sum to 1, maxScore is simply sum of (100 × weight)
  return rubric.reduce((sum, criterion) => sum + (100 * criterion.weight), 0)
}

/**
 * Aggregate max scores across all challenges for the competition
 * and save the total as "maxScore" in the competition document.
 */
export async function getMaxScoreForCompetition(competitionId: string): Promise<number> {
  const challengesRef = collection(db, 'competitions', competitionId, 'challenges')
  const challengesSnap = await getDocs(challengesRef)

  let totalMaxScore = 0
  for (const docSnap of challengesSnap.docs) {
    const score = await getMaxScore(competitionId, docSnap.id)
    totalMaxScore += score
  }

  // Save the final maxScore into /competitions/{competitionId}
  const competitionRef = doc(db, 'competitions', competitionId)
  await setDoc(competitionRef, { maxScore: totalMaxScore }, { merge: true })

  return totalMaxScore
}
