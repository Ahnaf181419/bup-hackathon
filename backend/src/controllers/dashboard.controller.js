import { getAggregatedStats } from "../services/dashboard.service.js";
import { OPERATOR_ID } from "../config/operator.js";

export async function getDashboardStats(req, res, next) {
  try {
    const userId = OPERATOR_ID;
    const stats = await getAggregatedStats(userId);
    return res.status(200).json({ stats });
  } catch (err) {
    next(err);
  }
}
