import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Malformed JSON / oversized body from express.json()
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON request body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : Number.isInteger(err.status) ? err.status : 500;

  if (statusCode >= 500) {
    // Log internally, never expose internals (messages, stack traces, secrets) to the client.
    logger.error(`[${req.method} ${req.path}] ${err.name || "Error"}: ${err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }

  logger.warn(`[${req.method} ${req.path}] ${statusCode}: ${err.message}`);
  const body = { error: err.message || "Request failed" };
  if (err.details) body.details = err.details;
  return res.status(statusCode).json(body);
}
