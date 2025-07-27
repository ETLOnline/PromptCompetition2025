import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Log entry to confirm API route is called
console.log("API route /api/admin/competitions invoked at", new Date().toISOString());

// Initialize Firebase Admin SDK
// if (!getApps().length) {
//   console.log("Initializing Firebase Admin SDK...");
//   try {
//     initializeApp({
//       credential: cert({
//         projectId: process.env.FIREBASE_PROJECT_ID,
//         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//         privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//       }),
//     });
//     console.log("Firebase Admin SDK initialized successfully");
//   } catch (error) {
//     console.error("Failed to initialize Firebase Admin SDK:", error);
//     throw error; // Ensure the error is propagated
//   }
// }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Handling request with method:", req.method);

  if (req.method === "POST") {
    try {
      console.log("POST request received with body:", req.body);

      // Authenticate user and check role
      const token = req.headers.authorization?.split("Bearer ")[1];
      if (!token) {
        console.warn("No authentication token provided");
        return res.status(401).json({ error: "Unauthorized: No token provided" });
      }

      console.log("Authenticated user ID:", user.uid);
      const userRecord = await auth.getUser(user.uid); // Fixed typo (user.uid instead of user)
      const role = userRecord.customClaims?.role;
      if (role !== "superadmin") {
        console.warn("User", user.uid, "lacks superadmin role. Current role:", role);
        return res.status(403).json({ error: "Unauthorized: Superadmin access required" });
      }

      const { title, description, prizeMoney, deadline, location, isActive, isLocked } = req.body;

      // Validate required fields
      if (!title || !description || !prizeMoney || !deadline || !location) {
        console.error("Missing required fields:", { title, description, prizeMoney, deadline, location });
        return res.status(400).json({ error: "Missing required fields" });
      }
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        console.error("Invalid deadline format:", deadline);
        return res.status(400).json({ error: "Invalid deadline format" });
      }
      if (location !== "online" && location !== "offsite") {
        console.error("Invalid location format:", location);
        return res.status(400).json({ error: "Invalid location: must be 'online' or 'offsite'" });
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
      const competitionRef = await addDoc(collection(db, "competitions"), {
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

      return res.status(201).json({ success: true, id: competitionRef.id, message: "Competition created successfully" });
    } catch (error) {
      console.error("Error creating competition:", error);
      return res.status(500).json({ error: "Failed to create competition", details: error.message });
    }
  } else {
    console.warn("Invalid method:", req.method);
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}