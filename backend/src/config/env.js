import "dotenv/config";

export const env = {
  PORT: process.env.PORT || 3001,
  MONGO_URI: process.env.MONGO_URI,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
};
