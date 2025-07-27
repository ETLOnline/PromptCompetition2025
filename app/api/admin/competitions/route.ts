import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import type { Competition } from "@/types/auth";
import { auth } from "@/lib/firebase"


// Load Firebase Admin credentials
const admin = require("firebase-admin");

const serviceAccount = require("@/serviceAccountKey.json"); // path to your downloaded JSON
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });


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

    // Authenticate user and check role
    const token = request.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) {
      console.warn("No authentication token provided");
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const auth = getAuth();
    const user = await auth.verifyIdToken(token);
    // console.log("Authenticated user ID:", user.uid);
    const userRecord = await auth.getUser(user.uid);
    const role = userRecord.customClaims?.role;

    // const tokenResult = await user.getIdTokenResult(true);
    // const tokenRole = tokenResult.claims.role;

    
    console.log("User role:", role);
    if (role !== "superadmin") {
      console.warn("User", user.uid, "lacks superadmin role. Current role:", role);
      return NextResponse.json({ error: "Unauthorized: Superadmin access required" }, { status: 403 });
    }

    else if (role == "superadmin") {
      console.log("User has superadmin role, proceeding with competition creation");
    }

    const competitionData = await request.json();
    const { title, description, prizeMoney, deadline, location, isActive, isLocked, problemStatement, rubric, evaluationCriteria } = competitionData;

    // Validate required fields
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

    // Log Firestore write attempt
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

    // Create Firestore document
    const competitionRef = await adminDb.collection("competitions").add({
      title,
      description,
      prizeMoney,
      deadline,
      location,
      isActive: isActive ?? true,
      isLocked: isLocked ?? false,
      createdAt: new Date().toISOString(),
      problemStatement: problemStatement || "",
      rubric: rubric || "",
      evaluationCriteria: evaluationCriteria || "",
    });

    console.log("Competition created with ID:", competitionRef.id);

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
      problemStatement: problemStatement || "",
      rubric: rubric || "",
      evaluationCriteria: evaluationCriteria || "",
    };

    return NextResponse.json({
      message: "Competition created successfully",
      competition: newCompetition,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating competition:", error);
    return NextResponse.json({ error: "Failed to create competition", details: error.message }, { status: 500 });
  }
}