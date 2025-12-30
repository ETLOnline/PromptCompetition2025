import express, { Request, Response } from "express";
import { db } from "../config/firebase-admin.js";
import { authenticateToken, AuthenticatedRequest } from "../utils/auth.js";

const router = express.Router();

// Azure B2 optimized configurations
const AZURE_B2_LIMITS = {
  maxConcurrentRequests: 30, // B2 plan limit
  memoryLimit: 3.5 * 1024 * 1024 * 1024, // 3.5GB B2 limit
  timeoutLimit: 230, // 230 seconds for B2
  maxCacheSize: 100, // Limit cache to prevent memory issues
};

// Memory-efficient in-memory cache with size limits
class LimitedCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize: number = AZURE_B2_LIMITS.maxCacheSize, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Azure-optimized caches
const competitionCache = new LimitedCache(50, 5 * 60 * 1000); // 5 min TTL
const rateLimitCache = new LimitedCache(200, 60 * 1000); // 1 min TTL for rate limiting

// Helper function to calculate byte size
const getByteSize = (str: string): number => {
  return Buffer.byteLength(str, 'utf8');
};

// Azure B2 optimized rate limiting
const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userAttempts = rateLimitCache.get(userId) || [];
  
  // Remove attempts older than 1 minute
  const recentAttempts = userAttempts.filter((time: number) => now - time < 60000);
  
  // B2 plan: Allow max 5 submissions per minute per user (conservative)
  if (recentAttempts.length >= 5) {
    return false;
  }
  
  recentAttempts.push(now);
  rateLimitCache.set(userId, recentAttempts);
  return true;
};

// Request timeout wrapper for Azure B2
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

// Optimized submission check with timeout
const checkExistingSubmission = async (
  competitionId: string,
  participantId: string,
  challengeId: string
) => {
  try {
    const submissionId = `${participantId}_${challengeId}`;
    const cacheKey = `submission_${submissionId}`;
    
    // Check cache first
    const cached = competitionCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    const submissionDocRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("submissions")
      .doc(submissionId);
    
    const submissionSnap = await withTimeout(submissionDocRef.get(), 10000);
    
    const result = submissionSnap.exists ? 
      { exists: true, submissionId, data: submissionSnap.data() } :
      { exists: false, submissionId: null, data: null };
    
    // Cache the result
    competitionCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Submission check error: ${error}`);
    return { exists: false, submissionId: null, data: null };
  }
};

// Azure B2 optimized competition cache
const getCachedCompetition = async (competitionId: string) => {
  const cacheKey = `competition_${competitionId}`;
  
  // Check cache first
  const cached = competitionCache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  try {
    const competitionRef = db.collection("competitions").doc(competitionId);
    const competitionSnap = await withTimeout(competitionRef.get(), 10000);
    
    if (!competitionSnap.exists) {
      competitionCache.set(cacheKey, null);
      return null;
    }
    
    const data = competitionSnap.data();
    competitionCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Competition fetch error: ${error}`);
    return null;
  }
};

// Health check endpoint for Azure monitoring
router.get("/health", (req: Request, res: Response) => {
  const healthInfo = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    azure: {
      plan: "B2",
      memory: {
        cacheSize: competitionCache.size(),
        rateLimitCacheSize: rateLimitCache.size(),
      }
    }
  };
  
  res.status(200).json(healthInfo);
});

