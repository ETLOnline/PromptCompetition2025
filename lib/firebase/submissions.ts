import { db } from "@/lib/firebase"
import {
    collection,
    getDoc,
    setDoc,
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
        const submissionId = `${participant_ID}_${challenge_ID}`;
        const submissionDocRef = doc(db, "competitions", competition_ID, "submissions", submissionId);
        const submissionSnap = await getDoc(submissionDocRef);
        
        if (submissionSnap.exists()) {
            return submissionId;
        }

        return false;
    } 
    catch (error) 
    {
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
            const submissionId = `${participant_ID}_${challenge_ID}`;
            const submissionDocRef = doc(db, "competitions", competition_ID, "submissions", submissionId);
            await setDoc(submissionDocRef, submissionData);

            return false
        }
} 
