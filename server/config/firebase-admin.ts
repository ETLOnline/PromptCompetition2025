import admin from "firebase-admin"
import { createClerkClient } from "@clerk/backend"
import dotenv from "dotenv";

dotenv.config();

// ✅ Resolve service account path
const serviceAccountKey = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  throw new Error("NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY is not set in .env");
}

// Parse JSON string from environment variable
const serviceAccount = JSON.parse(serviceAccountKey);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

// ✅ Export Firestore (for database) - Firebase
const db = admin.firestore()

// ✅ Initialize Clerk Client (for authentication) - Clerk
// Make sure CLERK_SECRET_KEY is in your .env file
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

// Usage: await clerkClient.users.getUser(userId)
//        await clerkClient.verifyToken(token)
export { db, clerkClient, admin }