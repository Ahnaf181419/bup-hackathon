import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      dbName: "bup_hackathon",
      serverSelectionTimeoutMS: 3000,
    });
    console.log("[db] connected to MongoDB (database: bup_hackathon)");
  } catch (err) {
    console.warn("[db] MongoDB connection failed (" + err.message + "). In-memory/fallback mode active.");
  }
}
