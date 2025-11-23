"use client";
import { useAuth } from "@clerk/nextjs";
import { signInWithCustomToken } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "@/lib/firebase"; // Your firebase client config

export default function FirebaseAuthSync() {
  const { getToken, userId } = useAuth();

  useEffect(() => {
    const signInToFirebase = async () => {
      if (!userId) return;

      try {
        // 1. Get the custom token from Clerk
        // IMPORTANT: 'firebase' is the name of the JWT template you created in Clerk Dashboard
        const token = await getToken({ template: "firebase" });

        if (!token) {
          console.error("No Firebase token found in Clerk");
          return;
        }

        // 2. Sign in to Firebase with that token
        await signInWithCustomToken(auth, token);
        console.log("✅ Firebase & Clerk successfully synced");
      } catch (error) {
        console.error("Error signing into Firebase:", error);
      }
    };

    signInToFirebase();
  }, [getToken, userId]);

  return null; // This component renders nothing
}