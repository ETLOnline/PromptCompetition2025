import { Request, Response } from "express";
import { db } from "../../config/firebase-admin.js";

interface JudgeProgress {
  judgeId: string;
  judgeName: string;
  totalAssignedParticipants: number;
  evaluatedParticipants: number;
  batchProgress: {
    [batchId: string]: {
      batchName: string;
      assignedParticipants: string[];
      challengeProgress: {
        challengeId: string;
        totalParticipants: number;
        evaluatedParticipants: number;
      }[];
    };
  };
}

export async function fetchLevel2JudgeProgress(
  req: Request,
  res: Response
) {
  try {
    const { competitionId } = req.params;

    // Fetch all judges
    const judgesSnapshot = await db
      .collection("competitions")
      .doc(competitionId)
      .collection("judges")
      .get();

    if (judgesSnapshot.empty) {
      return res.status(200).json({ judges: [] });
    }

    const judgesProgress: JudgeProgress[] = [];

    // Fetch all schedules to get challenge IDs per batch
    const schedulesSnapshot = await db
      .collection("competitions")
      .doc(competitionId)
      .collection("schedules")
      .get();

    const schedulesMap = new Map<string, any>();
    schedulesSnapshot.docs.forEach(doc => {
      schedulesMap.set(doc.id, doc.data());
    });

    for (const judgeDoc of judgesSnapshot.docs) {
      const judgeData = judgeDoc.data();
      const judgeId = judgeDoc.id;
      const judgeName = judgeData.judgeName || judgeData.name || judgeData.email || `Judge ${judgeId.slice(0, 8)}`;
      const assignments = judgeData.assignments || {};

      // Skip judges with no batch assignments
      const batchIds = Object.keys(assignments).filter(key => 
        key !== 'competitionId' && 
        key !== 'judgeId' && 
        key !== 'judgeName' && 
        Array.isArray(assignments[key])
      );

      if (batchIds.length === 0) {
        continue; // Hide judges with no assignments
      }

      // Calculate total assigned participants across all batches
      let totalAssignedParticipants = 0;
      const batchProgress: JudgeProgress['batchProgress'] = {};

      for (const batchId of batchIds) {
        const assignedParticipants = assignments[batchId] || [];
        totalAssignedParticipants += assignedParticipants.length;

        const scheduleData = schedulesMap.get(batchId);
        const batchName = scheduleData?.batchName || `Batch ${batchId}`;
        const challengeIds = scheduleData?.challengeIds || [];

        // Initialize challenge progress for this batch
        const challengeProgress: {
          challengeId: string;
          totalParticipants: number;
          evaluatedParticipants: number;
        }[] = [];

        for (const challengeId of challengeIds) {
          let evaluatedCount = 0;

          // Check each assigned participant to see if they've been evaluated for this challenge
          for (const participantId of assignedParticipants) {
            try {
              const evalDoc = await db
                .collection("competitions")
                .doc(competitionId)
                .collection("judges")
                .doc(judgeId)
                .collection("level2Evaluations")
                .doc(participantId)
                .get();

              if (evalDoc.exists) {
                const evalData = evalDoc.data();
                const evaluatedChallenges = evalData?.evaluatedChallenges || [];
                
                if (evaluatedChallenges.includes(challengeId)) {
                  evaluatedCount++;
                }
              }
            } catch (error) {
              console.error(`Error checking evaluation for participant ${participantId}, challenge ${challengeId}:`, error);
            }
          }

          challengeProgress.push({
            challengeId,
            totalParticipants: assignedParticipants.length,
            evaluatedParticipants: evaluatedCount,
          });
        }

        batchProgress[batchId] = {
          batchName,
          assignedParticipants,
          challengeProgress,
        };
      }

      // Count evaluated participants (documents in level2Evaluations subcollection)
      let evaluatedParticipants = 0;
      try {
        const evaluationsSnapshot = await db
          .collection("competitions")
          .doc(competitionId)
          .collection("judges")
          .doc(judgeId)
          .collection("level2Evaluations")
          .get();

        // Only count participants that are actually assigned to this judge
        const allAssignedParticipants = new Set<string>();
        batchIds.forEach(batchId => {
          const participants = assignments[batchId] || [];
          participants.forEach((p: string) => allAssignedParticipants.add(p));
        });

        evaluationsSnapshot.docs.forEach(doc => {
          const participantId = doc.id;
          if (allAssignedParticipants.has(participantId)) {
            const evalData = doc.data();
            const batchId = evalData.batchId;
            
            // Check if this participant has completed all challenges for their batch
            if (batchId && schedulesMap.has(batchId)) {
              const scheduleData = schedulesMap.get(batchId);
              const challengeIds = scheduleData?.challengeIds || [];
              const evaluatedChallenges = evalData.evaluatedChallenges || [];
              
              // Only count as "evaluated" if all challenges are done
              if (challengeIds.length > 0 && evaluatedChallenges.length === challengeIds.length) {
                evaluatedParticipants++;
              }
            }
          }
        });
      } catch (error) {
        console.error(`Error fetching evaluations for judge ${judgeId}:`, error);
      }

      judgesProgress.push({
        judgeId,
        judgeName,
        totalAssignedParticipants,
        evaluatedParticipants,
        batchProgress,
      });
    }

    res.status(200).json({ judges: judgesProgress });
  } catch (error) {
    console.error("Failed to fetch Level 2 judge progress:", error);
    res.status(500).json({ message: "Failed to fetch Level 2 judge progress" });
  }
}
