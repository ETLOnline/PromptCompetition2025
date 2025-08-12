

// // index.js
// const admin = require("firebase-admin");
// // const serviceAccount = require("./serviceAccountKey.json");
// const serviceAccountKey = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY;

// if (!serviceAccountKey) {
//   throw new Error("NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY is not set in .env");
// }

// // Parse JSON string from environment variable
// const serviceAccount = JSON.parse(serviceAccountKey);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// async function printUserRoles() {
//   const listUsersResult = await admin.auth().listUsers();
//   listUsersResult.users.forEach((userRecord) => {
//     console.log("Email:", userRecord.email);
//     console.log("Role:", userRecord.customClaims?.role || "none");
//     console.log("-----");
//   });
// }

// printUserRoles();
