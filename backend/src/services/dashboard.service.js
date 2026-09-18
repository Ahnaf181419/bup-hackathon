import { OptimizationResult } from "../models/OptimizationResult.js";
import { Scenario } from "../models/Scenario.js";

export async function getAggregatedStats(userId) {
  try {
    const matchFilter = { $or: [{ userId }, { userId: "public-benchmark" }] };

    const [aggResults, scenarioCount] = await Promise.all([
      OptimizationResult.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalRuns: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ["$status", "optimal"] }, 1, 0] },
            },
            avgCost: { $avg: "$total_cost_bdt" },
            bestCost: { $min: "$total_cost_bdt" },
            // Only real runs count toward timing: seeded reference answers were never timed.
            avgProcessingTime: { $avg: { $cond: [{ $and: [{ $ne: ["$userId", "public-benchmark"] }, { $gt: ["$processingTimeMs", 0] }] }, "$processingTimeMs", null] } },
            timedRuns: { $sum: { $cond: [{ $and: [{ $ne: ["$userId", "public-benchmark"] }, { $gt: ["$processingTimeMs", 0] }] }, 1, 0] } },
          },
        },
      ]),
      Scenario.countDocuments(matchFilter),
    ]);

    const stats = aggResults[0] || {
      totalRuns: 0,
      successCount: 0,
      avgCost: 0,
      bestCost: 0,
      avgProcessingTime: 0,
    };

    const successRate = stats.totalRuns > 0 ? Math.round((stats.successCount / stats.totalRuns) * 100) : 100;

    return {
      totalRuns: stats.totalRuns,
      successRate,
      avgCost: Math.round((stats.avgCost || 0) * 100) / 100,
      bestCost: Math.round((stats.bestCost || 0) * 100) / 100,
      avgProcessingTime: Math.round(stats.avgProcessingTime || 0),
      timedRuns: stats.timedRuns || 0,
      scenarioCount,
    };
  } catch (err) {
    // Database unavailable: report no stats rather than invented numbers.
    return null;
  }
}
