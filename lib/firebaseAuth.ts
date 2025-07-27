// lib/firebaseAuth.ts
import { getAuth } from "firebase/auth";

// Utility to get the current user's ID token
export const getIdToken = async (): Promise<string> => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error("No user is currently signed in.");
    }

    return await user.getIdToken();
};
