# Level 2 Judge Evaluation System - Database Structure & Implementation

## Overview
The Level 2 evaluation system supports multiple judges evaluating the same participant with proper tracking, score aggregation, and flexible editing capabilities.

---

## Database Structure

### 1. Judge Evaluation Tracking
**Path:** `/competitions/{competitionId}/judges/{judgeId}/level2Evaluations/{participantId}`

```typescript
{
  participantId: string
  judgeId: string
  batchId: string
  evaluatedChallenges: string[]  // Array of challengeIds that have been evaluated
  lastUpdated: Timestamp
  evaluations: {
    [challengeId]: {
      score: number              // Weighted total score
      rubricScores: {            // Individual rubric criterion scores
        [criterionName]: number
      }
      comment: string            // Judge's feedback
      evaluatedAt: Timestamp
      hasSubmission: boolean     // Whether participant submitted for this challenge
    }
  }
}
```

**Purpose:**
- Tracks which challenges a judge has evaluated for a specific participant
- Stores complete evaluation data including rubric scores and comments
- Enables real-time progress tracking in UI
- Supports editing/updating evaluations

**Key Features:**
- `evaluatedChallenges` array: Quick lookup for completion status
- `evaluations` object: Organized by challengeId for easy access
- `hasSubmission` flag: Handles cases where participant didn't submit

---

### 2. Submission Scores (Multiple Judges)
**Path:** `/competitions/{competitionId}/submissions/{participantId}_{challengeId}`

```typescript
{
  participantId: string
  challengeId: string
  promptText: string             // Participant's submission (empty if no submission)
  hasSubmission: boolean         // False if participant didn't submit
  submittedAt: Timestamp | null
  judgeScores: {
    [judgeId]: {
      totalScore: number
      rubricScores: {
        [criterionName]: number
      }
      comment: string
      evaluatedAt: Timestamp
    }
  }
}
```

**Purpose:**
- Central repository for all judge scores on a submission
- Supports multiple judges evaluating the same participant
- Enables score averaging across judges
- Handles no-submission cases

**Key Features:**
- `judgeScores` object: Maps each judge to their evaluation
- Each judge's score is independent and can be updated
- Easy to calculate average: `sum(judgeScores.*.totalScore) / count(judgeScores)`

---

## Edge Cases Handled

### 1. No Submission from Participant
**Scenario:** Participant didn't submit a solution for a challenge

**Solution:**
- Judge can still evaluate and assign score (typically 0)
- `hasSubmission: false` flag is set
- Submission document is created with empty `promptText`
- Evaluation is tracked normally in judge's level2Evaluations

**Implementation:**
```typescript
// Create placeholder submission document
await setDoc(submissionRef, {
  participantId,
  challengeId,
  promptText: "",
  hasSubmission: false,
  judgeScores: {
    [judgeId]: { /* evaluation data */ }
  }
}, { merge: true })
```

---

### 2. Multiple Judges - Partial Completion
**Scenario:** Participant assigned to Judge 1 and Judge 2. Judge 1 completes, Judge 2 hasn't started.

**Tracking:**
- Each judge has independent `level2Evaluations/{participantId}` document
- Admin can query all judges to see who has completed:
  ```typescript
  // Check if Judge 1 completed challenge 01 for participant X
  judges/{judge1}/level2Evaluations/{participantX}
    .evaluatedChallenges.includes("01") // true
  
  // Check if Judge 2 completed
  judges/{judge2}/level2Evaluations/{participantX}
    .evaluatedChallenges.includes("01") // false
  ```

**Admin Dashboard Queries:**
```typescript
// Get all judges assigned to a participant
const judgesSnapshot = await db
  .collection(`competitions/${competitionId}/judges`)
  .where(`assignments.${batchId}`, 'array-contains', participantId)
  .get()

// For each judge, check evaluation status
for (const judgeDoc of judgesSnapshot.docs) {
  const evalDoc = await judgeDoc.ref
    .collection('level2Evaluations')
    .doc(participantId)
    .get()
  
  const evaluatedChallenges = evalDoc.data()?.evaluatedChallenges || []
  // Show progress: evaluatedChallenges.length / totalChallenges
}
```

---

### 3. UI Button States
**Button Colors Based on Evaluation Status:**

