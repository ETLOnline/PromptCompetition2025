// LLM Configuration
export const LLM_CONFIG = {
  models: [
    { 
      model: process.env.MODEL_1 || "anthropic/claude-3.7-sonnet",
      maxTokens: 500,
      temperature: 0.1
    },
    { 
      model: process.env.MODEL_2 || "openai/gpt-4o",
      maxTokens: 300,
      temperature: 0.0
    },
    { 
      model: process.env.MODEL_3 || "meta-llama/llama-3.1-405b-instruct",
      maxTokens: 400,
      temperature: 0.2
    }
  ],
  retryAttempts: Math.max(1, Math.min(5, parseInt(process.env.LLM_RETRY_ATTEMPTS || "2"))),
  retryDelay: Math.max(100, Math.min(5000, parseInt(process.env.LLM_RETRY_DELAY || "500"))),
  requestTimeout: Math.max(10000, parseInt(process.env.LLM_REQUEST_TIMEOUT || "45000")),
  rateLimitDelay: Math.max(50, parseInt(process.env.LLM_RATE_LIMIT_DELAY || "100")),
  headers: {
    "HTTP-Referer": process.env.LLM_HTTP_REFERER || "https://your-site.com",
    "X-Title": process.env.LLM_X_TITLE || "Prompt Engineering Competition"
  }
} as const;
