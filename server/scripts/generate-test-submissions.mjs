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
const COMPETITION_ID = 'yPIgKL2iQ6KRNSfy62Wm';

// Hardcoded user/participant IDs
const USER_IDS = [
  "0ndmYrjtzQd5SubjxkUWxaTj1EH2",
  "0tYg52rtWsUaKej4iPROtdQ7sYJ2",
  "1K87UNlOdff8jAzFJfYEqwPI2ru1",
  "1fRmYYU3nKd6sEQFJv8oPlHMGMm1",
  "2S9WkEZvO0RgfCud0Kcdbuv8AYC3",
  "2ViH22ztlEM834ziBKJdae0yuC43",
  "2pRZm4sQNoRmiB6yfGZRJFiscjB3",
  "6xhoEBuVn2YFNW9TeaJdIlB1ztx2",
  "6yFsKc8SzrZqepMDsySPenL3bK83",
  "74WhwTzi5eMlEmHRJOE9rs26GFk1",
  "7jVqsktjhHblfjz6zqTMYjkuJ8A2",
  "9N9wR8OXFcXjraRNLUSvFla98263",
  "9cBe1dkA5cUAdS4JpWpD7dysOYI3",
  "BI9pghU6Woh3XBln3s2d6eErueH2",
  "BVn3MlCTPxOWTEb7dcY4H73n1Sm1",
  "C0rl8d6RKkecZoiTqdNqTwy0lYy2",
  "DBKp3nGiR9SwG6SX89L7WjveGwz1",
  "DLJ87df2ayXM6tC2AGWDi2MFHJ63",
  "DMdkj9Xr5ZZk48AcSMfkgY2f1O72",
  "E6VA2u0muwVWjXLQq5okjr384YD3",
  "E81x2yJCtEXbwzcQyivmoJL7Xmn1",
  "F5QNVOWm8TQBcIfyGYTVFLRz2q32",
  "Fd7r9pBrI2c20HBUtixUicfNs2j2",
  "HRdfbXC7EtdqoVrGvUrZjrZteTa2",
  "ILWrF38F8Bg0YJWwv4GSN0YwXU62",
  "IeZcOTxCLtWAR0ZKmLodZaeZJXX2",
  "KQtpgTGa0TPiwyUYgTsuFd1MbGm1",
  "PiD8AMbvepbxqCDVGJ1f11OEXph2",
  "RPuQSS0Y9cPMIYbTVq3XHiMQcrx1",
  "S75E0AbzWWUIPoEgFFv7sbKg3cr1",
  "Sd2R72OkyzMf88QASHPkMXDj9K02",
  "T5zpNiyjgbVIGdXouwYZNIHoj4i1",
  "UtRxe6ejQdWYFYU8nMbxHWUDM7r2",
  "V8D86YHTdHOQqWQmloGusT1NS1h1",
  "Vhmkj683E7UfzhZppxTJZZfnV4m2",
  "ZiRVLn35gDPOSegaRfbPfk45awG2",
  "aUTELBRFy6dLXu6fzkyRG4LB0Lr2",
  "aunJ80DLrpUdWTRmIDSkooiPfj63",
  "bIJUtIR0jBV6pMzg2ESmwWbmZRC2",
  "cIBXuOj6PcQAtaozkZQ1SI11gw33",
  "cKJXozn2wLQoQOwm7TXp8ssXrCy2",
  "cNWqCMlYciX1HOvn1F1AWlzg1Iz1",
  "eurS7jn0hAYNIuTiQqlw3U7Yfrx1",
  "i8MA1GIMiWPErgffYkBJsrSFb9p1",
  "j0bJoCcXtGQz8rEXO9uHOXsgoi52",
  "jTPreZj5NZZISfxBknWwP15Nac62",
  "nJS2S10UPNOq4c3ifReeBwOFcjE3",
  "oUyQWZqyBwaisnuAwQeTmyYqj9l2",
  "omR4VWuNXgOauKLXo9vooQx5OmN2",
  "pZ0za9UM85YtWKkoBhsGUEm54Cb2",
  "qgvWYygeRiMePwYvaXMJwl84Fzp1",
  "r4YIREotZKQcb8NasaQ0SRYGSYy2",
  "rQyMc3ntXZUHevz2Jw7jqOUGube2",
  "rR7PP2q1ReW962V7QPrpmWSBsHq1",
  "sBdfcgzV0KdXGGzC60SzZl75xKJ2",
  "tXIIPKk45jUVkZHxtO9oYthC8Gi1",
  "tnjv5xVVBmPYS0evkSCWnN8XA6g2",
  "u3HVnU8Q6ugKyMhNIhHiRMLdCXJ3",
  "u3oJjmBkalWshfpsmOBETB7E6pC3",
  "uZB9D8OWfyRT7SE8zUppAzSCezm1",
  "ubFm6O5FHBSdeqCn2U7sYTFx68D3",
  "vv9WnrHEXag0hyh7PYg6jMHruJE3",
  "wHuRITfwYdYbKzgaOief1duJzzE3",
  "wzCK33Qb5shdJqZPnysQllJHAzH3",
  "xu3rmJKvaBWxzENLpBGA2DzkMpX2"
];



