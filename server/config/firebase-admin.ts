import admin from "firebase-admin"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// ✅ ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ✅ Resolve service account path
const serviceAccountPath = path.resolve(
  __dirname,
  "../enlightentech-a2046-firebase-adminsdk-fbsvc-8b4473f821.json"
)

// ✅ Load service account JSON
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

// ✅ Export Firestore and Auth from Admin SDK
const db = admin.firestore()
const auth = admin.auth()

export { db, auth, admin }
