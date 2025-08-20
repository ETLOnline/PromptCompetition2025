import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  await readFile(path.join(__dirname, '../enlightentech-a2046-firebase-adminsdk-fbsvc-8b4473f821.json'), 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Competition ID
const COMPETITION_ID = '5Nuh3NXYgYS2p7c2nxtg';

// Hardcoded user/participant IDs
const USER_IDS = [
  '2S9WkEZvO0RgfCud0Kcdbuv8AYC3',
  'ILWrF38F8Bg0YJWwv4GSN0YwXU62',
  'IeZcOTxCLtWAR0ZKmLodZaeZJXX2',
  'V8D86YHTdHOQqWQmloGusT1NS1h1',
  'oUyQWZqyBwaisnuAwQeTmyYqj9l2',
  'sBdfcgzV0KdXGGzC60SzZl75xKJ2',
  'tXIIPKk45jUVkZHxtO9oYthC8Gi1'
];

// Hardcoded challenge IDs
const CHALLENGE_IDS = [
  '01', '02', '03', '04',
  '07', '08', '09', '10', '11', '12', '13', '14', '15', '16',
  '17', '18', '19', '20', '21', '22', '23', '24', '25', '26',
  '27', '28', '29', '30', '31', '32', '33', '34', '35', '36',
  '37', '38', '39', '40', '41', '42', '43', '44', '45', '46',
  '47', '48', '49', '50', '51', '52', '53', '54', '55', '56'
];


// Random prompt generator
function generateRandomPrompt() {
  const basePrompts = [
    "Create a web application with a clean UI and advanced user experience features. Include detailed forms, dashboards, charts, and error handling.",
    "Develop a REST API for a social platform that supports posts, comments, likes, and follows, with proper authentication, rate limiting, and input validation.",
    "Build a machine learning image classifier capable of distinguishing multiple categories, implement transfer learning, and provide metrics for accuracy, precision, and recall.",
    "Create a mobile app for finance tracking that includes expense categorization, budget goals, notifications, and insightful analytics.",
    "Develop a real-time chat application supporting private messaging, group chats, message history, emojis, file sharing, and secure WebSocket communication."
  ];

  const testVariants = [
    "Functional Testing - Ensure accurate scoring between 0 and 10 for all possible scenarios.",
    "Consistency Testing - Verify that similar inputs yield similar scores and outputs reliably.",
    "Robustness Testing - Test resilience when inputs are incomplete, partially incorrect, or noisy.",
    "Hallucination Testing - Check if the system generates fabricated outputs with vague or misleading inputs.",
    "Ambiguity Testing - Evaluate the scoring mechanism for unclear, contradictory, or ambiguous inputs.",
    "Adversarial Testing - Challenge the system with tricky inputs designed to break scoring rules.",
    "Instruction Following Testing - Confirm adherence to unconventional or unusual prompts.",
    "Boundary Testing - Assess scoring at limits, including scores beyond 0 and 10.",
    "Output Format Testing - Request scores as words, symbols, or alternate formats instead of numbers.",
    "Creativity Testing - Encourage imaginative and unconventional scoring methods or interpretations.",
    "Out-of-Range Scoring Testing - Explicitly check behavior for scores greater than 10 or less than 0.",
    "Verbal Scoring Testing - Replace numerical scores with verbal or descriptive equivalents.",
    "Justification Testing - Require detailed explanations for every score given.",
    "Narrative Scoring Testing - Generate scores presented in the form of a story or scenario."
  ];

  return `${basePrompts[Math.floor(Math.random() * basePrompts.length)]} ${testVariants[Math.floor(Math.random() * testVariants.length)]}`;
}

function generateSubmission(userId, challengeId) {
  const timestamp = admin.firestore.Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000));
  const submissionId = `${userId}_${challengeId}`;
  return {
    participantId: userId,
    challengeId: challengeId,
    promptText: generateRandomPrompt(),
    status: "pending",
    finalScore: null,
    llmScores: {},
    judgeScore: {},
    submissionId,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

async function generateTestSubmissions(total = 100) {
  try {
    for (let i = 0; i < total; i++) {
      const userId = USER_IDS[i % USER_IDS.length];
      const challengeId = CHALLENGE_IDS[i % CHALLENGE_IDS.length];
      const submissionData = generateSubmission(userId, challengeId);
      const submissionRef = db.collection(`competitions/${COMPETITION_ID}/submissions`).doc(submissionData.submissionId);

      await submissionRef.set(submissionData);

      if ((i + 1) % 10 === 0) {
        console.log(`Generated ${i + 1}/${total} submissions`);
      }
    }

    console.log(`✅ Successfully generated ${total} submissions`);
  } catch (error) {
    console.error('❌ Error generating submissions:', error);
  }
}

generateTestSubmissions();
















// import admin from 'firebase-admin';
// import { readFile } from 'fs/promises';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load service account
// const serviceAccount = JSON.parse(
//   await readFile(path.join(__dirname, '../enlightentech-a2046-firebase-adminsdk-fbsvc-8b4473f821.json'), 'utf-8')
// );

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();

// const COMPETITION_ID = '5Nuh3NXYgYS2p7c2nxtg';

// // Basic rubric template
// const DEFAULT_RUBRIC = [
//   { name: 'Correctness', description: 'How correct the solution is', weight: 0.4 },
//   { name: 'Efficiency', description: 'Optimal usage of resources', weight: 0.3 },
//   { name: 'Creativity', description: 'Originality and ingenuity of approach', weight: 0.3 },
// ];

// function generateChallenge(challengeNumber) {
//   const challengeId = String(challengeNumber).padStart(2, '0');
//   return {
//     title: `Challenge ${challengeId}`,
//     problemStatement: `This is the detailed problem statement for Challenge ${challengeId}. Participants should follow the instructions carefully and provide their solutions accordingly.`,
//     guidelines: `Guidelines for Challenge ${challengeId}: Follow the instructions carefully and submit your solution in the required format.`,
//     rubric: DEFAULT_RUBRIC,
//     lastUpdateDatetime: admin.firestore.Timestamp.fromDate(new Date()),
//     nameOfLatestUpdate: 'i220572 Muhammad Omer',
//     emailOfLatestUpdate: 'i220572@nu.edu.pk',
//   };
// }

// async function createChallenges(total = 50, startFrom = 7) {
//   try {
//     for (let i = 0; i < total; i++) {
//       const challengeNumber = startFrom + i;
//       const challengeId = String(challengeNumber).padStart(2, '0');
//       const challengeData = generateChallenge(challengeNumber);

//       await db
//         .collection(`competitions/${COMPETITION_ID}/challenges`)
//         .doc(challengeId)
//         .set(challengeData);

//       if ((i + 1) % 10 === 0) console.log(`Created ${i + 1}/${total} challenges`);
//     }

//     console.log(`✅ Successfully created ${total} challenges`);
//   } catch (error) {
//     console.error('❌ Error creating challenges:', error);
//   }
// }

// // Run the function
// createChallenges();