// Hardcoded challenge IDs
const CHALLENGE_IDS = [
  '01', '02', '03', '04', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16',
  '17', '18', '19', '20', '21', '22', '23', '24', '25', '26',  '27', '28', '29', '30',
  // '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44',
  // '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56'
];


const CHALLENGES = [
  {
    title: 'Challenge 01: Creative Story Generation',
    problemStatement: `
Participants are tasked with designing a prompt that guides an AI to generate a short story 
based on a specific theme, genre, or scenario. The AI-generated story should include:
1. A coherent and engaging plot with a clear beginning, middle, and end.
2. Well-defined characters with unique traits and realistic dialogue.
3. Creative narrative elements while avoiding clichés and generic descriptions.
4. Consistency in tone and style throughout the story.

The challenge emphasizes clarity in prompt instructions, ensuring the AI produces 
imaginative and high-quality outputs while minimizing irrelevant or off-topic content. 
Participants should also consider how to instruct the AI to handle unexpected twists or 
to adapt the story length according to user requirements.
    `,
    guidelines: `
- Specify the theme, genre, and desired tone explicitly in your prompt.
- Include constraints such as word count, narrative perspective, or specific plot points.
- Provide examples of input scenarios and expected output style.
- Test the prompt on multiple story ideas to ensure versatility.
- Bonus: design the prompt to allow multiple variations of the story while staying consistent with the theme.
    `,
  },
  {
    title: 'Challenge 02: Summarization with Context',
    problemStatement: `
Design a prompt that instructs an AI to summarize long-form text, such as articles, 
research papers, or reports. The AI should:
1. Preserve the key points, factual accuracy, and important details.
2. Maintain the context and logical flow of information.
3. Produce a readable summary that is concise and coherent.
4. Optionally, adapt the summary style (bullet points, paragraph, executive summary).

Participants should focus on guiding the AI to avoid omission of critical details 
and to prevent the inclusion of hallucinated or irrelevant content.
    `,
    guidelines: `
- Clearly specify the desired summary length and format.
- Include instructions to retain factual accuracy and logical order.
- Provide multiple text examples to test prompt effectiveness.
- Encourage the AI to differentiate between main points and minor details.
- Bonus: design a prompt that allows adjustable verbosity or tone.
    `,
  },
  {
    title: 'Challenge 03: Question Answering with Step-by-Step Reasoning',
    problemStatement: `
Create a prompt that enables an AI to answer questions that require multi-step reasoning, 
logic, or calculations. The AI should:
1. Break down the problem into intermediate steps.
2. Explain the reasoning for each step clearly.
3. Arrive at a final answer that is accurate and well-justified.
4. Handle different types of questions (quantitative, logical, or conceptual).

The main goal is to guide the AI to produce transparent, structured, and verifiable 
answers rather than providing only the final solution.
    `,
    guidelines: `
- Include instructions for step-by-step explanation and logical reasoning.
- Test the prompt on varied question types to ensure adaptability.
- Specify the format for answers (e.g., numbered steps, paragraphs).
- Ensure the AI avoids skipping steps or making unsupported assumptions.
- Bonus: include instructions for handling ambiguous or incomplete questions.
    `,
  },
  {
    title: 'Challenge 04: Role-Playing AI Assistant',
    problemStatement: `
Design a prompt that transforms the AI into a specialized role, such as a tutor, 
career counselor, or historical figure. The AI should:
1. Maintain the persona consistently across multiple interactions.
2. Provide advice, information, or solutions relevant to the role.
3. Use appropriate tone, style, and knowledge for the role.
4. Adapt responses according to the user’s queries or context.

The challenge emphasizes persona consistency, context-awareness, and adaptability.
Participants must carefully craft the prompt to prevent the AI from deviating from 
the assigned role.
    `,
    guidelines: `
- Clearly define the role, personality traits, and expertise of the AI.
- Include instructions for how the AI should handle unknown queries.
- Provide sample dialogues to illustrate desired behavior.
- Test the prompt across diverse scenarios to ensure role consistency.
- Bonus: design prompts that allow the AI to adjust tone based on user emotion.
    `,
  },
  {
    title: 'Challenge 05: Instruction Clarity and Precision',
    problemStatement: `
Participants must create a prompt that elicits highly precise and unambiguous 
responses from the AI. The AI should:
1. Follow instructions accurately without misinterpretation.
2. Avoid unnecessary elaboration unless specified.
3. Adapt to complex or nested instructions provided by the user.
4. Detect and clarify ambiguities when possible.

The focus is on crafting prompts that maximize clarity and reduce hallucination or 
misunderstanding in AI outputs.
    `,
    guidelines: `
- Include explicit constraints, examples, and expected formats.
- Test prompts on instructions of varying complexity.
- Include guidance for AI to handle unclear or incomplete instructions.
- Bonus: make the prompt adaptive to multi-step instructions.
    `,
  },
  {
    title: 'Challenge 06: Creativity and Innovation Prompting',
    problemStatement: `
Design a prompt that encourages the AI to produce innovative, out-of-the-box ideas 
or solutions. The AI should:
1. Generate creative suggestions for a given problem or topic.
2. Avoid generic or overly common responses.
3. Provide reasoning or justification for creative choices.
4. Balance novelty with feasibility and relevance.

This challenge evaluates how well participants can push the AI toward creative outputs 
while keeping them practical and coherent.
    `,
    guidelines: `
- Specify constraints to guide creativity (topic, format, or audience).
- Include examples of expected innovative responses.
- Test prompt versatility across different problem domains.
- Bonus: design a prompt that generates multiple creative options per input.
    `,
  },
  {
    title: 'Challenge 07: Ethical and Safe AI Output',
    problemStatement: `
Create a prompt that ensures AI-generated content is safe, ethical, and appropriate 
for all audiences. The AI should:
1. Avoid generating harmful, biased, or offensive content.
2. Maintain inclusivity and neutrality in tone.
3. Respond gracefully to sensitive or controversial topics.
4. Balance informative responses with ethical constraints.

Participants are evaluated on their ability to enforce ethical guidelines through prompt design.
    `,
    guidelines: `
- Explicitly instruct the AI to avoid harmful content.
- Include examples of safe vs unsafe outputs.
- Test prompt effectiveness with tricky or controversial queries.
- Bonus: prompt can dynamically flag or refuse unsafe queries.
    `,
  },
  {
    title: 'Challenge 08: Multi-Lingual Prompt Design',
    problemStatement: `
Design a prompt that enables the AI to handle multiple languages effectively. The AI should:
1. Correctly understand queries in different languages.
2. Respond in the same language unless instructed otherwise.
3. Maintain tone, style, and clarity across languages.
4. Translate or explain content accurately when requested.

This challenge tests participants’ ability to craft prompts that expand the AI’s usability globally.
    `,
    guidelines: `
- Specify supported languages and desired behavior for each.
- Provide sample multilingual queries to test accuracy.
- Include instructions for translation or code-switching.
- Bonus: prompt can handle language detection automatically.
    `,
  },
  {
    title: 'Challenge 09: Fact Verification and Accuracy',
    problemStatement: `
Create a prompt that guides the AI to provide factually accurate information 
and verify claims against reliable sources. The AI should:
1. Indicate uncertainty when information is unclear or unverified.
2. Reference credible sources when possible.
3. Avoid making assumptions or fabricating facts.
4. Provide concise explanations for verification processes.

The focus is on building trust in AI responses and reducing hallucinations.
    `,
    guidelines: `
- Include instructions to check claims and cite sources.
- Provide examples of factual vs inaccurate answers.
- Test prompt across multiple knowledge domains.
- Bonus: prompt can differentiate between opinion-based and fact-based questions.
    `,
  },
  {
    title: 'Challenge 10: Adaptive User Interaction',
    problemStatement: `
Design a prompt that allows the AI to adapt its responses based on user inputs, 
preferences, or previous interactions. The AI should:
1. Remember relevant context from prior queries.
2. Adjust tone, style, or depth based on user needs.
3. Ask clarifying questions when input is ambiguous.
4. Provide tailored, relevant answers while maintaining consistency.

This challenge emphasizes user-centric AI behavior and context-aware prompt design.
    `,
    guidelines: `
- Include instructions for context retention and adaptive behavior.
- Provide examples showing how AI adapts across multiple interactions.
- Test prompt across different user personas and query styles.
- Bonus: include optional personalization features like preferred language or tone.
    `,
  },
];

