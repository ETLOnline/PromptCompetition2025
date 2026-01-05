import { NextRequest, NextResponse } from "next/server"
import { db as adminDb } from "@/server/config/firebase-admin"
import type { QueryDocumentSnapshot } from "firebase-admin/firestore"

export async function GET(req: NextRequest) {
  try {
    console.log("📥 Fetching participant submissions...")
    
    // No authentication required - complete transparency for all users
    const { searchParams } = new URL(req.url)
    const participantId = searchParams.get("participantId")
    const competitionId = searchParams.get("competitionId")

    console.log("🔍 Looking for submissions:", { participantId, competitionId })

    if (!participantId || !competitionId) {
      return NextResponse.json(
        { error: "Missing participantId or competitionId" },
        { status: 400 }
      )
    }

    // Fetch participant info
    const participantDoc = await adminDb
      .collection("users")
      .doc(participantId)
      .get()

    if (!participantDoc.exists) {
      console.error("❌ Participant not found:", participantId)
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    const participant = participantDoc.data()
    console.log("✅ Found participant:", participant?.email)

    // Fetch all submissions for this participant in this competition
    // Note: Removed orderBy to avoid requiring composite index
    const submissionsSnapshot = await adminDb
      .collection("submissions")
      .where("participantId", "==", participantId)
      .where("competitionId", "==", competitionId)
      .get()

    console.log(`📊 Found ${submissionsSnapshot.docs.length} submissions`)

    // Fetch challenge details for each submission
    const submissions = await Promise.all(
      submissionsSnapshot.docs.map(async (doc: QueryDocumentSnapshot) => {
        const submission = doc.data()
        
        // Fetch challenge details
        let challengeTitle = "Unknown Challenge"
        try {
          const challengeDoc = await adminDb
            .collection("challenges")
            .doc(submission.challengeId)
            .get()
          
          if (challengeDoc.exists) {
            challengeTitle = challengeDoc.data()?.title || "Unknown Challenge"
          }
        } catch (error) {
          console.error(`Error fetching challenge ${submission.challengeId}:`, error)
        }

        return {
          id: doc.id,
          challengeId: submission.challengeId,
          challengeTitle,
          participantId: submission.participantId,
          participantName: participant?.name || participant?.displayName || participant?.email || "Unknown",
          participantEmail: participant?.email || "No email",
          submittedPrompt: submission.submittedPrompt,
          llmScore: submission.llmScore,
          judgeScore: submission.judgeScore,
          finalScore: submission.finalScore,
          submittedAt: submission.submittedAt,
          evaluationStatus: submission.evaluationStatus || "pending"
        }
      })
    )

    // Sort submissions by submittedAt in memory (descending)
    submissions.sort((a, b) => {
      const aTime = a.submittedAt?.toMillis?.() || a.submittedAt?.seconds * 1000 || 0
      const bTime = b.submittedAt?.toMillis?.() || b.submittedAt?.seconds * 1000 || 0
      return bTime - aTime
    })

    return NextResponse.json({
      success: true,
      submissions
    })
  } catch (error: any) {
    console.error("❌ Error fetching participant submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch submissions", details: error.message },
      { status: 500 }
    )
  }
}
