import express from "express"
import { db } from "../config/firebase-admin.js"
import { runJudges } from "../utils/judgeLlms.js"
import { cleanRubricData } from "../utils/sanitise.js";

const router = express.Router()

type RubricItem = { name: string; description: string; weight: number }
type ChallengeConfig = { rubric: RubricItem[]; problemStatement?: string | null }

// Firestore-based lock management (replaces in-memory state)
interface EvaluationLock {
  isLocked: boolean
  lockedBy: string | null
  lockedByUser: string | null
  lockedAt: string | null
  lockReason: string | null
}

// Helper function to acquire global evaluation lock
const acquireLock = async (competitionId: string, userId: string): Promise<boolean> => {
  try {
    const lockRef = db.collection('evaluation-locks').doc('global')
    
    // Use Firestore transactions for atomic lock acquisition
    const result = await db.runTransaction(async (transaction) => {
      const lockDoc = await transaction.get(lockRef)
      
      if (lockDoc.exists && lockDoc.data()?.isLocked) {
        // Check if lock is stale (>1 hour old)
        const lockAge = Date.now() - new Date(lockDoc.data()?.lockedAt).getTime()
        if (lockAge > 3600000) { // 1 hour
          // Lock is stale, we can take it
          transaction.update(lockRef, {
            isLocked: true,
            lockedBy: competitionId,
            lockedByUser: userId,
            lockedAt: new Date().toISOString(),
            lockReason: 'Starting evaluation (recovered from stale lock)'
          })
          return true
        }
        return false // Lock is valid and recent
      }
      
      // No lock exists, we can take it
      transaction.set(lockRef, {
        isLocked: true,
        lockedBy: competitionId,
        lockedByUser: userId,
        lockedAt: new Date().toISOString(),
        lockReason: 'Starting evaluation'
      })
      return true
    })
    
    return result
  } catch (error) {
    console.error('Failed to acquire lock:', error)
    return false
  }
}

// Helper function to release global evaluation lock
const releaseLock = async (competitionId: string): Promise<void> => {
  try {
    const lockRef = db.collection('evaluation-locks').doc('global')
    await lockRef.update({
      isLocked: false,
      lockedBy: null,
      lockedByUser: null,
      lockedAt: null,
      lockReason: null
    })
  } catch (error) {
    console.error('Failed to release lock:', error)
  }
}

// Helper function to check if lock is held by a specific competition
const isLockedByCompetition = async (competitionId: string): Promise<boolean> => {
  try {
    const lockRef = db.collection('evaluation-locks').doc('global')
    const lockDoc = await lockRef.get()
    
    if (lockDoc.exists) {
      const lockData = lockDoc.data() as EvaluationLock
      return lockData.isLocked && lockData.lockedBy === competitionId
    }
    return false
  } catch (error) {
    console.error('Failed to check lock status:', error)
    return false
  }
}

// Helper function to check if any evaluation is locked
const isAnyEvaluationLocked = async (): Promise<boolean> => {
  try {
    const lockRef = db.collection('evaluation-locks').doc('global')
    const lockDoc = await lockRef.get()
    
    if (lockDoc.exists) {
      const lockData = lockDoc.data() as EvaluationLock
      return lockData.isLocked
    }
    return false
  } catch (error) {
    console.error('Failed to check global lock status:', error)
    return false
  }
}

// Helper function to get current lock information
const getCurrentLockInfo = async (): Promise<EvaluationLock | null> => {
  try {
    const lockRef = db.collection('evaluation-locks').doc('global')
    const lockDoc = await lockRef.get()
    
    if (lockDoc.exists) {
      return lockDoc.data() as EvaluationLock
    }
    return null
  } catch (error) {
    console.error('Failed to get lock info:', error)
    return null
  }
}

