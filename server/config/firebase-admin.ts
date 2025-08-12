import admin from "firebase-admin"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv";

dotenv.config();

// ✅ ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// ✅ Export Firestore and Auth from Admin SDK
const db = admin.firestore()
const auth = admin.auth()

export { db, auth, admin }
