# Test Data Generation Scripts

## Generate Test Submissions

This script generates 300 test submissions for testing the evaluation progress system.

### Prerequisites

1. **Firebase Admin SDK**: Make sure you have `firebase-admin` installed
2. **Service Account Key**: Ensure `server/config/serviceAccountKey.json` exists
3. **Competition ID**: Update the `COMPETITION_ID` in the script if needed

### Usage

```bash
# Generate 300 test submissions
npm run generate-submissions

# Or run directly
node scripts/generate-test-submissions.js
```

### What It Generates

- **300 submissions** with realistic prompts
- **Real challenges** fetched from your competition (distributed evenly)
- **Real users** fetched from your Firestore users collection
- **Varied prompts** from 10 base templates with variations
- **Proper status**: `finalScore: null` to trigger evaluation

### Configuration

Edit the script to customize:

```javascript
const COMPETITION_ID = 'your-competition-id';
// User IDs and Challenge IDs are automatically fetched from Firestore
```

### Testing the Progress System

After generating submissions:

1. **Start Evaluation**: Use your admin dashboard
2. **Watch Progress**: The progress bar will update every 10 submissions
3. **Monitor Performance**: See real-time updates with 300 submissions

### Sample Output

```
🚀 Starting generation of 300 test submissions...
📊 Generated 50/300 submissions...
📊 Generated 100/300 submissions...
📊 Generated 150/300 submissions...
📊 Generated 200/300 submissions...
📊 Generated 250/300 submissions...
📊 Generated 300/300 submissions...
✅ Committed final batch of 300 submissions
🎉 Successfully generated 300 test submissions!
```

### Cleanup

To remove test data:

```javascript
// Add this to the script if needed
async function cleanupTestSubmissions() {
  const snapshot = await db
    .collection(`competitions/${COMPETITION_ID}/submissions`)
    .where('metadata.testData', '==', true)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`🧹 Cleaned up ${snapshot.docs.length} test submissions`);
}
```
