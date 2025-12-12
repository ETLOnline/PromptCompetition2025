import admin from 'firebase-admin';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// 1. Setup for JSON import in ES Modules
const require = createRequire(import.meta.url);
const serviceAccount = require('./service-account-key.json');

// 2. Setup for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Format timestamp to ISO string to match "2025-12-03T12:12:36.495Z"
 */
const formatDate = (value) => {
  if (!value) return '';
  // Handle Firestore Timestamp
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  // Handle native Date objects or existing strings
  return new Date(value).toISOString();
};

const exportUsersToCSV = async () => {
  try {
    console.log('Fetching user documents from Firestore...');
    const snapshot = await db.collection('users').get();

    if (snapshot.empty) {
      console.log('No matching documents found.');
      return;
    }

    // Define the specific columns based on your requirement
    const header = [
      { id: 'bio', title: 'bio' },
      { id: 'category', title: 'category' },
      { id: 'city', title: 'city' },
      { id: 'consent', title: 'consent' },
      { id: 'createdAt', title: 'createdAt' },
      { id: 'email', title: 'email' },
      { id: 'fullName', title: 'fullName' },
      { id: 'gender', title: 'gender' },
      { id: 'institution', title: 'institution' },
      { id: 'linkedin', title: 'linkedin' },
      { id: 'majors', title: 'majors' },
      { id: 'province', title: 'province' },
      { id: 'role', title: 'role' }
    ];

    const users = [];

    snapshot.forEach(doc => {
      const data = doc.data();

      // Map document data to specific schema, providing defaults for missing fields
      const userRecord = {
        bio: data.bio || "",
        category: data.category || "",
        city: data.city || "",
        consent: data.consent !== undefined ? data.consent : false,
        createdAt: formatDate(data.createdAt),
        email: data.email || "",
        fullName: data.fullName || "",
        gender: data.gender || "",
        institution: data.institution || "",
        linkedin: data.linkedin || "",
        majors: data.majors || "",
        province: data.province || "",
        role: data.role || ""
      };

      users.push(userRecord);
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `users_export_${timestamp}.csv`;
    const filePath = path.join(__dirname, fileName);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: header,
    });

    console.log(`Writing ${users.length} records to CSV...`);
    await csvWriter.writeRecords(users);

    console.log(`Successfully exported users to: ${filePath}`);

  } catch (error) {
    console.error('Error exporting users:', error);
  } finally {
    process.exit();
  }
};

exportUsersToCSV();