// GET /submissions/check/:competitionId/:challengeId - Check if submission exists
router.get(
  "/check/:competitionId/:challengeId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId, challengeId } = req.params;
      const participantId = req.user?.uid;

      if (!participantId) {
        return res.status(400).json({ error: "User ID not found" });
      }

      const result = await withTimeout(
        checkExistingSubmission(competitionId, participantId, challengeId),
        15000 // 15 second timeout
      );

      return res.status(200).json({ 
        exists: result.exists,
        submissionId: result.submissionId,
        hasScore: result.data?.finalScore !== null
      });
    } catch (err: any) {
      console.error(`Check submission error: ${err.message}`);
      return res.status(500).json({ 
        error: "Failed to check submission", 
        detail: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }
);

// POST /submissions - Azure B2 optimized submission handler
router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { competitionId, challengeId, promptText } = req.body;
      const participantId = req.user?.uid;

      // Validation
      if (!competitionId || !challengeId || !promptText || !participantId) {
        return res.status(400).json({ 
          error: "Missing required fields: competitionId, challengeId, promptText" 
        });
      }

      // Azure B2 optimized rate limiting
      if (!checkRateLimit(participantId)) {
        return res.status(429).json({ 
          error: "Rate limit exceeded. Please wait before submitting again.",
          retryAfter: 60
        });
      }

      // Check size limit (Azure B2 optimized - 512KB for better performance)
      const byteSize = getByteSize(promptText);
      const maxBytes = 512 * 1024; // 512KB for Azure B2 performance

      if (byteSize > maxBytes) {
        return res.status(400).json({ 
          error: "Submission size exceeds 512KB limit for optimal performance." 
        });
      }

      // Get competition data with timeout
      const competitionData = await withTimeout(
        getCachedCompetition(competitionId), 
        10000
      );
      
      if (!competitionData) {
        return res.status(404).json({ error: "Competition not found" });
      }

      // Time validation
      const now = new Date();
      const startDeadline = new Date(competitionData.startDeadline);
      const endDeadline = new Date(competitionData.endDeadline);

      if (now < startDeadline) {
        return res.status(403).json({ error: "Competition has not started yet" });
      }

      if (now > endDeadline) {
        return res.status(403).json({ error: "Competition has ended" });
      }

      if (!competitionData.isActive) {
        return res.status(403).json({ error: "Competition is not active" });
      }

      // Check existing submission with timeout
      const existingCheck = await withTimeout(
        checkExistingSubmission(competitionId, participantId, challengeId),
        10000
      );

      const submissionData = {
        participantId,
        challengeId,
        promptText,
        submissionTime: new Date().toISOString(),
        finalScore: null,
        status: "pending",
        byteSize,
        processedAt: null,
      };

      const submissionId = `${participantId}_${challengeId}`;
      const submissionDocRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions")
        .doc(submissionId);

      if (existingCheck.exists) {
        // Update existing submission with timeout
        await withTimeout(
          submissionDocRef.update({
            promptText,
            submissionTime: submissionData.submissionTime,
            status: "pending",
            byteSize,
          }),
          15000
        );
        
        // Invalidate cache
        competitionCache.set(`submission_${submissionId}`, null);
        
        const processingTime = Date.now() - startTime;
        
        return res.status(200).json({ 
          success: true, 
          message: "Submission updated successfully",
          submissionId,
          isUpdate: true,
          processingTime: `${processingTime}ms`
        });
      } else {
        // Azure B2: Use separate operations for reliability
        try {
          // First create the submission
          await withTimeout(submissionDocRef.set(submissionData), 15000);

          // Then handle participant update separately
          const participantDocRef = db
            .collection("competitions")
            .doc(competitionId)
            .collection("participants")
            .doc(participantId);

          // Use transaction only for participant update
          await withTimeout(
            db.runTransaction(async (transaction) => {
              const participantDoc = await transaction.get(participantDocRef);
              
              if (participantDoc.exists) {
                const participantData = participantDoc.data();
                const currentCompletedChallenges = participantData?.completedChallenges || [];
                const currentChallengesCompleted = participantData?.challengesCompleted || 0;
                
                // Only update if this challenge isn't already completed
                if (!currentCompletedChallenges.includes(challengeId)) {
                  transaction.update(participantDocRef, {
                    challengesCompleted: currentChallengesCompleted + 1,
                    completedChallenges: [...currentCompletedChallenges, challengeId],
                    lastSubmission: new Date().toISOString(),
                  });
                }
              } else {
                // Create new participant document
                transaction.set(participantDocRef, {
                  userId: participantId,
                  challengesCompleted: 1,
                  completedChallenges: [challengeId],
                  joinedAt: new Date().toISOString(),
                  lastSubmission: new Date().toISOString(),
                });
              }
            }),
            15000 // 15 second timeout for transaction
          );

          const processingTime = Date.now() - startTime;

          return res.status(201).json({ 
            success: true, 
            message: "Submission created successfully",
            submissionId,
            isUpdate: false,
            processingTime: `${processingTime}ms`
          });
        } catch (transactionError) {
          console.error(`Participant update error: ${transactionError}`);
          
          // Fallback: Direct update without transaction
          try {
            const participantDocRef = db
              .collection("competitions")
              .doc(competitionId)
              .collection("participants")
              .doc(participantId);

            const participantSnap = await participantDocRef.get();
            
            if (participantSnap.exists) {
              const participantData = participantSnap.data();
              const currentCompletedChallenges = participantData?.completedChallenges || [];
              const currentChallengesCompleted = participantData?.challengesCompleted || 0;
              
              if (!currentCompletedChallenges.includes(challengeId)) {
                await participantDocRef.update({
                  challengesCompleted: currentChallengesCompleted + 1,
                  completedChallenges: [...currentCompletedChallenges, challengeId],
                  lastSubmission: new Date().toISOString(),
                });
              }
            } else {
              await participantDocRef.set({
                userId: participantId,
                challengesCompleted: 1,
                completedChallenges: [challengeId],
                joinedAt: new Date().toISOString(),
                lastSubmission: new Date().toISOString(),
              });
            }
          } catch (fallbackError) {
            console.error(`Fallback participant update failed: ${fallbackError}`);
            // Submission was still created, so return success but log the issue
          }
        }
      }
    } catch (err: any) {
      const processingTime = Date.now() - startTime;
      console.error(`Submission error after ${processingTime}ms:`, err);
      
      return res.status(500).json({ 
        error: "Failed to submit prompt", 
        detail: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        processingTime: `${processingTime}ms`
      });
    }
  }
);

