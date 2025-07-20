import { initializeApp, getApps } from "firebase-admin/app";
import { cert } from "firebase-admin/app"; // This import is also correct for 'cert'
import { getAuth } from 'firebase-admin/auth'; // Import for Firebase Admin Auth
import * as path from "path";

// Load Firebase Admin credentials
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json"); // path to your downloaded JSON
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const UID = process.env.FIREBASE_ADMIN_UID;
  admin
    .auth()
    .setCustomUserClaims(UID, { role: "admin" })
    .then(() => {
      console.log("✅ Admin role set successfully for UID:", UID);
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error("❌ Error setting custom claim:", error);
      process.exit(1);
    });