import { auth } from "../config/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DEMO_USER = { id: "demo-operator", name: "Campus Operator" };

async function sessionUser(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    return session?.user || null;
  } catch {
    return null; // auth DB unreachable -> treat as anonymous
  }
}

/**
 * Real session required for anything that changes data or spends LLM quota.
 * Read-only requests (GET/HEAD) fall back to a shared demo operator so the
 * dashboard's seeded public data stays viewable without logging in.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const user = await sessionUser(req);
  if (user) {
    req.user = user;
    return next();
  }
  if (req.method === "GET" || req.method === "HEAD") {
    req.user = DEMO_USER;
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
});

/**
 * Session optional: anonymous callers act as the demo operator. Only for routes that are
 * safe for the public (e.g. running the same optimizer the public judge endpoint exposes).
 */
export const allowDemoUser = asyncHandler(async (req, res, next) => {
  req.user = (await sessionUser(req)) || DEMO_USER;
  return next();
});
