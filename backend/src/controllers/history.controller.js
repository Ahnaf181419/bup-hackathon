import * as historyService from "../services/history.service.js";
import { OPERATOR_ID } from "../config/operator.js";

export async function listHistory(req, res, next) {
  try {
    const userId = OPERATOR_ID;
    const { limit = 20, skip = 0, status } = req.query;
    const { results, total } = await historyService.getHistoryByUser(userId, { limit, skip, status });
    return res.status(200).json({ history: results, total });
  } catch (err) {
    next(err);
  }
}

export async function getHistoryDetail(req, res, next) {
  try {
    const userId = OPERATOR_ID;
    const result = await historyService.getResultById(userId, req.params.id);
    return res.status(200).json({ result });
  } catch (err) {
    next(err);
  }
}
