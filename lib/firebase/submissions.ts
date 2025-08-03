import { db } from "@/lib/firebase"
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


// 1. Check if a submission exists
export const checkExistingSubmission = async (
    competition_ID: string,
    participant_ID: string,
    challenge_ID: string
) => {
    try {
        const submissionsRef = collection(db, "competitions", competition_ID, "submissions");        
        
        const q = query(
            submissionsRef,
            where("participantId", "==", participant_ID),
            where("challengeId", "==", challenge_ID)
        );
        const querySnapshot = await getDocs(q);

        await fetch("/api/debugger", {
            method: "POST",
            body: JSON.stringify({
                message: `Query returned ${querySnapshot.size} results. First ID: ${querySnapshot.docs[0]?.id || "none"}`
            }),
            headers: { "Content-Type": "application/json" }
        });


        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0]
            return docSnap.id
        }

        return false;
    } 
    catch (error) 
    {
        await fetch("/api/debugger", {
            method: "POST",
            body: JSON.stringify({
                message: `Error checking submission: ${error.message || error}`
            }),
            headers: { "Content-Type": "application/json" }
        });
        return false;
    }
};


// 2. Submit or update a submission
export const submitPrompt = async (
    competition_ID: string,
    participant_ID: string,
    challenge_ID: string,
    promptText: string
) => {
        const existingSubmission = await checkExistingSubmission(competition_ID, participant_ID, challenge_ID)

        const submissionData = {
            participantId: participant_ID,
            challengeId: challenge_ID,
            promptText,
            submissionTime: serverTimestamp(),
            llmScore: null,
            status: "pending" 
        }
        
        if (existingSubmission) 
        {
            const submissionDocRef = doc(db, "competitions", competition_ID, "submissions", existingSubmission)
            await updateDoc(submissionDocRef, submissionData)
            return true
        } 
        else 
        {
            const submissionsRef = collection(db, "competitions", competition_ID, "submissions")
            const docRef = await addDoc(submissionsRef, submissionData)
            return false
        }
} 
