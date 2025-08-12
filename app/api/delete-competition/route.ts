// app/api/delete-competition/route.ts

import { NextResponse } from "next/server"
import { getApps, initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
const serviceAccountKey = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  throw new Error("NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY is not set in .env");
}

// Parse JSON string from environment variable
const serviceAccount = JSON.parse(serviceAccountKey);

// Initialize admin SDK if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  })
}

const adminDb = getFirestore()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Missing competition ID" }, { status: 400 })
    }

    await adminDb.collection("competitions").doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin delete error:", error)
    return NextResponse.json({ error: "Failed to delete competition" }, { status: 500 })
  }
}
