# Batch Distribution System for Level 2 Competition

## Overview
This feature enables competition administrators to organize Level 2 participants into time-based batches (days), assign specific challenges to each batch, and manage real-time participant reassignments.

## File Structure

```
app/admin/competitions/[competitionId]/
├── level2-dashboard/page.tsx          # Updated with 4-column action cards
└── batch-distribution/page.tsx        # New batch distribution page
```

## Features Implemented

### 1. Dashboard UI Updates ([level2-dashboard/page.tsx](app/admin/competitions/[competitionId]/level2-dashboard/page.tsx))

- **4-Column Grid Layout**: Action cards now display in a responsive grid (1 column on mobile, 2 on large screens, 4 on extra-large screens)
- **Card Order**:
  1. Get Participants (Import from Level 1)
  2. Distribute Participants (New - Batch configuration)
  3. Distribute Submissions (Judge assignment)
  4. Leaderboard Management
- **Compact Design**: Reduced padding and font sizes to fit all cards on desktop
- **Consistent Styling**: Matches existing design patterns

### 2. Batch Configuration Page ([batch-distribution/page.tsx](app/admin/competitions/[competitionId]/batch-distribution/page.tsx))

#### Phase A: Batch Configuration (The Containers)

**Features:**
- Number of batches input (1-10)
- Dynamic batch card generation
- Each batch card includes:
  - **Editable Name**: Default "Day {index}", fully customizable
  - **DateTime Pickers**: Start time and end time selection
  - **Challenge Multi-Select**: Visual grid of challenge buttons
  
**CRITICAL BUSINESS RULE - Exclusive Selection:**
- A challenge can only be assigned to ONE batch
- Real-time filtering: Selected challenges are disabled in other batches
- Global state tracking with `useMemo` for performance

#### Phase B: Participant Distribution Logic

**Mode 1: Equal Auto-Distribute**
- Shuffles participants randomly using Fisher-Yates algorithm
- Divides equally across batches using `Math.ceil`
- Example: 18 users / 3 batches = 6 users per batch

**Mode 2: Manual Capacity Distribute**
- Input field for custom capacity on each batch card
- Validation: Sum must equal total participants
- Visual feedback with amber warning banner
- Shuffle then sequential fill based on capacity

#### Phase C: Firestore Persistence

**Data Structure:**

```typescript
// Schedules Collection
/competitions/{competitionId}/schedules/{batchId}
{
  batchName: string
  startTime: Timestamp
  endTime: Timestamp
  challengeIds: string[]
  participantIds: string[]
  createdAt: Timestamp
}

// Participants Update
/competitions/{competitionId}/participants/{userId}
{
  ...existing fields
  assignedBatchId: string  // Added field
}
```

**Write Operations:**
- Uses `writeBatch()` for atomic writes
- Deletes existing schedules before creating new ones
- Updates all participant documents with `assignedBatchId`
- Transaction-safe with error handling

### 3. Real-Time Management & Migration

**Live Management View:**
- Displays all batches with participant lists
- Shows challenge assignments per batch
- Real-time participant count badges

**Participant Migration (Emergency Move):**
- "Move" button on each participant row
- Modal with target batch selection
- Excludes current batch from options
- **Atomic Operations**:
  ```typescript
  1. arrayRemove from source batch
  2. arrayUnion to target batch
  3. Update participant.assignedBatchId
  ```

## Technical Implementation

### Dependencies
- **Firebase/Firestore**: Database operations
- **Tailwind CSS**: Styling (matches existing patterns)
- **shadcn/ui**: UI components (Button, Card, Dialog, etc.)
- **Lucide Icons**: Consistent iconography

### Key Functions

```typescript
// Shuffle implementation (Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Challenge availability filtering
const getAvailableChallenges = (batchId: string) => {
  const currentBatch = batches.find((b) => b.id === batchId)
  const currentSelections = currentBatch?.challengeIds || []
  
  return challenges.filter(
    (challenge) =>
      !selectedChallengeIds.has(challenge.id) || 
      currentSelections.includes(challenge.id)
  )
}
```

### State Management
- Uses React hooks (`useState`, `useEffect`, `useMemo`)
- No external state library needed
- Efficient re-renders with memoization

### Error Handling
- Try-catch blocks on all async operations
- Toast notifications for user feedback
- Validation before Firestore writes
- Console logging for debugging

## User Flow

### Initial Setup
1. Admin imports participants from Level 1
2. Navigates to "Distribute Participants" from dashboard
3. Configures number of batches (e.g., 3 for 3 days)

### Configuration
4. For each batch:
   - Edit batch name (e.g., "Day 1: Introduction")
   - Set start/end date and time
   - Select challenges (exclusive selection)
5. Choose distribution mode:
   - Equal: Automatic equal split
   - Manual: Set custom capacity per batch

### Distribution
6. Click "Distribute Participants" to shuffle and assign
7. Review the distribution preview
8. Click "Finalize Distribution" (shows confirmation dialog)
9. System saves to Firestore atomically

### Management
10. Page switches to Live Management View
11. Admin can move participants between batches
12. All changes update in real-time

## Safety Features

- **Confirmation Dialog**: Warns before overwriting existing schedules
- **Validation**: Checks all required fields before saving
- **Atomic Writes**: Uses `writeBatch` for consistency
- **Access Control**: Superadmin-only access
- **Error Recovery**: Graceful error handling with user feedback

## UI/UX Highlights

- **Responsive Design**: Mobile-friendly layouts
- **Visual Feedback**: Color-coded states, hover effects
- **Progress Indicators**: Loading states, success badges
- **Accessibility**: Proper labels, keyboard navigation
- **Professional Styling**: Matches Leaderboard Management page

## Testing Checklist

- [ ] Dashboard displays 4 cards in correct order
- [ ] Batch cards generate dynamically
- [ ] Challenge exclusive selection works
- [ ] Equal distribution splits correctly
- [ ] Manual distribution validates capacity
- [ ] Firestore writes succeed
- [ ] Live management view loads existing data
- [ ] Participant migration works atomically
- [ ] Error handling shows toasts
- [ ] Responsive design works on mobile

## Future Enhancements

- Bulk participant operations
- Export batch schedules to CSV
- Email notifications to participants
- Batch analytics dashboard
- Undo/redo functionality
- Batch templates

## Notes

- No placeholder console.logs used
- Real Firestore error handling implemented
- Uses existing toast library (`useToast`)
- No lodash dependency needed (native shuffle implementation)
- Follows project conventions and patterns
