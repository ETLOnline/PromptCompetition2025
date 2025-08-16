import { db } from "@/lib/firebase"
import {
  collection,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  doc,
  increment,
  arrayUnion
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
  } catch (error) {
    return false;
  }
};

const getByteSize = (str: string): number => {
  return new Blob([str]).size;
};


// 2. Submit or update a submission
export const submitPrompt = async (
  competition_ID: string,
  participant_ID: string,
  challenge_ID: string,
  promptText: string
): Promise<{ success: boolean; error?: string }> => {
  const byteSize = getByteSize(promptText);
  const maxBytes = 1 * 1024 * 1024; // 1MB

  if (byteSize > maxBytes) {
    return { success: false, error: "Your submission size exceeds the 1MB limit." };
  }

  const existingSubmission = await checkExistingSubmission(
    competition_ID,
    participant_ID,
    challenge_ID
  );

  const submissionData = {
    participantId: participant_ID,
    challengeId: challenge_ID,
    promptText,
    submissionTime: serverTimestamp(),
    finalScore: null,
    status: "pending",
  };

  if (existingSubmission) {
    const submissionDocRef = doc(
      db,
      "competitions",
      competition_ID,
      "submissions",
      existingSubmission
    );
    await updateDoc(submissionDocRef, submissionData);
    return { success: true };
  } else {
    const submissionId = `${participant_ID}_${challenge_ID}`;
    const submissionDocRef = doc(
      db,
      "competitions",
      competition_ID,
      "submissions",
      submissionId
    );
    await setDoc(submissionDocRef, submissionData);

    const participantDocRef = doc(
      db,
      "competitions",
      competition_ID,
      "participants",
      participant_ID
    );
    await updateDoc(participantDocRef, {
      challengesCompleted: increment(1),
      completedChallenges: arrayUnion(challenge_ID),
    });

    return { success: true, error: null };
  }
};
