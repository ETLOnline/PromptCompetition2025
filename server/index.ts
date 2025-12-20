// // server/index.js
// import dotenv from "dotenv";
// dotenv.config(); // Load environment variables at the very top

// console.log("1. Environment loaded first, API key present:", !!process.env.OPENROUTER_API_KEY);

// import express from "express";
// import cors from "cors";

// // Routers
// import evaluateRouter from "./routes/evaluate.js";
// import evaluateAllRouter from "./routes/evaluateAll.js";
// import leaderboardRouter from "./routes/generateLeaderboard.js";
// import superadminRouter from "./routes/superadmin.js";
// import competitionsRouter from "./routes/competitions.js";
// import contactRouter from "./routes/contact.js";
// import resultRoutes from "./routes/result.js";
// import submissionsRouter from "./routes/submissions.js";




// import { auth } from "./config/firebase-admin.js"; // ✅ Import Firebase Admin Auth

// console.log("2. Starting server setup...");
// console.log("3. Routers imported successfully");

// const app = express();

// // ✅ CORS configuration (single, proper configuration)
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || "http://localhost:3000",
//   credentials: true
// }));

// app.use(express.json());

// // ✅ Healthcheck endpoint
// app.get("/test", (req, res) => {
//   res.json({ 
//     message: "Server is working!", 
//     hasApiKey: !!process.env.OPENROUTER_API_KEY,
//     keyPreview: process.env.OPENROUTER_API_KEY?.substring(0, 15) + "..."
//   });
// });

// // ✅ Main app routes
// app.use("/evaluate", evaluateRouter);
// app.use("/bulk-evaluate", evaluateAllRouter); 
// app.use("/leaderboard", leaderboardRouter);
// app.use("/superadmin", superadminRouter);
// app.use("/competition", competitionsRouter);
// app.use("/contact", contactRouter);
// app.use("/results", resultRoutes);
// app.use("/submissions", submissionsRouter);




// console.log("4. Routes configured");

// // ✅ Start the server
// const PORT = parseInt(process.env.PORT || "8080", 10);
// const HOST = process.env.HOST || "0.0.0.0";

// app.listen(PORT, HOST, () => {
//   console.log(`5. Server running on ${HOST}:${PORT}`);
//   console.log("6. All files loaded successfully!");
// });

// // ✅ Graceful shutdown handling
// process.on('SIGTERM', () => {
//   console.log('SIGTERM received, shutting down gracefully');
//   process.exit(0);
// });

// process.on('SIGINT', () => {
//   console.log('SIGINT received, shutting down gracefully');
//   process.exit(0);
// });

// server/index.ts
import dotenv from "dotenv";
dotenv.config(); // Load environment variables at the very top

console.log("1. Environment loaded first, API key present:", !!process.env.OPENROUTER_API_KEY);

import express from "express";
import cors from "cors";

//import "./config/email.js"; 
// Routers
import evaluateAllRouter, { recoverLocksOnStartup } from "./routes/evaluateAll.js";
import leaderboardRouter from "./routes/generateLeaderboard.js";
import superadminRouter from "./routes/superadmin.js";
import competitionsRouter from "./routes/competitions.js";

import roleRoutes from "./routes/roles.js";
import authRoutes from "./routes/auth.js" 
import contactRouter from "./routes/contact.js";
import challengeDistributionRouter from "./routes/challenge-distribution.js";
import uploadRouter from "./routes/upload.js";
import resultRoutes from "./routes/result.js";
import submissionsRouter from "./routes/submissions.js";


// judge dashboard functions
import judgeRouter from "./routes/judge/index.js";
import llmRouter from "./routes/llmevaluations.js";

import lastRouter from "./routes/leaderboard.js";
import welcomeRouter from "./routes/welcome.js";
import dailyChallengeRouter from "./routes/dailychallenge.js";
import overallLeaderboardRouter from "./routes/overallLeaderboard.js";


console.log("2. Starting server setup...");
console.log("3. Routers imported successfully");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Healthcheck endpoint
app.get("/test", (req, res) => {
  res.json({ 
    message: "Server is working!", 
    hasApiKey: !!process.env.OPENROUTER_API_KEY,
    keyPreview: process.env.OPENROUTER_API_KEY?.substring(0, 15) + "..."
  });
});

// ✅ Main app routes
app.use("/bulk-evaluate", evaluateAllRouter); 
app.use("/leaderboard", leaderboardRouter);
app.use("/superadmin", superadminRouter);
app.use("/competition", competitionsRouter);

app.use("/contact", contactRouter);

app.use("/auth", authRoutes)
app.use("/role", roleRoutes);

app.use("/challenge-distribution", challengeDistributionRouter);

app.use("/judge", judgeRouter);
app.use("/results", resultRoutes);
app.use("/llm-evaluations", llmRouter);
app.use("/submissions", submissionsRouter);

app.use("/last", lastRouter);
app.use("/upload", uploadRouter);
app.use("/welcome", welcomeRouter);
app.use("/dailychallenge", dailyChallengeRouter);
app.use("/leaderboard-overall", overallLeaderboardRouter);



console.log("4. Routes configured");

// ensure PORT is a number
const PORT: number = parseInt(process.env.PORT ?? "8080", 10);

// const HOST = process.env.HOST ?? "0.0.0.0";
app.listen(PORT, async () => {
  console.log(`5. Server running on:${PORT}`);
  console.log("6. All files loaded successfully!");
  
  // 🔒 Recover locks on server startup
  try {
    await recoverLocksOnStartup()
  } catch (error) {
    console.error("❌ Failed to recover lock on startup:", error)
  }
});

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));