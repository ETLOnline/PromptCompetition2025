import { Router, Response } from "express";
import { db } from "../config/firebase-admin.js";
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from "../utils/auth.js";

const router = Router();

interface SubmissionData {
  userId: string;
  ratingSum: number;
  voteCount: number;
  ratingAvg: number;
}

interface UserAggregateData {
  userId: string;
  totalRatingSum: number;
  totalVoteCount: number;
  submissionCount: number;
  bayesScore: number;
}

/**
 * Generate Overall Leaderboard
 * Aggregates all submissions across all daily challenges and calculates Bayesian scores
 * 
 * Route: POST /api/leaderboard/overall/generate
 * 
 * Algorithm:
 * 1. Fetch all submissions using collectionGroup query
 * 2. Aggregate data per user (ratingSum, voteCount, submissionCount)
 * 3. Calculate global constants:
 *    - m (Prior): Average rating across all votes (TotalGlobalRatingSum / TotalGlobalVoteCount)
 *    - C (Confidence): Average votes per user (TotalGlobalVoteCount / UniqueUserCount)
 * 4. Calculate Bayesian Score for each user:
 *    Score = (UserTotalRatingSum + (C * m)) / (UserTotalVoteCount + C)
 * 5. Write results to leaderboard_overall collection using batch operations
 */