const ADDITIONAL_CHALLENGES = [
  {
    title: 'Challenge 11: Sentiment-Aware Text Generation',
    problemStatement: `
Design a prompt that instructs an AI to generate text while controlling the sentiment
of the output (positive, neutral, or negative). The AI should maintain coherence
and context while reflecting the requested emotional tone.
    `,
    guidelines: `
- Specify the desired sentiment explicitly.
- Provide examples for each sentiment type.
- Ensure the AI adapts tone without altering factual content.
- Bonus: prompt can handle subtle shifts in sentiment within the same text.
    `,
  },
  {
    title: 'Challenge 12: Structured Data to Narrative',
    problemStatement: `
Create a prompt that transforms structured data (tables, CSVs, or JSON) into
a readable narrative summary or story. The AI should maintain accuracy and clarity.
    `,
    guidelines: `
- Include instructions for handling data fields and units.
- Ensure narrative flows logically.
- Provide sample structured data and expected output.
- Bonus: prompt can adapt narrative style based on audience type.
    `,
  },
  {
    title: 'Challenge 13: Dialogue Generation with Personality',
    problemStatement: `
Develop a prompt that generates multi-turn dialogues between AI characters
with distinct personalities. Conversations should remain coherent, contextually relevant,
and reflect individual character traits.
    `,
    guidelines: `
- Specify character traits and background for each speaker.
- Include instructions for context retention over turns.
- Test with sample dialogues.
- Bonus: prompt allows dynamic adaptation of character responses.
    `,
  },
  {
    title: 'Challenge 14: Translation with Style Preservation',
    problemStatement: `
Design a prompt that translates text between languages while preserving
original tone, style, and nuance. The AI should handle idiomatic expressions appropriately.
    `,
    guidelines: `
- Specify source and target languages.
- Include tone/style preservation instructions.
- Provide sample phrases and expected translations.
- Bonus: prompt can handle informal/slang expressions correctly.
    `,
  },
  {
    title: 'Challenge 15: Code Generation from Instructions',
    problemStatement: `
Create a prompt that converts natural language instructions into executable code.
The AI should generate correct, efficient, and readable code in a specified language.
    `,
    guidelines: `
- Specify programming language explicitly.
- Include constraints on code structure and efficiency.
- Provide sample instructions and expected outputs.
- Bonus: prompt handles edge cases and exceptions.
    `,
  },
  {
    title: 'Challenge 16: Explain Complex Concepts Simply',
    problemStatement: `
Design a prompt that instructs the AI to explain complex technical concepts
in simple, easy-to-understand language for non-experts.
    `,
    guidelines: `
- Specify audience expertise level.
- Provide examples of complex concepts.
- Encourage analogies or visual explanations.
- Bonus: prompt can adjust depth of explanation dynamically.
    `,
  },
  {
    title: 'Challenge 17: Bias Detection and Mitigation',
    problemStatement: `
Create a prompt that guides the AI to detect and reduce bias in generated content,
ensuring fairness and neutrality.
    `,
    guidelines: `
- Include instructions for identifying biased language.
- Provide examples of biased vs neutral outputs.
- Bonus: prompt can automatically rephrase biased statements.
    `,
  },
  {
    title: 'Challenge 18: Summarization with Highlighting Key Phrases',
    problemStatement: `
Design a prompt that summarizes text while highlighting key phrases,
keywords, or concepts for quick reference.
    `,
    guidelines: `
- Specify output format (highlighted phrases, bullet points, etc.).
- Ensure summary is concise and accurate.
- Bonus: prompt can prioritize domain-specific terms automatically.
    `,
  },
  {
    title: 'Challenge 19: Multi-Objective Problem Solving',
    problemStatement: `
Develop a prompt that allows AI to solve problems with multiple objectives
(e.g., maximize efficiency while minimizing cost). The AI should explain trade-offs.
    `,
    guidelines: `
- Include instructions for identifying trade-offs.
- Provide examples with clear objectives.
- Bonus: prompt generates ranked solutions with reasoning.
    `,
  },
  {
    title: 'Challenge 20: Content Style Transformation',
    problemStatement: `
Create a prompt that transforms text from one style to another
(e.g., formal to casual, narrative to persuasive) without changing meaning.
    `,
    guidelines: `
- Specify source and target style clearly.
- Provide sample transformations.
- Bonus: prompt can handle mixed styles in longer texts.
    `,
  },
  {
    title: 'Challenge 21: Interactive Storytelling',
    problemStatement: `
Design a prompt for AI to create interactive stories where the user makes
choices that affect the plot. The AI should maintain continuity across paths.
    `,
    guidelines: `
- Include instructions for branching storylines.
- Ensure coherence regardless of user choices.
- Bonus: prompt can generate multiple story branches automatically.
    `,
  },
  {
    title: 'Challenge 22: Fact vs Opinion Differentiation',
    problemStatement: `
Create a prompt that guides the AI to identify whether statements
are factual or opinion-based and justify its classification.
    `,
    guidelines: `
- Include clear instructions for classification.
- Provide examples for training.
- Bonus: prompt can provide confidence scores for each classification.
    `,
  },
  {
    title: 'Challenge 23: Data-to-Insight Generation',
    problemStatement: `
Design a prompt that converts raw data into actionable insights or recommendations.
The AI should provide reasoning and prioritize the most important findings.
    `,
    guidelines: `
- Specify data types and expected output format.
- Provide sample datasets.
- Bonus: prompt can rank insights by importance or relevance.
    `,
  },
  {
    title: 'Challenge 24: Humor Generation',
    problemStatement: `
Develop a prompt that instructs AI to generate humorous content
(jokes, puns, or witty commentary) while remaining appropriate and contextually relevant.
    `,
    guidelines: `
- Specify type of humor and audience.
- Include sample inputs and outputs.
- Bonus: prompt can adapt humor style dynamically.
    `,
  },
  {
    title: 'Challenge 25: Multi-Step Instruction Following',
    problemStatement: `
Create a prompt that ensures AI can follow multi-step instructions
accurately and sequentially, producing the expected output at each step.
    `,
    guidelines: `
- Provide clear step numbering or hierarchy.
- Test with complex multi-step instructions.
- Bonus: prompt can check for step completion before proceeding.
    `,
  },
  {
    title: 'Challenge 26: Contextual Sentiment Analysis',
    problemStatement: `
Design a prompt that analyzes sentiment in context, considering sarcasm,
negation, or nuanced expressions.
    `,
    guidelines: `
- Include examples of nuanced sentiment.
- Provide instructions for handling context-dependent phrases.
- Bonus: prompt outputs sentiment scores with explanations.
    `,
  },
  {
    title: 'Challenge 27: Multi-Document Summarization',
    problemStatement: `
Create a prompt that summarizes information from multiple documents,
maintaining accuracy, consistency, and logical flow.
    `,
    guidelines: `
- Specify how to combine information from different sources.
- Provide sample documents.
- Bonus: prompt can resolve contradictions across sources.
    `,
  },
  {
    title: 'Challenge 28: Personalized Content Recommendations',
    problemStatement: `
Design a prompt that allows AI to generate personalized recommendations
(e.g., articles, products, or learning materials) based on user preferences.
    `,
    guidelines: `
- Include instructions for capturing user preferences.
- Provide examples of personalized recommendations.
- Bonus: prompt adapts recommendations dynamically over time.
    `,
  },
  {
    title: 'Challenge 29: Interactive Q&A Tutor',
    problemStatement: `
Develop a prompt that turns AI into an interactive tutor for a subject.
The AI should answer questions, provide hints, and explain concepts progressively.
    `,
    guidelines: `
- Specify the subject and knowledge level.
- Provide sample Q&A sessions.
- Bonus: prompt adapts difficulty based on user responses.
    `,
  },
  {
    title: 'Challenge 30: Ethical Dilemma Analysis',
    problemStatement: `
Create a prompt that instructs AI to analyze ethical dilemmas,
present different perspectives, and suggest possible courses of action.
    `,
    guidelines: `
- Include instructions to consider multiple viewpoints.
- Provide examples of ethical dilemmas.
- Bonus: prompt evaluates consequences and trade-offs for each option.
    `,
  },
];


