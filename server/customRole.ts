// For TypeScript, ensure you have firebase-admin installed: npm install firebase-admin
// For JavaScript, you can omit the type annotations.

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as path from "path"; // Useful if your service account path is relative

// Load your service account key.
// Ensure 'serviceAccountKey.json' is in the same directory as this script,
// or provide its full path.
const serviceAccount = require("./serviceAccountKey.json");

// Initialize the Firebase Admin SDK using the modular approach
const app = initializeApp({
  credential: cert(serviceAccount),
});

// Get the Auth service instance from the initialized app
const auth = getAuth(app);

// Define the User ID and the custom role
const targetUid = "baSlsXwiF1awapU76QY5tDj6dor2"; // Use your desired UID here, perhaps from an env var
const roleToSet = "superadmin"; // This must match your Firestore rule's expectation

console.log("Attempting to set custom claims for UID:", targetUid);

auth
  .setCustomUserClaims(targetUid, { role: roleToSet })
  .then(() => {
    console.log(`✅ ${roleToSet} role set successfully for UID: ${targetUid}`);
    console.log(
      "Remember: The user's ID token will reflect these changes the next time a new one is issued (e.g., after re-authentication or token refresh)."
    );
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("❌ Error setting custom claim:", error);
    process.exit(1);
  });
