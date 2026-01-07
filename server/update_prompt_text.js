import admin from 'firebase-admin';
import { createRequire } from 'module';

// 1. Setup for JSON import in ES Modules
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceaccount.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configuration
// Update this ID to target different competitions
const COMPETITION_ID = '1chMkuIhCpYzn8WMjZXK'; 

const OLD_COLLECTION_NAME = 'finalleaderboard'; // Source (to delete)
const NEW_COLLECTION_NAME = 'finalLeaderboard'; // Target (to create/overwrite)

// Construct Paths
const PARENT_PATH = `competitions/${COMPETITION_ID}`;
const OLD_COLLECTION_PATH = `${PARENT_PATH}/${OLD_COLLECTION_NAME}`;
const NEW_COLLECTION_PATH = `${PARENT_PATH}/${NEW_COLLECTION_NAME}`;

const migrateLeaderboard = async () => {
  try {
    console.log(`Checking for collection: ${OLD_COLLECTION_PATH}`);
    
    // Fetch all documents in the old 'finalleaderboard' collection
    const snapshot = await db.collection(OLD_COLLECTION_PATH).get();

    if (snapshot.empty) {
      console.log(`No documents found in '${OLD_COLLECTION_NAME}'. Migration skipped.`);
      return;
    }

    console.log(`Found ${snapshot.size} documents. Starting migration to '${NEW_COLLECTION_NAME}'...`);

    // Firestore batch limit is 500 ops. We do 2 ops per doc (Set + Delete), so 250 docs per batch.
    const DOCS_PER_BATCH = 250; 
    let batch = db.batch();
    let operationCount = 0;
    let totalMigrated = 0;

    for (const doc of snapshot.docs) {
      const docId = doc.id;
      const data = doc.data();

      // 1. Set data in the new collection (Overwrites if exists)
      const newDocRef = db.collection(NEW_COLLECTION_PATH).doc(docId);
      batch.set(newDocRef, data);

      // 2. Delete data from the old collection
      const oldDocRef = db.collection(OLD_COLLECTION_PATH).doc(docId);
      batch.delete(oldDocRef);

      operationCount++;
      totalMigrated++;

      // Commit batch if limit reached
      if (operationCount >= DOCS_PER_BATCH) {
        await batch.commit();
        console.log(`Processed batch of ${operationCount} documents...`);
        batch = db.batch();
        operationCount = 0;
      }
    }

    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Processed final batch of ${operationCount} documents.`);
    }

    console.log('------------------------------------------------');
    console.log(`SUCCESS: Migrated ${totalMigrated} documents.`);
    console.log(`FROM: ${OLD_COLLECTION_PATH}`);
    console.log(`TO:   ${NEW_COLLECTION_PATH}`);
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('Error migrating leaderboard:', error);
  } finally {
    process.exit();
  }
};

migrateLeaderboard();