import express from "express"
import { db } from "../config/firebase-admin.js"
import { runJudges } from "../utils/judgeLlms.js"
import { cleanRubricData } from "../utils/sanitise.js";

const router = express.Router()

type RubricItem = { name: string; description: string; weight: number }
type ChallengeConfig = { rubric: RubricItem[]; problemStatement?: string | null }

// Global evaluation state
let globalEvaluationState = {
  isLocked: false,
  lockedBy: null as string | null,
  lockedByUser: null as string | null,
  lockedAt: null as string | null,
  lockReason: null as string | null
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
const shouldStopEvaluation = (competitionId: string): boolean => {
  // Check if global lock is still held by this competition
  return !globalEvaluationState.isLocked || globalEvaluationState.lockedBy !== competitionId
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
  try {
    const { competitionId, userId } = req.body

    if (!competitionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if evaluation is locked by another competition
    if (globalEvaluationState.isLocked && globalEvaluationState.lockedBy !== competitionId) {
      return res.status(409).json({ 
        error: `Evaluation is currently locked by competition ${globalEvaluationState.lockedBy}` 
      })
    }

    // Acquire global lock
    globalEvaluationState.isLocked = true
    globalEvaluationState.lockedBy = competitionId
    globalEvaluationState.lockedByUser = userId
    globalEvaluationState.lockedAt = new Date().toISOString()
    globalEvaluationState.lockReason = 'Starting evaluation'

    // Get all submissions that haven't been evaluated
    const submissionsRef = db.collection(`competitions/${competitionId}/submissions`)
    
    // Check for unevaluated submissions
    const submissionsSnap = await submissionsRef.where('finalScore', '==', null).get()
    
    if (submissionsSnap.empty) {
      // Release lock if no submissions to evaluate
      globalEvaluationState.isLocked = false
      globalEvaluationState.lockedBy = null
      globalEvaluationState.lockedByUser = null
      globalEvaluationState.lockedAt = null
      globalEvaluationState.lockReason = null
      
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

    console.log('📝 Progress initialized in Firestore')

    // Start evaluation in background
    evaluateSubmissions(competitionId, submissions)

    console.log('✅ Evaluation started successfully, sending response')
    res.json({ 
      message: 'Evaluation started successfully', 
      totalSubmissions 
    })

  } catch (error) {
    console.error('❌ Start evaluation error:', error)
    
    // Release lock on error
    globalEvaluationState.isLocked = false
    globalEvaluationState.lockedBy = null
    globalEvaluationState.lockedByUser = null
    globalEvaluationState.lockedAt = null
    globalEvaluationState.lockReason = null
    
    res.status(500).json({ error: 'Failed to start evaluation' })
  }
})

// Resume evaluation endpoint (same as start but doesn't overwrite totalSubmissions)
router.post("/resume-evaluation", async (req, res) => {
  try {
    const { competitionId, userId } = req.body

    if (!competitionId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if evaluation is locked by another competition
    if (globalEvaluationState.isLocked && globalEvaluationState.lockedBy !== competitionId) {
      return res.status(409).json({ 
        error: `Evaluation is currently locked by competition ${globalEvaluationState.lockedBy}` 
      })
    }

    // Acquire global lock
    globalEvaluationState.isLocked = true
    globalEvaluationState.lockedBy = competitionId
    globalEvaluationState.lockedByUser = userId
    globalEvaluationState.lockedAt = new Date().toISOString()
    globalEvaluationState.lockReason = 'Resuming evaluation'

    // Get remaining submissions that haven't been evaluated
    const submissionsRef = db.collection(`competitions/${competitionId}/submissions`)
    const submissionsSnap = await submissionsRef.where('finalScore', '==', null).get()
    
    if (submissionsSnap.empty) {
      // Release lock if no submissions to evaluate
      globalEvaluationState.isLocked = false
      globalEvaluationState.lockedBy = null
      globalEvaluationState.lockedByUser = null
      globalEvaluationState.lockedAt = null
      globalEvaluationState.lockReason = null
      
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
    
    // Release lock on error
    globalEvaluationState.isLocked = false
    globalEvaluationState.lockedBy = null
    globalEvaluationState.lockedByUser = null
    globalEvaluationState.lockedAt = null
    globalEvaluationState.lockReason = null
    
    res.status(500).json({ error: 'Failed to resume evaluation' })
  }
})

// Endpoint to check global lock status
router.get("/check-lock", async (req, res) => {
  try {
    return res.status(200).json({
      isLocked: globalEvaluationState.isLocked,
      lockedBy: globalEvaluationState.lockedBy,
      lockedByUser: globalEvaluationState.lockedByUser,
      lockedAt: globalEvaluationState.lockedAt
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
async function evaluateSubmissions(competitionId: string, submissions: any[]) {
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

    let evaluatedCount = await getCurrentEvaluatedCount(competitionId)
    let skippedCount = 0
    let batchSize = calculateBatchSize(submissions.length)
    let currentBatch = 0

    // Process submissions in parallel batches for better performance
    const processBatch = async (batchSubmissions: any[]) => {
      const batchPromises = batchSubmissions.map(async (docSnap) => {
        // Check if evaluation should stop
        if (shouldStopEvaluation(competitionId)) {
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
          console.log(`🔄 Evaluating submission ${docSnap.id}`);

          const result = await runJudges(promptText, rubricData, problemStatement)
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

          console.log(`✅ Submission ${docSnap.id}: ${average?.toFixed(1) || 'N/A'}/100`)
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
      if (shouldStopEvaluation(competitionId)) {
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

    // Final progress update
    await updateProgressInFirestore(competitionId, {
      evaluatedSubmissions: evaluatedCount,
      lastUpdateTime: new Date().toISOString(),
      evaluationStatus: 'completed'
    })

    // Release global lock
    if (globalEvaluationState.lockedBy === competitionId) {
      globalEvaluationState.isLocked = false
      globalEvaluationState.lockedBy = null
      globalEvaluationState.lockedByUser = null
      globalEvaluationState.lockedAt = null
      globalEvaluationState.lockReason = null
    }

    console.log(`✅ Evaluation completed for competition ${competitionId}: ${evaluatedCount} evaluated, ${skippedCount} skipped`)

  } catch (error) {
    console.error(`❌ Background evaluation error for competition ${competitionId}:`, error)
    
    // Release global lock on error
    if (globalEvaluationState.lockedBy === competitionId) {
      globalEvaluationState.isLocked = false
      globalEvaluationState.lockedBy = null
      globalEvaluationState.lockedByUser = null
      globalEvaluationState.lockedAt = null
      globalEvaluationState.lockReason = null
    }
  }
}

export default router