router.post(
  "/generate",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("Starting overall leaderboard generation...");

      // Step 1: Fetch all submissions using collectionGroup query
      const submissionsSnapshot = await db.collectionGroup("submissions").get();

      if (submissionsSnapshot.empty) {
        return res.status(200).json({
          message: "No submissions found in the system",
          stats: {
            totalUsers: 0,
            totalSubmissions: 0,
            totalVotes: 0,
            totalRatingSum: 0,
          },
        });
      }

      // Step 2: Aggregate data per user
      const userDataMap = new Map<string, {
        totalRatingSum: number;
        totalVoteCount: number;
        submissionCount: number;
      }>();

      let globalRatingSum = 0;
      let globalVoteCount = 0;

      submissionsSnapshot.forEach((doc) => {
        const data = doc.data() as SubmissionData;
        const userId = data.userId;
        
        // Validate submission data
        if (!userId) {
          console.warn(`Skipping submission without userId: ${doc.ref.path}`);
          return;
        }

        const ratingSum = typeof data.ratingSum === 'number' ? data.ratingSum : 0;
        const voteCount = typeof data.voteCount === 'number' ? data.voteCount : 0;

        // Aggregate per user
        if (!userDataMap.has(userId)) {
          userDataMap.set(userId, {
            totalRatingSum: 0,
            totalVoteCount: 0,
            submissionCount: 0,
          });
        }

        const userData = userDataMap.get(userId)!;
        userData.totalRatingSum += ratingSum;
        userData.totalVoteCount += voteCount;
        userData.submissionCount += 1;

        // Aggregate globally
        globalRatingSum += ratingSum;
        globalVoteCount += voteCount;
      });

      const uniqueUserCount = userDataMap.size;

      console.log(`Aggregated data for ${uniqueUserCount} users`);
      console.log(`Global stats - RatingSum: ${globalRatingSum}, VoteCount: ${globalVoteCount}`);

      // Handle edge case: no votes in system
      if (globalVoteCount === 0) {
        return res.status(200).json({
          message: "No votes found in the system yet",
          stats: {
            totalUsers: uniqueUserCount,
            totalSubmissions: submissionsSnapshot.size,
            totalVotes: 0,
            totalRatingSum: 0,
          },
        });
      }

      // Step 3: Calculate global constants for Bayesian scoring
      // m (Prior): The average rating across all votes in the system
      const m = globalRatingSum / globalVoteCount;
      
      // C (Confidence): The average number of votes per user
      // This represents the "minimum votes" needed for a rating to be reliable
      const C = globalVoteCount / uniqueUserCount;

      console.log(`Bayesian constants - m (prior): ${m}, C (confidence): ${C}`);

      // Step 4: Calculate Bayesian Score for each user
      const leaderboardData: UserAggregateData[] = [];

      userDataMap.forEach((userData, userId) => {
        // Bayesian Average Formula:
        // Score = (UserTotalRatingSum + (C * m)) / (UserTotalVoteCount + C)
        //
        // This formula:
        // - Pulls scores toward the global average (m) when a user has few votes
        // - Approaches the user's true average as they get more votes (C acts as threshold)
        // - Prevents users with 1-2 high votes from dominating the leaderboard
        const bayesScore = userData.totalVoteCount === 0 
          ? 0 
          : (userData.totalRatingSum + (C * m)) / (userData.totalVoteCount + C);

        leaderboardData.push({
          userId,
          totalRatingSum: userData.totalRatingSum,
          totalVoteCount: userData.totalVoteCount,
          submissionCount: userData.submissionCount,
          bayesScore: parseFloat(bayesScore.toFixed(4)), // Round to 4 decimal places
        });
      });

      // Sort by Bayesian score descending
      leaderboardData.sort((a, b) => b.bayesScore - a.bayesScore);

      console.log(`Calculated Bayesian scores for ${leaderboardData.length} users`);

      // Step 5: Write results to leaderboard_overall collection using batch operations
      // Firestore batch limit is 500 operations, so we need to chunk if necessary
      const BATCH_SIZE = 500;
      const timestamp = new Date();

      let totalWritten = 0;

      for (let i = 0; i < leaderboardData.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = leaderboardData.slice(i, i + BATCH_SIZE);

        chunk.forEach((userData) => {
          const docRef = db.collection("leaderboard_overall").doc(userData.userId);
          batch.set(docRef, {
            userId: userData.userId,
            totalRatingSum: userData.totalRatingSum,
            totalVoteCount: userData.totalVoteCount,
            submissionCount: userData.submissionCount,
            bayesScore: userData.bayesScore,
            lastUpdatedAt: timestamp,
          });
        });

        await batch.commit();
        totalWritten += chunk.length;
        console.log(`Written batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} documents`);
      }

      // Update metadata document with generation stats
      await db.collection("leaderboard_overall").doc("_metadata").set({
        lastGeneratedAt: timestamp,
        totalUsers: uniqueUserCount,
        totalSubmissions: submissionsSnapshot.size,
        totalVotes: globalVoteCount,
        totalRatingSum: globalRatingSum,
        bayesianConstants: {
          m: parseFloat(m.toFixed(4)),
          C: parseFloat(C.toFixed(4)),
        },
      });

      console.log(`Overall leaderboard generation completed. Written ${totalWritten} user records.`);

      return res.status(200).json({
        message: "Overall leaderboard generated successfully",
        stats: {
          totalUsers: uniqueUserCount,
          totalSubmissions: submissionsSnapshot.size,
          totalVotes: globalVoteCount,
          totalRatingSum: globalRatingSum,
          recordsWritten: totalWritten,
          bayesianConstants: {
            m: parseFloat(m.toFixed(4)),
            C: parseFloat(C.toFixed(4)),
          },
        },
      });

    } catch (error) {
      console.error("Error generating overall leaderboard:", error);
      return res.status(500).json({
        error: "Failed to generate overall leaderboard",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * Get Overall Leaderboard
 * Fetches the aggregated leaderboard data
 * 
 * Route: GET /api/leaderboard/overall
 * Query params:
 *   - limit: Number of top users to return (default: 100)
 */
router.get(
  "/",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      // First, fetch metadata to get the confidence constant C
      const metadataDoc = await db.collection("leaderboard_overall").doc("_metadata").get();
      const metadata = metadataDoc.exists ? metadataDoc.data() : null;
      const C = metadata?.bayesianConstants?.C || 0;

      console.log(`Fetching leaderboard with minimum votes threshold C = ${C}`);

      // Fetch leaderboard data sorted by Bayesian score (fetch more than needed to account for filtering)
      const fetchLimit = Math.max(limit * 2, 50); // Fetch at least 50 or 2x the requested limit
      const leaderboardSnapshot = await db
        .collection("leaderboard_overall")
        .where("bayesScore", ">", 0)
        .orderBy("bayesScore", "desc")
        .limit(fetchLimit)
        .get();

      const leaderboardData: any[] = [];
      const userIds: string[] = [];

      leaderboardSnapshot.forEach((doc) => {
        if (doc.id === "_metadata") return; // Skip metadata document
        
        const data = doc.data();
        
        // Only include users who have at least C votes (confidence threshold)
        if (data.totalVoteCount >= C) {
          leaderboardData.push({
            userId: data.userId,
            totalRatingSum: data.totalRatingSum,
            totalVoteCount: data.totalVoteCount,
            submissionCount: data.submissionCount,
            bayesScore: data.bayesScore,
            lastUpdatedAt: data.lastUpdatedAt,
          });
          userIds.push(data.userId);
        }
      });

      // Take only the requested limit from the filtered results
      const finalLeaderboardData = leaderboardData.slice(0, limit);

      console.log(`Filtered leaderboard: ${leaderboardData.length} users meet C >= ${C} threshold, returning top ${finalLeaderboardData.length}`);

      // Fetch user details from users collection
      const usersPromises = userIds.slice(0, limit).map((userId) =>
        db.collection("users").doc(userId).get()
      );
      const usersSnapshots = await Promise.all(usersPromises);

      // Merge user details with leaderboard data
      const enrichedLeaderboard = finalLeaderboardData.map((entry, index) => {
        const userDoc = usersSnapshots[index];
        const userData = userDoc.exists ? userDoc.data() : null;

        return {
          ...entry,
          rank: index + 1,
          fullName: userData?.fullName || "Unknown User",
          email: userData?.email || "",
          userType: userData?.userType || "participant",
        };
      });

      return res.status(200).json({
        leaderboard: enrichedLeaderboard,
        metadata: metadata || {
          lastGeneratedAt: null,
          totalUsers: 0,
          totalSubmissions: 0,
          totalVotes: 0,
          totalRatingSum: 0,
        },
      });

    } catch (error) {
      console.error("Error fetching overall leaderboard:", error);
      return res.status(500).json({
        error: "Failed to fetch overall leaderboard",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
