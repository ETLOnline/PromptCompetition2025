// LLM Configuration

export const LLM_CONFIG = {
  models: [
    { model: process.env.MODEL_1 || "meta-llama/llama-3-8b-instruct" },
    { model: process.env.MODEL_2 || "openai/gpt-3.5-turbo" },
    { model: process.env.MODEL_3 || "anthropic/claude-3-haiku" }
  ],
  maxTokens: Math.max(100, parseInt(process.env.LLM_MAX_TOKENS || "300")),
  temperature: Math.max(0, Math.min(2, parseFloat(process.env.LLM_TEMPERATURE || "0.0"))),
  retryAttempts: Math.max(1, Math.min(5, parseInt(process.env.LLM_RETRY_ATTEMPTS || "2"))),
  retryDelay: Math.max(100, Math.min(5000, parseInt(process.env.LLM_RETRY_DELAY || "500"))),
  headers: {
    "HTTP-Referer": process.env.LLM_HTTP_REFERER || "https://your-site.com",
    "X-Title": process.env.LLM_X_TITLE || "Prompt Engineering Competition"
  }
} as const;