// rubric categories (more diverse)
const RUBRIC_CATEGORIES = [
  { name: 'Correctness', weight: 0.3 },
  { name: 'Efficiency', weight: 0.2 },
  { name: 'Creativity', weight: 0.2 },
  { name: 'Clarity & Presentation', weight: 0.15 },
  { name: 'Innovation', weight: 0.15 },
];


const PROMPT_STYLES = [
  {
    type: 1,
    label: 'Fails / Irrelevant',
    examples: [
      'I have no idea how to approach this problem. Maybe AI is cool?',
      'This is completely unrelated content about something else.',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
    ]
  },
  {
    type: 2,
    label: 'Attempts but fails significantly',
    examples: [
      'I tried to answer the question, but most of my points are incorrect. I think AI might help, but I am unsure how to structure it.',
      'The submission mentions some keywords but completely misses the key concepts required by the challenge.',
      'Partial attempt: some ideas about reasoning, but explanations are incoherent and flawed.'
    ]
  },
  {
    type: 3,
    label: 'Addresses with flaws / omissions',
    examples: [
      'The solution covers the main points but misses important nuances. For example, it explains step-by-step reasoning but does not include examples or edge cases.',
      'The response is mostly correct, but clarity suffers in certain sections, and some key criteria are not addressed.',
      'Explains the concept and provides some examples, but reasoning is partially incomplete or slightly inaccurate.'
    ]
  },
  {
    type: 4,
    label: 'Effectively meets criterion',
    examples: [
      'The submission clearly answers the challenge. It provides structured reasoning, includes examples, and demonstrates good understanding, with only minor details that could be improved.',
      'All main criteria are addressed; explanations are coherent and relevant. Formatting and clarity are good, and the examples enhance comprehension.',
      'A detailed response that meets expectations: step-by-step reasoning, illustrative examples, concise explanations, and minor improvements could be added for completeness.'
    ]
  },
  {
    type: 5,
    label: 'Flawless / Creative',
    examples: [
      'The answer is excellently structured, thorough, and highly creative. It includes multiple examples, step-by-step reasoning, and innovative approaches that go beyond the basic requirements.',
      'A highly detailed, engaging, and clear response. It combines storytelling, practical examples, and in-depth analysis, demonstrating mastery of the subject.',
      'The submission exceeds expectations: detailed explanations, creative analogies, edge-case consideration, and perfectly addresses all rubric criteria.'
    ]
  }
];


