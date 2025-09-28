// LLM Configuration
export const LLM_CONFIG = {
  models: [
    { 
      model: process.env.MODEL_1 || "anthropic/claude-sonnet-4",
      maxTokens: 1000,
      temperature: 0.0
    },
    { 
      model: process.env.MODEL_2 || "openai/gpt-5-chat",
      maxTokens: 1000,
      temperature: 0.0
    },
    { 
      model: process.env.MODEL_3 || "google/gemini-2.5-pro",
      maxTokens: 1000,
      temperature: 0.0
    }
  ],

  // Specialized LLM used to Repair the output structure
  repairModel: {
    model: process.env.MODEL_REPAIR || "anthropic/claude-3-haiku",
    maxTokens: 1000,
    temperature: 0.0
  },

  retryAttempts: Math.max(1, Math.min(5, parseInt(process.env.LLM_RETRY_ATTEMPTS || "2"))),
  retryDelay: Math.max(100, Math.min(5000, parseInt(process.env.LLM_RETRY_DELAY || "500"))),
  requestTimeout: Math.max(10000, parseInt(process.env.LLM_REQUEST_TIMEOUT || "45000")),
  rateLimitDelay: Math.max(50, parseInt(process.env.LLM_RATE_LIMIT_DELAY || "100")),
  headers: {
    "HTTP-Referer": process.env.LLM_HTTP_REFERER || "https://your-site.com",
    "X-Title": process.env.LLM_X_TITLE || "Prompt Engineering Competition"
  }
} as const;
