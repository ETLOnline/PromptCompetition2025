"use strict";
// For TypeScript, ensure you have firebase-admin installed: npm install firebase-admin
// For JavaScript, you can omit the type annotations.
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("firebase-admin/app");
var auth_1 = require("firebase-admin/auth");
// Load your service account key.
// Ensure 'serviceAccountKey.json' is in the same directory as this script,
// or provide its full path.
var serviceAccount = require("./serviceAccountKey.json");
// Initialize the Firebase Admin SDK using the modular approach
var app = (0, app_1.initializeApp)({
    credential: (0, app_1.cert)(serviceAccount),
});
// Get the Auth service instance from the initialized app
var auth = (0, auth_1.getAuth)(app);
// Define the User ID and the custom role
var targetUid = "your-id"; // Use your desired UID here, perhaps from an env var
var roleToSet = "superadmin"; // This must match your Firestore rule's expectation
console.log("Attempting to set custom claims for UID:", targetUid);
auth
    .setCustomUserClaims(targetUid, { role: roleToSet })
    .then(function () {
    console.log("\u2705 ".concat(roleToSet, " role set successfully for UID: ").concat(targetUid));
    console.log("Remember: The user's ID token will reflect these changes the next time a new one is issued (e.g., after re-authentication or token refresh).");
    process.exit(0);
})
    .catch(function (error) {
    console.error("❌ Error setting custom claim:", error);
    process.exit(1);
});

// npx tsc customRole.ts
// node customRole.js