import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebase"


export async function getSubmissionCountByParticipant(participantId: string): Promise<number> {
    try {
        const q = query(
            collection(db, process.env.NEXT_PUBLIC_SUBMISSION_DATABASE),
            where("participant_ID", "==", participantId)
        )
        const snapshot = await getDocs(q)
        
        return snapshot.size
    } catch (error) {
        console.error("Error fetching submissions for participant:", error)
        return 0
    }
}
