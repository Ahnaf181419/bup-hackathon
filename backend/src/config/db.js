import mongoose from "mongoose";
import { env } from "./env.js";

// Fail fast instead of queueing queries for 10 s when the database is unreachable.
mongoose.set("bufferCommands", false);

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      dbName: "bup_hackathon",
      serverSelectionTimeoutMS: 3000,
    });
    console.log("[db] connected to MongoDB (database: bup_hackathon)");
  } catch (err) {
    console.warn("[db] MongoDB unavailable - dashboard history/scenarios disabled. Judge endpoints are unaffected.");
  }
}
