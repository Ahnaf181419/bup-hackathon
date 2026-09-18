import "dotenv/config";
import crypto from "crypto";

const int = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Never ship a hard-coded auth secret. If none is configured, use a random
// per-process secret (sessions reset on restart, which is fine for a demo).
const authSecret = process.env.BETTER_AUTH_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.BETTER_AUTH_SECRET) {
  console.warn("[env] BETTER_AUTH_SECRET not set - using a random per-process secret.");
}

export const env = {
  HOST: process.env.HOST || "0.0.0.0",
  PORT: int(process.env.PORT, 3001),
  // MongoDB only backs the dashboard UI; the judged endpoints never touch it.
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bup_hackathon",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  // Used when the primary model is rate-limited / unavailable (free-tier quotas are per model).
  GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash",
  LLM_TIMEOUT_MS: int(process.env.LLM_TIMEOUT_MS, 9000),
  LLM_TOTAL_BUDGET_MS: int(process.env.LLM_TOTAL_BUDGET_MS, 15000),
  BETTER_AUTH_SECRET: authSecret,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173",
};
