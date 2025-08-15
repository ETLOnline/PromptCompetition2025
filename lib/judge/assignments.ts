import type { JudgeAssignment, CompetitionAssignment } from "@/types/judge-submission"
import { collectionGroup, query, where, getDocs, doc, getDoc, type DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function fetchAssignments(userId: string): Promise<JudgeAssignment[]> {
  try {
    const judgesQuery = query(collectionGroup(db, "judges"), where("judgeId", "==", userId))

    const snapshot = await getDocs(judgesQuery)
    const assignmentData: JudgeAssignment[] = []

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as DocumentData

      assignmentData.push({
        id: data.judgeId,
        title: data.competitionTitle || `Competition ${data.competitionId}`,
        competitionId: data.competitionId,
        submissionCount: data.assignedCountTotal || 0,
        assignedDate: data.updatedAt,
        assignedCountsByChallenge: data.assignedCountsByChallenge || {},
      })
    })

    return assignmentData
  } catch (error) {
    console.error("Error fetching assignments:", error)
    throw new Error("Failed to fetch judge assignments")
  }
}

export async function fetchAssignment(
  userId: string,
  competitionId: string
): Promise<CompetitionAssignment | null> {
  try {
    const judgeDocRef = doc(db, "competitions", competitionId, "judges", userId);
    const judgeDoc = await getDoc(judgeDocRef);

    if (!judgeDoc.exists()) return null;

    const data = judgeDoc.data();

    return {
      judgeId: data.judgeId,
      competitionId: data.competitionId,
      competitionTitle: data.competitionTitle || `Competition ${competitionId}`,
      assignedCountTotal: data.assignedCountTotal || 0,
      assignedCountsByChallenge: data.assignedCountsByChallenge || {},
      submissionsByChallenge: data.submissionsByChallenge || {},
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching assignment:", error);
    throw new Error("Failed to fetch judge assignment");
  }
}