// Lock recovery mechanism for server restarts
export const recoverLocksOnStartup = async (): Promise<void> => {
  try {
    
    const locksSnapshot = await db.collection('evaluation-locks').get()
    
    for (const lockDoc of locksSnapshot.docs) {
      const lockData = lockDoc.data() as EvaluationLock
      
      if (lockData.isLocked) {
        const lockAge = Date.now() - new Date(lockData.lockedAt).getTime()
        const maxLockAge = 3600000 // 1 hour
        
        if (lockAge > maxLockAge) {
          console.log(`🔓 Releasing stale lock for competition: ${lockData.lockedBy}`)
          
          // Release stale lock
          await lockDoc.ref.update({
            isLocked: false,
            lockedBy: null,
            lockedByUser: null,
            lockedAt: null,
            lockReason: 'Released on server startup (stale)'
          })
          
          // Also update evaluation progress to 'paused' if it was running
          if (lockData.lockedBy) {
            try {
              await db
                .collection('evaluation-progress')
                .doc(lockData.lockedBy)
                .update({
                  evaluationStatus: 'paused',
                  lastUpdateTime: new Date().toISOString(),
                  pauseReason: 'Server restart - evaluation paused'
                })
            } catch (progressError) {
              console.warn(`Could not update progress for ${lockData.lockedBy}:`, progressError)
            }
          }
        } else {
          console.log(`🔒 Valid lock found for competition: ${lockData.lockedBy}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Lock recovery failed:', error)
  }
}

// Helper function to calculate batch size dynamically for optimal parallel processing
const calculateBatchSize = (totalSubmissions: number): number => {
  // For parallel processing, we want to balance concurrency with system resources
  if (totalSubmissions <= 20) return 3      // Small competitions: 3 concurrent
  if (totalSubmissions <= 50) return 5     // Medium competitions: 5 concurrent  
  if (totalSubmissions <= 100) return 8    // Large competitions: 8 concurrent
  if (totalSubmissions <= 200) return 10   // Very large: 10 concurrent
  if (totalSubmissions <= 500) return 15   // Massive: 15 concurrent
  return 20                                 // Maximum: 20 concurrent
}

// Helper function to update progress in Firestore
const updateProgressInFirestore = async (competitionId: string, updates: any) => {
  try {
    await db
      .collection('evaluation-progress')
      .doc(competitionId)
      .set(updates, { merge: true })
  } catch (error) {
    console.error(`Failed to update progress in Firestore for ${competitionId}:`, error)
  }
}

// Helper function to check if evaluation should stop
const shouldStopEvaluation = async (competitionId: string): Promise<boolean> => {
  try {
    // Check if global lock is still held by this competition
    const isLocked = await isLockedByCompetition(competitionId)
    if (!isLocked) {
      return true
    }
    
    // Check if evaluation has been paused in Firestore
    const progressDoc = await db
      .collection('evaluation-progress')
      .doc(competitionId)
      .get()
    
    if (progressDoc.exists) {
      const progressData = progressDoc.data()
      if (progressData?.evaluationStatus === 'paused') {
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error(`Error checking evaluation status for ${competitionId}:`, error)
    return false
  }
}

// Helper function to get current evaluated count from Firestore
const getCurrentEvaluatedCount = async (competitionId: string): Promise<number> => {
  try {
    const progressDoc = await db
      .collection('evaluation-progress')
      .doc(competitionId)
      .get()
    
    if (progressDoc.exists) {
      const data = progressDoc.data()
      return data?.evaluatedSubmissions || 0
    }
    return 0
  } catch (error) {
    console.error(`Failed to get current evaluated count for ${competitionId}:`, error)
    return 0
  }
}

router.post("/start-evaluation", async (req, res) => {
  let competitionId: string | undefined
  let userId: string | undefined
  
  try {
    const body = req.body
    competitionId = body.competitionId
    userId = body.userId

    if (!competitionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if evaluation is locked by another competition
    const isLocked = await isAnyEvaluationLocked()
    if (isLocked) {
      const lockInfo = await getCurrentLockInfo()
      if (lockInfo?.lockedBy !== competitionId) {
        return res.status(409).json({ 
          error: `Evaluation is currently locked by competition ${lockInfo?.lockedBy}` 
        })
      }
    }

    // Acquire global lock using Firestore
    const lockAcquired = await acquireLock(competitionId, userId)
    if (!lockAcquired) {
      return res.status(409).json({ 
        error: 'Failed to acquire evaluation lock' 
      })
    }

    // Get all submissions that haven't been evaluated
    const submissionsRef = db.collection(`competitions/${competitionId}/submissions`)
    
    // Check for unevaluated submissions
    const submissionsSnap = await submissionsRef.where('finalScore', '==', null).get()
    
    if (submissionsSnap.empty) {
      // Release lock if no submissions to evaluate
      await releaseLock(competitionId)
      
      return res.json({ message: 'No submissions to evaluate' })
    }

    const submissions = submissionsSnap.docs
    const totalSubmissions = submissions.length
    console.log(`🚀 Starting evaluation for competition ${competitionId}: ${totalSubmissions} submissions`)

    // Initialize progress in Firestore - This creates the collection and document
    await updateProgressInFirestore(competitionId, {
      totalSubmissions,
      evaluatedSubmissions: 0,
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
      evaluationStatus: 'running'
    })

    // Start evaluation in background
    evaluateSubmissions(competitionId, submissions)

    console.log('✅ Evaluation started successfully, sending response')
    res.json({ 
      message: 'Evaluation started successfully', 
      totalSubmissions 
    })

  } catch (error) {
    console.error('❌ Start evaluation error:', error)
    
    // Release lock on error if we have a competitionId
    if (competitionId) {
      await releaseLock(competitionId)
    }
    
    res.status(500).json({ error: 'Failed to start evaluation' })
  }
})

// Resume evaluation endpoint (same as start but doesn't overwrite totalSubmissions)
router.post("/resume-evaluation", async (req, res) => {
  let competitionId: string | undefined
  let userId: string | undefined
  
  try {
    const body = req.body
    competitionId = body.competitionId
    userId = body.userId

    if (!competitionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if evaluation is locked by another competition
    const isLocked = await isAnyEvaluationLocked()
    if (isLocked) {
      const lockInfo = await getCurrentLockInfo()
      if (lockInfo?.lockedBy !== competitionId) {
        return res.status(409).json({ 
          error: `Evaluation is currently locked by competition ${lockInfo?.lockedBy}` 
        })
      }
    }

    // Acquire global lock using Firestore
    const lockAcquired = await acquireLock(competitionId, userId)
    if (!lockAcquired) {
      return res.status(409).json({ 
        error: 'Failed to acquire evaluation lock' 
      })
    }

    // Get remaining submissions that haven't been evaluated
    const submissionsRef = db.collection(`competitions/${competitionId}/submissions`)
    const submissionsSnap = await submissionsRef.where('finalScore', '==', null).get()
    
    if (submissionsSnap.empty) {
      // Release lock if no submissions to evaluate
      await releaseLock(competitionId)
      
      return res.json({ message: 'No submissions to evaluate' })
    }

    const submissions = submissionsSnap.docs
    console.log(`🔄 Resuming evaluation for competition ${competitionId}: ${submissions.length} submissions remaining`)

    // Update status to running
    await updateProgressInFirestore(competitionId, {
      evaluationStatus: 'running',
      lastUpdateTime: new Date().toISOString()
    })

    // Start evaluation in background
    evaluateSubmissions(competitionId, submissions)

    res.json({ 
      message: 'Evaluation resumed successfully', 
      remainingSubmissions: submissions.length 
    })

  } catch (error) {
    console.error('❌ Resume evaluation error:', error)
    
    // Release lock on error if we have a competitionId
    if (competitionId) {
      await releaseLock(competitionId)
    }
    
    res.status(500).json({ error: 'Failed to resume evaluation' })
  }
})

// Pause evaluation endpoint
router.post("/pause-evaluation", async (req, res) => {
  try {
    const { competitionId, userId } = req.body

    if (!competitionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if evaluation is locked by this competition
    const isLocked = await isLockedByCompetition(competitionId)
    if (!isLocked) {
      return res.status(409).json({ 
        error: 'No evaluation running for this competition' 
      })
    }

    console.log(`⏸️ Pausing evaluation for competition ${competitionId}`)

    // Update status to paused in Firestore
    await updateProgressInFirestore(competitionId, {
      evaluationStatus: 'paused',
      lastUpdateTime: new Date().toISOString()
    })

    // Release global lock
    await releaseLock(competitionId)

    res.json({ 
      message: 'Evaluation paused successfully'
    })

  } catch (error) {
    console.error('❌ Pause evaluation error:', error)
    res.status(500).json({ error: 'Failed to pause evaluation' })
  }
})

// Endpoint to check global lock status
router.get("/check-lock", async (req, res) => {
  try {
    const lockInfo = await getCurrentLockInfo()
    
    return res.status(200).json({
      isLocked: lockInfo?.isLocked || false,
      lockedBy: lockInfo?.lockedBy || null,
      lockedByUser: lockInfo?.lockedByUser || null,
      lockedAt: lockInfo?.lockedAt || null,
      lockReason: lockInfo?.lockReason || null
    })
  } catch (err: unknown) {
    console.error("❌ Check lock error:", err)
    return res.status(500).json({
      error: "❌ Failed to check lock status",
      detail: err instanceof Error ? err.message : String(err)
    })
  }
})

// Endpoint to get evaluation progress
router.get("/progress/:competitionId", async (req, res) => {
  try {
    const { competitionId } = req.params

    if (!competitionId) {
      return res.status(400).json({ error: "Missing competitionId parameter" })
    }

    // Get progress from Firestore
    const progressDoc = await db
      .collection('evaluation-progress')
      .doc(competitionId)
      .get()

    if (!progressDoc.exists) {
      return res.status(200).json({ progress: null })
    }

    const progressData = progressDoc.data()
    
    return res.status(200).json({
      progress: {
        totalSubmissions: progressData?.totalSubmissions || 0,
        evaluatedSubmissions: progressData?.evaluatedSubmissions || 0,
        startTime: progressData?.startTime || new Date().toISOString(),
        lastUpdateTime: progressData?.lastUpdateTime || new Date().toISOString(),
        evaluationStatus: progressData?.evaluationStatus || 'unknown'
      }
    })

  } catch (error) {
    console.error("❌ Get progress error:", error)
    return res.status(500).json({
      error: "❌ Failed to get progress",
      detail: error instanceof Error ? error.message : String(error)
    })
  }
})

// Background evaluation function with batch updates and parallel processing
// IMPORTANT: This function now properly handles evaluation status:
// - Only sets status to 'completed' when ALL submissions are actually evaluated
// - Sets status to 'paused' when evaluation is incomplete or paused
// - Prevents incorrect 'completed' status for partial evaluations
// - Simple and reliable: compares evaluatedSubmissions with totalSubmissions
async function evaluateSubmissions(competitionId: string, submissions: any[]) {
  // Declare variables outside try block so they're accessible in catch block
  let evaluatedCount = 0
  let skippedCount = 0
  
  try {
    // Load challenge configurations
    const challengesSnapshot = await db
      .collection(`competitions/${competitionId}/challenges`)
      .get()

    const challengeConfigMap: Record<string, ChallengeConfig> = {}

    for (const doc of challengesSnapshot.docs) {
      const data = doc.data();
      const rubric = data?.rubric;
      const problemStatement = typeof data?.problemStatement === "string" ? data.problemStatement : null;

      if (Array.isArray(rubric)) {
        const cleanedRubric = cleanRubricData(rubric);

        if (cleanedRubric) {
          challengeConfigMap[doc.id] = {
            rubric: cleanedRubric,
            problemStatement
          };
        } else {
          console.warn(`⚠️ Challenge ${doc.id}: invalid rubric after cleaning`);
        }
      } else {
        console.warn(`⚠️ Challenge ${doc.id}: invalid rubric format`);
      }
    }

    // fetch competition-level systemPrompt once
    const competitionDoc = await db.collection('competitions').doc(competitionId).get();
    const competitionSystemPrompt = competitionDoc.exists ? competitionDoc.data()?.systemPrompt ?? null : null;

    evaluatedCount = await getCurrentEvaluatedCount(competitionId)
    skippedCount = 0
    let batchSize = calculateBatchSize(submissions.length)

    // Process submissions in parallel batches for better performance
    const processBatch = async (batchSubmissions: any[]) => {
      const batchPromises = batchSubmissions.map(async (docSnap) => {
        // Check if evaluation should stop
        const shouldStop = await shouldStopEvaluation(competitionId)
        if (shouldStop) {
          return { status: 'stopped' }
        }

        const submission = docSnap.data()
        const { promptText, challengeId } = submission

        if (!promptText || !challengeId) {
          console.warn(`⚠️ Skipping submission ${docSnap.id}: missing promptText or challengeId`)
          return { status: 'skipped', reason: 'missing data' }
        }

        const cfg = challengeConfigMap[challengeId]
        if (!cfg || !Array.isArray(cfg.rubric) || cfg.rubric.length === 0) {
          console.warn(`⚠️ Skipping submission ${docSnap.id}: no valid weighted rubric for challenge ${challengeId}`)
          return { status: 'skipped', reason: 'invalid rubric' }
        }

        const rubricData = cfg.rubric
        const problemStatement = cfg.problemStatement ?? undefined

        try {
          const result = await runJudges(promptText, rubricData, problemStatement, competitionSystemPrompt)
          const { scores: llmScores, average } = result || {}

          if (!llmScores || Object.keys(llmScores).length === 0) {
            console.warn(`⚠️ No valid scores returned for submission ${docSnap.id}`)
            return { status: 'skipped', reason: 'no scores' }
          }

          const updateData: any = {
            llmScores,
            status: "evaluated"
          }
          if (typeof average === "number") {
            updateData.finalScore = average
          }

          await db
            .collection(`competitions/${competitionId}/submissions`)
            .doc(docSnap.id)
            .update(updateData)

          return { status: 'success', average }
        } catch (error) {
          console.error(`❌ Failed to evaluate submission ${docSnap.id}:`, error)

          try {
            await db
              .collection(`competitions/${competitionId}/submissions`)
              .doc(docSnap.id)
              .update({
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown evaluation error"
              })
          } catch (updateError) {
            console.error(`Failed to update error status for submission ${docSnap.id}:`, updateError)
          }
          
          return { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })

      return Promise.all(batchPromises)
    }

    // Process submissions in parallel batches
    for (let i = 0; i < submissions.length; i += batchSize) {
      // Check if evaluation should stop (including pause)
      const shouldStop = await shouldStopEvaluation(competitionId)
      if (shouldStop) {
        console.log(`⏸️ Evaluation stopped for competition ${competitionId}`)
        break
      }

      const batch = submissions.slice(i, i + batchSize)
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} submissions`)
      
      const batchResults = await processBatch(batch)
      
      // Count results
      for (const result of batchResults) {
        if (result.status === 'success') {
          evaluatedCount++
        } else if (result.status === 'skipped') {
          skippedCount++
        }
      }

      // Update progress after each batch
      await updateProgressInFirestore(competitionId, {
        evaluatedSubmissions: evaluatedCount,
        lastUpdateTime: new Date().toISOString(),
        evaluationStatus: 'running'
      })
      
      console.log(`📊 Progress update: ${evaluatedCount} submissions evaluated, ${skippedCount} skipped`)
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < submissions.length) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    // Final progress update - Compare evaluatedSubmissions with totalSubmissions
    // Get the total submissions count from the progress document
    const progressDoc = await db
      .collection('evaluation-progress')
      .doc(competitionId)
      .get()
    
    const totalSubmissions = progressDoc.exists ? progressDoc.data()?.totalSubmissions || 0 : 0
    
    // Check if we've evaluated all submissions
    const isActuallyCompleted = evaluatedCount >= totalSubmissions
    
    await updateProgressInFirestore(competitionId, {
      evaluatedSubmissions: evaluatedCount,
      lastUpdateTime: new Date().toISOString(),
      evaluationStatus: isActuallyCompleted ? 'completed' : 'paused'
    })

    // Release global lock
    await releaseLock(competitionId)

    if (isActuallyCompleted) {
      console.log(`✅ Evaluation completed for competition ${competitionId}: ${evaluatedCount}/${totalSubmissions} evaluated, ${skippedCount} skipped`)
      
      // Generate leaderboard automatically when evaluation completes
      try {
        console.log(`🏆 Generating leaderboard for completed competition ${competitionId}`)
        
        // Import and call the leaderboard generation function directly
        const { generateLeaderboard } = await import('./generateLeaderboard.js')
        
        // Call the function directly instead of making HTTP request
        await generateLeaderboard(competitionId)
        
        console.log(`✅ Leaderboard generated successfully for competition ${competitionId}`)
        
      } catch (leaderboardError) {
        console.error(`❌ Failed to generate leaderboard for competition ${competitionId}:`, leaderboardError)
        // Don't fail the entire evaluation if leaderboard generation fails
      }
    } else {
      console.log(`⏸️ Evaluation paused/incomplete for competition ${competitionId}: ${evaluatedCount}/${totalSubmissions} evaluated`)
    }

  } catch (error) {
    console.error(`❌ Background evaluation error for competition ${competitionId}:`, error)
    
    // Update status to 'paused' on error if evaluation was incomplete
    try {
      const progressDoc = await db
        .collection('evaluation-progress')
        .doc(competitionId)
        .get()
      
      if (progressDoc.exists) {
        const progressData = progressDoc.data()
        const totalSubmissions = progressData?.totalSubmissions || 0
        
        // Check if evaluation is incomplete based on totalSubmissions
        if (evaluatedCount < totalSubmissions) {
          await updateProgressInFirestore(competitionId, {
            evaluationStatus: 'paused',
            lastUpdateTime: new Date().toISOString()
          })
          console.log(`⏸️ Evaluation status set to 'paused' due to error: ${evaluatedCount}/${totalSubmissions} evaluated`)
        }
      }
    } catch (updateError) {
      console.error(`Failed to update evaluation status on error for ${competitionId}:`, updateError)
    }
    
    // Release global lock on error
    await releaseLock(competitionId)
  }
}

export default router