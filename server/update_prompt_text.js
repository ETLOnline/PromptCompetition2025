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
const COLLECTION_PATH = 'competitions/04lVu4tVtBbeXSwxubiL/submissions';
const TARGET_FIELD = 'promptText';
const NEW_PROMPT_TEXT = `1. Visual Interpretation Narrative: The image represents a rural backward area where probably a community is shown including both males and females. The community is focused and motivated to learn. Since some people may not know how to write or read, they are holding a digital device helping them educate by showing visuals and patterns. Many women are holding babies probably showing that in rural areas, girls get marry in the age when they could be educated. But still those girls are so passionate for education that parenthood is not becoming a barrier for them. It prominently shows a man holding a mobile being the main teacher in this scenario who is making other people understand things easily. This probably is showing that some people do get educated in rural areas too but most of them are males and females are far behind. The senior man shown in the community might be a sign of safety for girls where community is culturally sensitive. 2. Final Engineered Prompt: Persona: You should act as a social innovation strategist and community educator. Context: You have to deal with Asian Continent where there are social and cultural barriers and gender bias making them digitally exclusive in terms of infrastructure and education. Like in Pakistan, there are social barriers preventing girls to take part ahead in literacy or financial independence. Also Asian countries are mostly considered as third world countries where education is not that much preferred hence so many children just learn to do child labour from their childhood. You have to make strategy that breaks these social stigmas and encouraging digital literacy by maintaining safety precautions and emotional attachments to generational gaps. Furthermore, learning together like in communities are preferred more than learning solo so you should also keep in mind this fact. Objective: You have to make effective strategies and suggest improvements through which they can improve digital literacy, break socio-cultural barriers in terms of education and help mitigate gender bias by encouraging women take part in education. Building and maintaining a safe and trusted environment to improve the literacy rates through familiar community settings. Educating people for women empowerment by being cautious to the long living generational gap. You must also highlight how an educated woman changes an entire generation for educating the society about the females' education. Constraints: Your must be culturally sensitive so people may better understand without being emotional. Use culturally resonant examples and language. You must be budget conscious so your strategies are easier to implement. You must encourage inter generational learning. Your strategies should be multilingual so they are easier to understand for everyone. Your solutions should be low cost and low tech. Format: Your strategies must have clearly defined sections separated as Target Groups, Learning Modules, Community Engagement, Sustainability Metrics etc 3. Translation Rationale: The Visual Narrative shows Women being passionate about learning but they are restricted due to the cultural and social barriers. My Prompt will generate a strategy for educating society about empowering a woman like how it can impact the whole generation. The prompt is directed to be cautious to the society norms so they may better understand the basic thing. It will highlight the community driven learning being more preferred according to the societal norms. In the prompt, the strategy will be cost and technology effective. The prompt emphasizes the multi-language strategy so it's better to understand for different people.`;

const updateSubmissions = async () => {
  try {
    console.log(`Fetching documents from ${COLLECTION_PATH}...`);
    
    // Fetch all documents in the collection
    const snapshot = await db.collection(COLLECTION_PATH).get();
    
    if (snapshot.empty) {
      console.log('No documents found in the collection.');
      return;
    }

    console.log(`Found ${snapshot.size} documents. Starting batch update...`);

    const BATCH_SIZE = 500;
    let batch = db.batch();
    let operationCount = 0;
    let totalUpdated = 0;

    for (const doc of snapshot.docs) {
      // Add update operation to the batch
      batch.update(doc.ref, { [TARGET_FIELD]: NEW_PROMPT_TEXT });
      
      operationCount++;
      totalUpdated++;

      // Commit the batch if it reaches the Firestore limit
      if (operationCount === BATCH_SIZE) {
        await batch.commit();
        console.log(`Committed batch of ${BATCH_SIZE} updates...`);
        batch = db.batch(); // Create a new batch
        operationCount = 0;
      }
    }

    // Commit any remaining operations in the final batch
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} updates.`);
    }

    console.log(`Successfully updated ${totalUpdated} documents.`);

  } catch (error) {
    console.error('Error updating documents:', error);
  } finally {
    process.exit();
  }
};

updateSubmissions();