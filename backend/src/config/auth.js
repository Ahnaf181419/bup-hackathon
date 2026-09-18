import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { env } from "./env.js";

const client = new MongoClient(env.MONGO_URI);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
});
