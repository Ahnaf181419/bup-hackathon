import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { optimizeEnergyPublic } from "./controllers/energy.controller.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to avoid CORS blocking
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// Public Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Official Public Hackathon Judge Endpoint (no auth, root level, snake_case)
app.post("/optimize-energy", optimizeEnergyPublic);

// Authenticated Application API
app.use("/api", apiRouter);

// Central Error Handler
app.use(errorHandler);

export default app;