function getRandomPrompt(type) {
  const style = PROMPT_STYLES.find(s => s.type === type);
  return style.examples[Math.floor(Math.random() * style.examples.length)];
}

// Generate a Firestore-ready submission
function generateSubmission(userId, challengeId) {
  const timestamp = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
  );
  const submissionId = `${userId}_${challengeId}`;

  // Pick a random style (1-5) to vary prompt text
  const performanceType = Math.floor(Math.random() * 5) + 1;

  return {
    participantId: userId,
    challengeId,
    promptText: getRandomPrompt(performanceType), // main variation
    submissionTime: timestamp,
    status: 'pending',
    submissionId
  };
}

// Generate multiple submissions
async function generateTestSubmissions(total = 500) {
  try {
    for (let i = 0; i < total; i++) {
      const userId = USER_IDS[i % USER_IDS.length];
      const challengeId = CHALLENGE_IDS[i % CHALLENGE_IDS.length];
      const submissionData = generateSubmission(userId, challengeId);

      const submissionRef = db
        .collection(`competitions/${COMPETITION_ID}/submissions`)
        .doc(submissionData.submissionId);

      await submissionRef.set(submissionData);

      if ((i + 1) % 10 === 0) console.log(`Generated ${i + 1}/${total} submissions`);
    }

    console.log(`✅ Successfully generated ${total} submissions`);
  } catch (error) {
    console.error('❌ Error generating submissions:', error);
  }
}

