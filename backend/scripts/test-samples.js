/**
 * Runs every public sample case through the full pipeline and checks:
 *   - directive interpretation vs the reference (type, hours, numbers)
 *   - plan replay against all rules (with our directives AND the reference directives)
 *   - cost vs the reference optimum
 *
 * Usage:
 *   npm run test:samples             # uses Gemini if GEMINI_API_KEY is set
 *   npm run test:samples -- --offline  # forces the deterministic backup parser (no network)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const offline = process.argv.includes("--offline");
if (offline) process.env.GEMINI_API_KEY = ""; // dotenv never overrides an existing variable

const { runOptimizationPipeline } = await import("../src/services/pipeline.service.js");
const { findPlanViolations } = await import("../src/services/validator.service.js");
const { validateOptimizeRequest } = await import("../src/validators/energy.validator.js");

const here = path.dirname(fileURLToPath(import.meta.url));
const casesPath = path.resolve(here, "../../docs/problem/BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json");
const { cases } = JSON.parse(fs.readFileSync(casesPath, "utf8"));

const close = (a, b) => Math.abs(a - b) <= 0.01;

function sameAdjustment(a, b) {
  if (a === null || b === null) return a === b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (k === "hours") {
      if (JSON.stringify(a.hours) !== JSON.stringify(b.hours)) return false;
    } else if (typeof a[k] !== "number" || typeof b[k] !== "number" || !close(a[k], b[k])) {
      return false;
    }
  }
  return true;
}

function interpretationDiffs(got, want) {
  const diffs = [];
  if (got.length !== want.length) diffs.push(`expected ${want.length} entries, got ${got.length}`);
  want.forEach((w, i) => {
    const g = got[i];
    if (!g) return;
    if (g.note_index !== w.note_index || g.applies !== w.applies || g.directive_type !== w.directive_type || !sameAdjustment(g.structured_adjustment, w.structured_adjustment)) {
      diffs.push(`note ${i}: got ${g.directive_type} ${JSON.stringify(g.structured_adjustment)}, want ${w.directive_type} ${JSON.stringify(w.structured_adjustment)}`);
    }
  });
  return diffs;
}

let failures = 0;
const latencies = [];
console.log(`Running ${cases.length} public cases (${offline ? "offline: backup parser only" : "LLM mode"})\n`);

for (const c of cases) {
  const expected = c.expected_output;
  const input = validateOptimizeRequest(c.input);
  const t0 = Date.now();
  let result;
  try {
    result = await runOptimizationPipeline(input);
  } catch (err) {
    failures++;
    console.log(`FAIL ${c.id}: pipeline threw ${err.statusCode || ""} ${err.message}`);
    continue;
  }
  const ms = Date.now() - t0;
  latencies.push(ms);

  const problems = [];
  problems.push(...interpretationDiffs(result.directive_interpretation, expected.directive_interpretation));
  problems.push(...findPlanViolations(result, input).map((x) => `replay: ${x}`));
  const vsReference = findPlanViolations({ ...result, directive_interpretation: expected.directive_interpretation }, input);
  problems.push(...vsReference.map((x) => `replay vs reference directives: ${x}`));
  if (result.total_cost_bdt > expected.total_cost_bdt + 0.01) {
    problems.push(`cost ${result.total_cost_bdt} above reference ${expected.total_cost_bdt}`);
  }
  if (result.scenario_id !== c.input.scenario_id) problems.push("scenario_id not echoed");

  const tag = problems.length ? "FAIL" : "PASS";
  if (problems.length) failures++;
  console.log(
    `${tag} ${c.id}  cost ${result.total_cost_bdt} (ref ${expected.total_cost_bdt})  ${ms} ms  [${result.meta.interpretation_sources.join(",")}]`
  );
  for (const p of problems.slice(0, 6)) console.log(`     - ${p}`);
}

latencies.sort((a, b) => a - b);
const p95 = latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1)];
console.log(`\n${cases.length - failures}/${cases.length} passed. p95 latency ${p95} ms.`);
process.exit(failures ? 1 : 0);