**Not Evaluated (Default):**
- Color: `bg-slate-900` (#0f172a)
- Icon: Clock
- Text: "Open" or "Evaluate"

**Evaluated (Completed):**
- Color: `bg-green-600`
- Icon: CheckCircle2
- Text: "Update Score" or "View Evaluation"

**Implementation:**
```typescript
const isEvaluated = evaluatedChallenges.includes(challengeId)

<Button className={isEvaluated ? "bg-green-600 hover:bg-green-700" : "bg-slate-900 hover:bg-slate-800"}>
  {isEvaluated ? (
    <><CheckCircle2 className="w-4 h-4 mr-1" /> Update Score</>
  ) : (
    <><Clock className="w-4 h-4 mr-1" /> Evaluate</>
  )}
</Button>
```

---

### 4. Editing Evaluations
**Scenario:** Judge wants to update/correct a previous evaluation

**Solution:**
- Same save function updates existing evaluation
- `evaluatedChallenges` array maintains uniqueness (no duplicates)
- New evaluation overwrites previous one
- Timestamp updated to reflect latest change

**Implementation:**
```typescript
// Save always merges, never creates duplicates
await setDoc(evalRef, {
  evaluatedChallenges: Array.from(new Set([...existing, challengeId])),
  evaluations: {
    ...existingEvaluations,
    [challengeId]: newEvaluationData
  },
  lastUpdated: serverTimestamp()
}, { merge: true })
```

---

## Statistics & Progress Tracking

### Participant Dashboard Stats
**Path:** Calculated from judge's `level2Evaluations/{participantId}`

```typescript
const stats = {
  totalChallenges: batchChallenges.length,
  evaluatedChallenges: evaluatedChallenges.length,
  remainingChallenges: batchChallenges.length - evaluatedChallenges.length
}
```

**Storage:** Read from database, not calculated runtime
**Update:** Automatically maintained when evaluations are saved

---

### Level 2 Dashboard Assignment Counts
**Path:** Calculated from `level2Evaluations` subcollection

```typescript
// Get count of evaluated participants
const evaluationsSnapshot = await db
  .collection(`competitions/${competitionId}/judges/${judgeId}/level2Evaluations`)
  .get()

const totalParticipants = /* from assignments field */
const evaluatedParticipants = evaluationsSnapshot.size

// Check if all challenges evaluated for a participant
const allChallengesEvaluated = evaluatedChallenges.length === totalChallenges
```

---

## Performance Optimizations

### 1. Minimize Runtime Calculations
- Store completion counts in database
- Use array lengths for quick counts
- Index documents for fast queries

### 2. Efficient Queries
```typescript
// Good: Direct document access
const evalDoc = await db
  .doc(`competitions/${competitionId}/judges/${judgeId}/level2Evaluations/${participantId}`)
  .get()

// Avoid: Collection scans when possible
```

### 3. Batch Operations
- Update multiple fields in single `setDoc` call
- Use `merge: true` to avoid overwriting data

---

## Score Aggregation (For Admin)

### Calculate Average Score Across Judges
```typescript
// Get all judges' scores for a submission
const submissionDoc = await db
  .doc(`competitions/${competitionId}/submissions/${participantId}_${challengeId}`)
  .get()

const judgeScores = submissionDoc.data()?.judgeScores || {}
const scores = Object.values(judgeScores).map(j => j.totalScore)
const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length

// Handle edge case: No judges evaluated yet
const finalScore = scores.length > 0 ? averageScore : 0
```

---

## Data Integrity

### Consistency Checks
1. **Sync evaluatedChallenges with evaluations object**
   - `evaluatedChallenges` should only contain keys present in `evaluations`
   
2. **Validate judge assignments**
   - Only allow judges to evaluate participants assigned to them
   
3. **Timestamp tracking**
   - Always update `lastUpdated` when modifying evaluations
   - Use `serverTimestamp()` for consistency

---

## Migration & Cleanup

### Remove Old Evaluations
```typescript
// If judge is unassigned from participant
await db
  .doc(`competitions/${competitionId}/judges/${judgeId}/level2Evaluations/${participantId}`)
  .delete()
```

### Recalculate Statistics
```typescript
// Force recalculation if data becomes inconsistent
const evaluations = evalDoc.data()?.evaluations || {}
const actualEvaluatedChallenges = Object.keys(evaluations)

await evalDoc.ref.update({
  evaluatedChallenges: actualEvaluatedChallenges
})
```

---

## Summary

**Key Advantages:**
✅ Supports multiple judges per participant
✅ Handles no-submission cases gracefully
✅ Allows flexible editing/updating
✅ Minimal runtime calculations
✅ Clear separation of concerns
✅ Easy progress tracking for admin
✅ Scalable database structure

**Critical Fields for Admin Dashboard:**
- `evaluatedChallenges[]` - Quick completion check
- `judgeScores` - Multi-judge score aggregation
- `hasSubmission` - Identify missing submissions
- `lastUpdated` - Track recent activity
