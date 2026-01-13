import { Request, Response } from "express";
import { db } from "../../config/firebase-admin.js";
import { FieldValue } from "firebase-admin/firestore";

interface ParticipantScore {
  participantId: string;
  fullName: string;
  email: string;
  weightedFinalScore: number;
  finalScore: number;
  batchId: string;
  challengeScores: {
    [challengeId: string]: {
      averageScore: number;
      judgeCount: number;
    };
  };
}

export async function generateLevel2FinalLeaderboard(
  req: Request,
  res: Response
) {
  try {
    const { competitionId } = req.params;

    // Step 1: Check if all judges have completed their evaluations
    const judgeCompletionCheck = await checkAllJudgesCompleted(competitionId);
    
    if (!judgeCompletionCheck.allCompleted) {
      return res.status(400).json({
        message: "All judges must complete their evaluations before generating leaderboard",
        details: judgeCompletionCheck.details
      });
    }

    // Step 2: Fetch all schedules to get batch information
    const schedulesSnapshot = await db
      .collection("competitions")
      .doc(competitionId)
      .collection("schedules")
      .get();

    const batchesMap = new Map<string, { challengeIds: string[]; totalMarks: number }>();
    
    schedulesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const challengeIds = data.challengeIds || [];
      batchesMap.set(doc.id, {
        challengeIds,
        totalMarks: challengeIds.length * 100 // 100 marks per challenge
      });
    });

    // Step 3: Fetch all participants
    const participantsSnapshot = await db
      .collection("competitions")
      .doc(competitionId)
      .collection("participants")
      .get();

    if (participantsSnapshot.empty) {
      return res.status(400).json({ message: "No participants found" });
    }

    const participantScores: ParticipantScore[] = [];

    // Step 4: Calculate scores for each participant
    for (const participantDoc of participantsSnapshot.docs) {
      const participantData = participantDoc.data();
      const participantId = participantDoc.id;
      const assignedBatchId = participantData.assignedBatchId;
      const assignedJudgeIds = participantData.assignedJudgeIds || [];

      if (!assignedBatchId || assignedJudgeIds.length === 0) {
        console.warn(`Participant ${participantId} has no batch or judges assigned`);
        continue;
      }

      const batchInfo = batchesMap.get(assignedBatchId);
      if (!batchInfo) {
        console.warn(`Batch ${assignedBatchId} not found for participant ${participantId}`);
        continue;
      }

      // Get scores from all assigned judges
      const challengeScoresMap = new Map<string, number[]>();

      for (const judgeId of assignedJudgeIds) {
        try {
          const evaluationDoc = await db
            .collection("competitions")
            .doc(competitionId)
            .collection("judges")
            .doc(judgeId)
            .collection("level2Evaluations")
            .doc(participantId)
            .get();

          if (evaluationDoc.exists) {
            const evalData = evaluationDoc.data();
            const evaluations = evalData?.evaluations || {};

            // Collect scores for each challenge
            batchInfo.challengeIds.forEach(challengeId => {
              if (evaluations[challengeId]) {
                const score = evaluations[challengeId].score || 0;
                
                if (!challengeScoresMap.has(challengeId)) {
                  challengeScoresMap.set(challengeId, []);
                }
                challengeScoresMap.get(challengeId)!.push(score);
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching evaluation for judge ${judgeId}, participant ${participantId}:`, error);
        }
      }

      // Calculate average scores for each challenge
      let weightedFinalScore = 0;
      const challengeScores: ParticipantScore['challengeScores'] = {};

      batchInfo.challengeIds.forEach(challengeId => {
        const scores = challengeScoresMap.get(challengeId) || [];
        
        if (scores.length > 0) {
          const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
          weightedFinalScore += averageScore;
          
          challengeScores[challengeId] = {
            averageScore,
            judgeCount: scores.length
          };
        } else {
          // No scores from judges for this challenge
          challengeScores[challengeId] = {
            averageScore: 0,
            judgeCount: 0
          };
        }
      });

      // Calculate final score as percentage
      const finalScore = batchInfo.totalMarks > 0 
        ? (weightedFinalScore / batchInfo.totalMarks) * 100 
        : 0;

      participantScores.push({
        participantId,
        fullName: participantData.fullName || participantData.name || "Unknown",
        email: participantData.email || "",
        weightedFinalScore: Math.round(weightedFinalScore * 100) / 100,
        finalScore: Math.round(finalScore * 100) / 100,
        batchId: assignedBatchId,
        challengeScores
      });
    }

    // Step 5: Sort by finalScore (descending) and assign ranks
    participantScores.sort((a, b) => b.finalScore - a.finalScore);

    // Assign ranks (handle ties)
    let currentRank = 1;
    for (let i = 0; i < participantScores.length; i++) {
      if (i > 0 && participantScores[i].finalScore === participantScores[i - 1].finalScore) {
        // Same score as previous, keep same rank
        participantScores[i] = { ...participantScores[i] };
      } else {
        currentRank = i + 1;
      }
    }

    // Step 6: Save to finalleaderboard collection
    const batch = db.batch();
    const leaderboardRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("finalLeaderboard");

    // Delete existing leaderboard entries
    const existingLeaderboard = await leaderboardRef.get();
    existingLeaderboard.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add new leaderboard entries
    participantScores.forEach((participant, index) => {
      const docRef = leaderboardRef.doc(participant.participantId);
      batch.set(docRef, {
        participantId: participant.participantId,
        fullName: participant.fullName,
        email: participant.email,
        weightedFinalScore: participant.weightedFinalScore,
        finalScore: participant.finalScore,
        rank: index + 1,
        batchId: participant.batchId,
        challengeScores: participant.challengeScores,
        generatedAt: FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    // Step 7: Update competition document
    await db
      .collection("competitions")
      .doc(competitionId)
      .update({
        hasFinalLeaderboard: true,
        finalLeaderboardGeneratedAt: FieldValue.serverTimestamp()
      });

    res.status(200).json({
      message: "Level 2 final leaderboard generated successfully",
      totalParticipants: participantScores.length,
      leaderboard: participantScores.map(p => ({
        rank: participantScores.findIndex(ps => ps.participantId === p.participantId) + 1,
        fullName: p.fullName,
        finalScore: p.finalScore,
        weightedFinalScore: p.weightedFinalScore
      }))
    });
  } catch (error) {
    console.error("Failed to generate Level 2 final leaderboard:", error);
    res.status(500).json({ message: "Failed to generate Level 2 final leaderboard" });
  }
}

// Helper function to check if all judges have completed evaluations
async function checkAllJudgesCompleted(competitionId: string) {
  try {
    // Fetch all schedules
    const schedulesSnapshot = await db
      .collection("competitions")
      .doc(competitionId)
      .collection("schedules")
      .get();

    const schedulesMap = new Map<string, any>();
    schedulesSnapshot.docs.forEach(doc => {
      schedulesMap.set(doc.id, doc.data());
    });

    // Fetch all judges
    const judgesSnapshot = await db
      .collection("competitions")
      .doc(competitionId)
      .collection("judges")
      .get();

    if (judgesSnapshot.empty) {
      return { allCompleted: false, details: "No judges assigned" };
    }

    const incompleteJudges: string[] = [];

    for (const judgeDoc of judgesSnapshot.docs) {
      const judgeData = judgeDoc.data();
      const judgeId = judgeDoc.id;
      const judgeName = judgeData.judgeName || judgeData.name || `Judge ${judgeId.slice(0, 8)}`;
      const assignments = judgeData.assignments || {};

      // Get batch assignments
      const batchIds = Object.keys(assignments).filter(key => 
        key !== 'competitionId' && 
        key !== 'judgeId' && 
        key !== 'judgeName' && 
        Array.isArray(assignments[key])
      );

      if (batchIds.length === 0) {
        continue; // Skip judges with no assignments
      }

      // Count total assigned participants
      let totalAssignedParticipants = 0;
      const allAssignedParticipants = new Set<string>();

      batchIds.forEach(batchId => {
        const participants = assignments[batchId] || [];
        participants.forEach((p: string) => allAssignedParticipants.add(p));
        totalAssignedParticipants += participants.length;
      });

      // Count evaluated participants (with all challenges completed)
      const evaluationsSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("judges")
        .doc(judgeId)
        .collection("level2Evaluations")
        .get();

      let fullyEvaluatedCount = 0;

      evaluationsSnapshot.docs.forEach(doc => {
        const participantId = doc.id;
        if (allAssignedParticipants.has(participantId)) {
          const evalData = doc.data();
          const batchId = evalData.batchId;
          
          if (batchId && schedulesMap.has(batchId)) {
            const scheduleData = schedulesMap.get(batchId);
            const challengeIds = scheduleData?.challengeIds || [];
            const evaluatedChallenges = evalData.evaluatedChallenges || [];
            
            // Only count as fully evaluated if all challenges are done
            if (challengeIds.length > 0 && evaluatedChallenges.length === challengeIds.length) {
              fullyEvaluatedCount++;
            }
          }
        }
      });

      // Check if judge has completed all evaluations
      if (fullyEvaluatedCount < totalAssignedParticipants) {
        incompleteJudges.push(`${judgeName} (${fullyEvaluatedCount}/${totalAssignedParticipants})`);
      }
    }

    if (incompleteJudges.length > 0) {
      return {
        allCompleted: false,
        details: `Incomplete evaluations: ${incompleteJudges.join(", ")}`
      };
    }

    return { allCompleted: true, details: "All judges have completed their evaluations" };
  } catch (error) {
    console.error("Error checking judge completion:", error);
    return { allCompleted: false, details: "Error checking judge status" };
  }
}
