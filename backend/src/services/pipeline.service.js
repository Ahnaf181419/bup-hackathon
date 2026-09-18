import { interpretOperatorNotes } from "./interpreter.service.js";
import { parseNotesDeterministically } from "./fallbackParser.service.js";
import { validateAndSanitizeDirectives, normalizeDirective, noOp } from "./guardrail.service.js";
import { solveEnergyDispatch } from "./optimizer.service.js";
import { validateSolvedSchedule } from "./validator.service.js";
import { logger } from "../utils/logger.js";

/**
 * LLM interpretation -> deterministic guardrails -> LP optimizer -> final replay validator.
 * `input` must already be validated (see validators/energy.validator.js).
 */
export async function runOptimizationPipeline(input) {
  const startTime = Date.now();
  const { scenario_id, operator_notes, hours, battery } = input;

  // 1. LLM interpretation (primary path)
  const llm = await interpretOperatorNotes(operator_notes, battery);

  // 2. Guardrails. Any note the LLM got wrong (or everything, if the LLM was unavailable)
  //    is re-read by the deterministic backup parser, which is guardrailed the same way.
  const checked = validateAndSanitizeDirectives(llm.entries, operator_notes.length, battery);
  let backup = null;
  const sources = [];
  const directives = checked.map((r, i) => {
    if (r.ok && llm.entries) {
      sources.push("llm");
      return r.entry;
    }
    if (llm.entries) logger.warn(`[guardrail] note ${i} rejected: ${r.reason}`);
    backup ??= parseNotesDeterministically(operator_notes);
    const fb = normalizeDirective(backup[i], i, battery);
    if (fb.ok) {
      sources.push("fallback");
      return fb.entry;
    }
    sources.push("guardrail-no-op");
    return noOp(i, "The note could not be interpreted safely, so no constraint was applied.");
  });

  // 3. Optimizer
  const solved = solveEnergyDispatch({ scenario_id, hours, battery, directive_interpretation: directives });

  // 4. Final replay validation of our own plan
  validateSolvedSchedule(solved, { hours, battery });

  const processingTimeMs = Date.now() - startTime;
  logger.info(
    `[pipeline] ${JSON.stringify(scenario_id)} solved in ${processingTimeMs} ms (interpretation: ${sources.join(",")}${llm.model ? `, model ${llm.model}` : ""})`
  );

  return {
    ...solved,
    processingTimeMs,
    meta: { interpretation_sources: sources, llm_source: llm.source, llm_model: llm.model || null, llm_error: llm.error || null },
  };
}