// GET /submissions/:competitionId/:challengeId - Get specific submission
router.get(
  "/:competitionId/:challengeId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId, challengeId } = req.params;
      const participantId = req.user?.uid;

      if (!participantId) {
        return res.status(400).json({ error: "User ID not found" });
      }

      const result = await withTimeout(
        checkExistingSubmission(competitionId, participantId, challengeId),
        15000
      );

      if (!result.exists) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      return res.status(200).json({
        id: result.submissionId,
        ...result.data,
      });
    } catch (err: any) {
      console.error(`Fetch submission error: ${err.message}`);
      return res.status(500).json({ 
        error: "Failed to fetch submission", 
        detail: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }
);

// GET /submissions/competition/:competitionId - Azure B2 optimized pagination
router.get(
  "/competition/:competitionId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId } = req.params;
      const { limit = 25, offset = 0 } = req.query; // Reduced default limit for B2

      // Azure B2: Smaller page sizes for better performance
      const pageLimit = Math.min(Number(limit), 50); // Max 50 items per page

      const query = db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions")
        .orderBy("submissionTime", "desc")
        .limit(pageLimit)
        .offset(Number(offset));

      const submissionsSnapshot = await withTimeout(query.get(), 20000);

      const submissions = submissionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        submissions,
        hasMore: submissions.length === pageLimit,
        count: submissions.length,
        page: Math.floor(Number(offset) / pageLimit) + 1
      });
    } catch (err: any) {
      console.error(`Fetch competition submissions error: ${err.message}`);
      return res.status(500).json({ 
        error: "Failed to fetch submissions", 
        detail: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }
);

// GET /submissions/user/:competitionId - Get user's submissions
router.get(
  "/user/:competitionId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId } = req.params;
      const participantId = req.user?.uid;

      if (!participantId) {
        return res.status(400).json({ error: "User ID not found" });
      }

      const submissionsSnapshot = await withTimeout(
        db.collection("competitions")
          .doc(competitionId)
          .collection("submissions")
          .where("participantId", "==", participantId)
          .orderBy("submissionTime", "desc")
          .limit(20) // Limit user submissions for Azure B2
          .get(),
        15000
      );

      const submissions = submissionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json(submissions);
    } catch (err: any) {
      console.error(`Fetch user submissions error: ${err.message}`);
      return res.status(500).json({ 
        error: "Failed to fetch user submissions", 
        detail: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }
);

// GET /submissions/admin/competition/:competitionId - Get all submissions for admin
router.get(
  "/admin/competition/:competitionId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId } = req.params;
      const userRole = req.user?.role;

      // Check if user is admin or superadmin
      if (!userRole || (userRole !== 'admin' && userRole !== 'superadmin')) {
        return res.status(403).json({ error: "Access denied. Admin privileges required." });
      }

      const submissionsSnapshot = await withTimeout(
        db.collection("competitions")
          .doc(competitionId)
          .collection("submissions")
          .orderBy("submissionTime", "desc")
          .get(),
        30000 // Longer timeout for admin operations
      );

      console.log(`Admin fetched ${submissionsSnapshot.size} submissions for competition ${competitionId}`);

      // Extract unique participant IDs
      const participantIds = [...new Set(
        submissionsSnapshot.docs.map(doc => doc.data().participantId).filter(Boolean)
      )];

      // Batch fetch user details if we have participant IDs
      let usersMap = new Map<string, any>();
      if (participantIds.length > 0) {
        try {
          // Split into chunks of 10 for Firestore 'in' query limit
          const chunks = [];
          for (let i = 0; i < participantIds.length; i += 10) {
            chunks.push(participantIds.slice(i, i + 10));
          }

          // Fetch users in parallel for each chunk
          const userPromises = chunks.map(async (chunk) => {
            const usersSnapshot = await withTimeout(
              db.collection("users")
                .where("__name__", "in", chunk)
                .get(),
              15000
            );
            return usersSnapshot.docs;
          });

          const userChunks = await Promise.all(userPromises);

          // Build users map
          userChunks.flat().forEach(doc => {
            usersMap.set(doc.id, doc.data());
          });

          console.log(`Fetched ${usersMap.size} user details for ${participantIds.length} participants`);
        } catch (userError) {
          console.error(`Error fetching user details: ${userError}`);
          // Continue without user details rather than failing the entire request
        }
      }

      const submissions = submissionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const participantId = data.participantId;

        // Get user details if available
        const userData = usersMap.get(participantId);
        const user = userData ? {
          fullName: userData.fullName || userData.displayName || 'Unknown User',
          email: userData.email || '',
          displayName: userData.displayName || userData.fullName || 'Unknown User'
        } : undefined;

        return {
          id: doc.id,
          ...data,
          user
        };
      });

      console.log(`Admin competition submissions retrieved: ${submissions.length} items`);

      return res.status(200).json({
        submissions,
        totalCount: submissions.length,
        competitionId
      });
    } catch (err: any) {
      console.error(`Fetch admin competition submissions error: ${err.message}`);
      return res.status(500).json({
        error: "Failed to fetch submissions",
        detail: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }
);

export default router;