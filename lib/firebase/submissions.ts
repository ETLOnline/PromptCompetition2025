import { db } from "../../firebase"
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    serverTimestamp,
    doc,
} from "firebase/firestore"

const submissionsRef = collection(db, "submissions")

// 1. Check if a submission exists
export const checkExistingSubmission = async (participant_ID: string, challenge_ID: string) => {
    try 
    {
        const q = query(
            submissionsRef,
            where("participant_ID", "==", participant_ID),
            where("challenge_ID", "==", challenge_ID)
        )

        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0]
            return { id: docSnap.id, data: docSnap.data() }
        }

        return null
    } 
    catch (err) 
    {
        throw err // So that the caller also fails if needed
    }
}

// 2. Submit or update a submission
export const submitPrompt = async (participant_ID: string, challenge_ID: string,
    promptText: string ) => {
        const existingSubmission = await checkExistingSubmission(participant_ID, challenge_ID)

        const submissionData = {
        participant_ID,
        challenge_ID,
        promptText,
        submissionTime: serverTimestamp(),
        plagiarismScore: null,
        finalScore: null,
        llmEvaluated: false,
        status: "none"  // This can later be changed to "pending" for Top N users
        }
        
        if (existingSubmission) 
        {
            const submissionRef = doc(db, "submissions", existingSubmission.id)
            await updateDoc(submissionRef, submissionData)
            return existingSubmission.id
        } 
        else 
        {
            const docRef = await addDoc(submissionsRef, submissionData)
            return docRef.id
        }
} 
