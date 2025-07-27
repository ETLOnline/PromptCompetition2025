// app/api/admin/competitions/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import type { Competition } from "@/types/auth";

const admin = require("firebase-admin");
const serviceAccount = require("@/serviceAccountKey.json");

if (!getApps().length) {
  console.log("Initializing Firebase Admin SDK...");
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

const adminDb = admin.firestore();

export async function GET() {
  try {
    console.log("GET request received for competitions at", new Date().toISOString());
    const querySnapshot = await getDocs(collection(db, "competitions"));
    const competitions: Competition[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Competition[];

    return NextResponse.json(competitions);
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return NextResponse.json({ error: "Failed to fetch competitions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST request received at", new Date().toISOString());

    const token = request.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) {
      console.warn("No authentication token provided");
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const auth = getAuth();
    const user = await auth.verifyIdToken(token);
    const userRecord = await auth.getUser(user.uid);
    const role = userRecord.customClaims?.role;

    console.log("User role:", role);
    if (role !== "superadmin") {
      console.warn("User", user.uid, "lacks superadmin role. Current role:", role);
      return NextResponse.json({ error: "Unauthorized: Superadmin access required" }, { status: 403 });
    }

    const competitionData = await request.json();
    const { title, description, prizeMoney, deadline, location, isActive, isLocked } = competitionData;

    if (!title || !description || !prizeMoney || !deadline || !location) {
      console.error("Missing required fields:", { title, description, prizeMoney, deadline, location });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      console.error("Invalid deadline format:", deadline);
      return NextResponse.json({ error: "Invalid deadline format" }, { status: 400 });
    }

    if (location !== "online" && location !== "offsite") {
      console.error("Invalid location format:", location);
      return NextResponse.json({ error: "Invalid location: must be 'online' or 'offsite'" }, { status: 400 });
    }

    console.log("Attempting to create competition in Firestore with data:", {
      title,
      description,
      prizeMoney,
      deadline,
      location,
      isActive: isActive ?? true,
      isLocked: isLocked ?? false,
      createdAt: new Date().toISOString(),
    });

    const competitionRef = await adminDb.collection("competitions").add({
      title,
      description,
      prizeMoney,
      deadline,
      location,
      isActive: isActive ?? true,
      isLocked: isLocked ?? false,
      createdAt: new Date().toISOString(),
    });

    console.log("Competition created with ID:", competitionRef.id);
    const maincompetition = competitionRef.id;

    try {
    // Add a new document to the "competitionlist" collection
    // const competitionRef = await addDoc(collection(db, "competitionlist"), {
    //   createdAt: serverTimestamp(), // Firestore server timestamp
    // });

    await adminDb.collection("competitionlist").add({
      competitionId: maincompetition,
      createdAt: new Date().toISOString(),
    });


    // Update the document with its own ID
    // await addDoc(collection(db, "competitionlist"), {
    //   competitionId: maincompetition,
    //   createdAt: serverTimestamp()
    // });

    console.log("Competition added with ID:", competitionRef.id);
  } catch (error) {
    console.error("Error adding competition:", error);
  }


    const newCompetition: Competition = {
      id: competitionRef.id,
      title,
      description,
      prizeMoney,
      deadline,
      location,
      isActive: isActive ?? true,
      isLocked: isLocked ?? false,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: "Competition created successfully",
      competition: newCompetition,
      redirectUrl: `/admin/competition/${maincompetition}`, // Include the redirect URL
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating competition:", error);
    return NextResponse.json({ error: "Failed to create competition", details: error.message }, { status: 500 });
  }
}