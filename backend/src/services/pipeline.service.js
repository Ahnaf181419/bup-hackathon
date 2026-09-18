import { interpretOperatorNotes } from "./interpreter.service.js";
import { validateAndSanitizeDirectives } from "./guardrail.service.js";
import { solveEnergyDispatch } from "./optimizer.service.js";
import { validateSolvedSchedule } from "./validator.service.js";
import { logger } from "../utils/logger.js";

export async function runOptimizationPipeline(input) {
  const startTime = Date.now();
  const { scenario_id, operator_notes = [], hours = [], battery = {} } = input;

  logger.info(`[pipeline] Starting 24h energy optimization for scenario '${scenario_id}' with ${operator_notes.length} notes.`);

  // Step 1: LLM Directive Interpretation
  const rawInterpretations = await interpretOperatorNotes(operator_notes, hours, battery);

  // Step 2: Deterministic Guardrail Validation & Sanitization
  const sanitizedDirectives = validateAndSanitizeDirectives(rawInterpretations, operator_notes.length, battery);

  // Step 3: Linear Programming Simplex Dispatch Solver
  const solvedSchedule = solveEnergyDispatch({
    scenario_id,
    hours,
    battery,
    directive_interpretation: sanitizedDirectives,
  });

  // Step 4: Neutrality and Energy Balance Verification
  validateSolvedSchedule(solvedSchedule, { hours, battery });

  const processingTimeMs = Date.now() - startTime;
  logger.info(`[pipeline] Successfully solved scenario '${scenario_id}' in ${processingTimeMs}ms.`);

  return {
    ...solvedSchedule,
    processingTimeMs,
  };
}
