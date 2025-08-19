const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

// Initialize Firebase Admin using environment variable (same as your server)
const serviceAccountKey = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  throw new Error("NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY is not set in .env");
}

// Parse JSON string from environment variable
const serviceAccount = JSON.parse(serviceAccountKey);

// Check if app is already initialized
let app;
try {
  app = initializeApp({
    credential: cert(serviceAccount)
  });
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    // App already exists, get the existing one
    app = initializeApp();
  } else {
    throw error;
  }
}

const db = getFirestore(app);

// Configuration
const COMPETITION_ID = '5Nuh3NXYgYS2p7c2nxtg'; // Your competition ID

// Sample prompts for variety
const SAMPLE_PROMPTS = [
  "Create a web application that allows users to manage their daily tasks with a clean, intuitive interface. Include features like task creation, editing, deletion, and completion tracking.",
  "Develop a REST API for a social media platform that handles user authentication, posts, comments, and likes. Implement proper error handling and validation.",
  "Build a machine learning model that can classify images into different categories. Use a pre-trained model and implement transfer learning techniques.",
  "Create a mobile app for tracking personal finances. Include features for income/expense tracking, budgeting, and financial goal setting.",
  "Develop a real-time chat application using WebSockets. Implement features like private messaging, group chats, and message history.",
  "Build a recommendation system for an e-commerce platform. Use collaborative filtering and content-based approaches.",
  "Create a data visualization dashboard for analyzing sales data. Include charts, graphs, and interactive filters.",
  "Develop a blockchain-based voting system with smart contracts. Ensure security and transparency in the voting process.",
  "Build a natural language processing application that can summarize long articles. Implement extractive and abstractive summarization.",
  "Create a game engine for 2D platformer games. Include physics, collision detection, and sprite animation systems."
];

// Fetch real user IDs from Firestore
async function fetchUserIds() {
  try {
    console.log('🔍 Fetching user IDs from Firestore...');
    
    // Fetch users from the users collection
    const usersSnapshot = await db.collection('users').limit(50).get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ No users found, using fallback user IDs');
      return [
        'user-001', 'user-002', 'user-003', 'user-004', 'user-005',
        'user-006', 'user-007', 'user-008', 'user-009', 'user-010'
      ];
    }
    
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    console.log(`✅ Found ${userIds.length} users: ${userIds.slice(0, 5).join(', ')}${userIds.length > 5 ? '...' : ''}`);
    
    return userIds;
  } catch (error) {
    console.error('❌ Error fetching user IDs:', error);
    console.log('⚠️ Using fallback user IDs');
    return [
      'user-001', 'user-002', 'user-003', 'user-004', 'user-005',
      'user-006', 'user-007', 'user-008', 'user-009', 'user-010'
    ];
  }
}

// Fetch real challenge IDs from Firestore
async function fetchChallengeIds() {
  try {
    console.log('🔍 Fetching challenge IDs from Firestore...');
    
    // Fetch challenges from the competition
    const challengesSnapshot = await db
      .collection(`competitions/${COMPETITION_ID}/challenges`)
      .limit(10)
      .get();
    
    if (challengesSnapshot.empty) {
      console.log('⚠️ No challenges found, using fallback challenge IDs');
      return ['01', '02', '03', '04'];
    }
    
    const challengeIds = challengesSnapshot.docs.map(doc => doc.id);
    console.log(`✅ Found ${challengeIds.length} challenges: ${challengeIds.slice(0, 5).join(', ')}${challengeIds.length > 5 ? '...' : ''}`);
    
    return challengeIds;
  } catch (error) {
    console.error('❌ Error fetching challenge IDs:', error);
    console.log('⚠️ Using fallback challenge IDs');
    return ['01', '02', '03', '04'];
  }
}

// Generate random prompt
function generateRandomPrompt() {
  const basePrompt = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
  const variations = [
    "Focus on performance optimization and scalability.",
    "Ensure the solution is accessible and follows WCAG guidelines.",
    "Implement comprehensive testing with high code coverage.",
    "Use modern design patterns and best practices.",
    "Include proper documentation and API specifications.",
    "Optimize for mobile-first responsive design.",
    "Implement security best practices and input validation.",
    "Use cloud-native technologies and microservices architecture.",
    "Include analytics and monitoring capabilities.",
    "Ensure cross-platform compatibility and browser support."
  ];
  
  const variation = variations[Math.floor(Math.random() * variations.length)];
  return `${basePrompt} ${variation}`;
}

// Generate random submission data
function generateSubmission(userId, challengeId, index) {
  const prompt = generateRandomPrompt();
  const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days
  
  return {
    userId: userId,
    challengeId: challengeId,
    promptText: prompt,
    status: "submitted",
    finalScore: null, // This will trigger evaluation
    llmScores: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    submissionId: `submission-${String(index + 1).padStart(3, '0')}`,
    metadata: {
      wordCount: prompt.split(' ').length,
      characterCount: prompt.length,
      generated: true,
      testData: true
    }
  };
}

// Main function to generate submissions
async function generateTestSubmissions() {
  try {
    console.log('🚀 Starting generation of 300 test submissions...');
    
    // Fetch real data from Firestore
    const [userIds, challengeIds] = await Promise.all([
      fetchUserIds(),
      fetchChallengeIds()
    ]);
    
    if (userIds.length === 0 || challengeIds.length === 0) {
      throw new Error('No users or challenges found');
    }
    
    console.log(`📊 Using ${userIds.length} users and ${challengeIds.length} challenges`);
    
    const submissions = [];
    let batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    for (let i = 0; i < 300; i++) {
      const userId = userIds[i % userIds.length];
      const challengeId = challengeIds[i % challengeIds.length];
      
      const submissionData = generateSubmission(userId, challengeId, i);
      const submissionRef = db.collection(`competitions/${COMPETITION_ID}/submissions`).doc();
      
      batch.set(submissionRef, submissionData);
      submissions.push(submissionData);
      
      // Commit batch when it reaches the limit
      if (++batchCount === BATCH_SIZE) {
        await batch.commit();
        console.log(`✅ Committed batch of ${BATCH_SIZE} submissions`);
        batch = db.batch();
        batchCount = 0;
      }
      
      // Progress indicator
      if ((i + 1) % 50 === 0) {
        console.log(`📊 Generated ${i + 1}/300 submissions...`);
      }
    }
    
    // Commit remaining submissions
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} submissions`);
    }
    
    console.log('🎉 Successfully generated 300 test submissions!');
    console.log(`📊 Summary:`);
    console.log(`   - Total submissions: ${submissions.length}`);
    console.log(`   - Users: ${userIds.length}`);
    console.log(`   - Challenges: ${challengeIds.length}`);
    console.log(`   - Competition ID: ${COMPETITION_ID}`);
    
    // Show sample submissions
    console.log('\n📝 Sample submissions:');
    submissions.slice(0, 3).forEach((sub, index) => {
      console.log(`   ${index + 1}. User: ${sub.userId}, Challenge: ${sub.challengeId}`);
      console.log(`      Prompt: ${sub.promptText.substring(0, 80)}...`);
      console.log(`      Status: ${sub.status}, Final Score: ${sub.finalScore}`);
      console.log('');
    });
    
    console.log('🔍 Now you can test the evaluation progress system!');
    console.log('   - Run: npm run start-evaluation');
    console.log('   - Watch the progress bar update every 10 submissions');
    
  } catch (error) {
    console.error('❌ Error generating test submissions:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateTestSubmissions()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateTestSubmissions };
