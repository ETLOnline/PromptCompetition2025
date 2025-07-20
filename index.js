// index.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function printUserRoles() {
  const listUsersResult = await admin.auth().listUsers();
  listUsersResult.users.forEach((userRecord) => {
    console.log("Email:", userRecord.email);
    console.log("Role:", userRecord.customClaims?.role || "none");
    console.log("-----");
  });
}

printUserRoles();
