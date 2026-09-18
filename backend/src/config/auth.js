import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer } from "better-auth/plugins";
import { env } from "./env.js";

const client = new MongoClient(env.MONGO_URI);
const db = client.db("bup_hackathon");

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer()],
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
});