async function createChallengesFromArray(challenges) {
  try {
    for (let i = 0; i < challenges.length; i++) {
      const challengeNumber = i + 1;
      const challengeId = String(challengeNumber).padStart(2, '0');

      const challengeData = {
        ...challenges[i],
        rubric: RUBRIC_CATEGORIES,
        lastUpdateDatetime: admin.firestore.Timestamp.fromDate(new Date()),
        nameOfLatestUpdate: 'i220572 Muhammad Omer',
        emailOfLatestUpdate: 'i220572@nu.edu.pk',
      };

      await db
        .collection(`competitions/${COMPETITION_ID}/challenges`)
        .doc(challengeId)
        .set(challengeData);

      console.log(`✅ Created Challenge ${challengeId}: ${challengeData.title}`);
    }

    console.log(`🎉 Successfully created ${challenges.length} challenges!`);
  } catch (error) {
    console.error('❌ Error creating challenges:', error);
  }
}

async function createParticipants() {
  try {
    for (let i = 0; i < USER_IDS.length; i++) {
      const userId = USER_IDS[i];

      // Example participant data; you can customize fullName/email as needed
      const participantData = {
        fullName: `User ${i + 1}`, // placeholder, replace if real names are available
        email: `user${i + 1}@example.com`, // placeholder, replace with real emails if available
        registeredAt: admin.firestore.Timestamp.fromDate(new Date())
      };

      await db
        .collection(`competitions/${COMPETITION_ID}/participants`)
        .doc(userId)
        .set(participantData);

      if ((i + 1) % 10 === 0) console.log(`Added ${i + 1}/${USER_IDS.length} participants`);
    }

    console.log(`✅ Successfully added ${USER_IDS.length} participants`);
  } catch (error) {
    console.error('❌ Error adding participants:', error);
  }
}

// Run the function
// createParticipants();

// Run the function
// createChallengesFromArray([...CHALLENGES, ...ADDITIONAL_CHALLENGES]);

// generateTestSubmissions();
