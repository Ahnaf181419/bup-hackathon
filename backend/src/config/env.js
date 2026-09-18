import "dotenv/config";

export const env = {
  PORT: process.env.PORT || 3001,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bup_hackathon",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "gridwise-secret-key-bup-2026",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173",
};
