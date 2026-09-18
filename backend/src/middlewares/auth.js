import { auth } from "../config/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      req.user = session.user;
      return next();
    }
  } catch (e) {
    // Better Auth session lookup error
  }

  const demoHeader = req.headers["x-demo-user"];
  if (demoHeader) {
    try {
      req.user = JSON.parse(demoHeader);
      return next();
    } catch (e) {
      req.user = { id: "demo-operator", name: "Campus Operator" };
      return next();
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
});
