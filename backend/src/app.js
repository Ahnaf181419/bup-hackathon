import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { optimizeEnergyPublic } from "./controllers/energy.controller.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
app.disable("x-powered-by");

const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

// Judge-facing endpoints: open to any origin. There are no cookies or sessions anywhere.
const publicCors = cors();

// Dashboard API: only the configured dashboard origins.
const apiCors = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
});

app.use(express.json({ limit: "1mb" }));

app.options("/health", publicCors);
app.get("/health", publicCors, (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.options("/optimize-energy", publicCors);
app.post("/optimize-energy", publicCors, optimizeEnergyPublic);

app.use("/api", apiCors, apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

export default app;
