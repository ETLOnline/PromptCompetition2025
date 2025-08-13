// server/index.ts
import dotenv from "dotenv";
dotenv.config(); // Load environment variables at the very top

console.log("1. Environment loaded first, API key present:", !!process.env.OPENROUTER_API_KEY);

import express from "express";
import cors from "cors";

//import "./config/email.js"; 
// Routers
import evaluateAllRouter from "./routes/evaluateAll.js";
import leaderboardRouter from "./routes/generateLeaderboard.js";
import superadminRouter from "./routes/superadmin.js";
import competitionsRouter from "./routes/competitions.js";

import authRoutes from "./routes/auth.js";


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


app.use("/auth", authRoutes);

console.log("4. Routes configured");

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`5. Server running on port ${PORT}`);
  console.log("6. All files loaded successfully!");
});
