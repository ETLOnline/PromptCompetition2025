// test-env.ts
import * as dotenv from "dotenv";
dotenv.config({ path: "./env.local" });
console.log(process.env);

console.log("UID:", process.env.FIREBASE_ADMIN_UID);

fetch("/api/debugger", {
    method: "POST",
    body: JSON.stringify({ message: `user object: ${JSON.stringify(process.env.FIREBASE_ADMIN_UID)}` }),
    headers: {
      "Content-Type": "application/json",
    },
  })