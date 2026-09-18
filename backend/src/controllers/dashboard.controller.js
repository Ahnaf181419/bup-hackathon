import { getAggregatedStats } from "../services/dashboard.service.js";

export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user?.id || req.session?.userId || "operator";
    const stats = await getAggregatedStats(userId);
    return res.status(200).json({ stats });
  } catch (err) {
    next(err);
  }
}
