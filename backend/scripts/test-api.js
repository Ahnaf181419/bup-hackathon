/**
 * HTTP contract + robustness checks against a running server.
 *   BASE_URL=http://localhost:3001 npm run test:api
 *   BASE_URL=https://your-deployment.example npm run test:api
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE = (process.env.BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const here = path.dirname(fileURLToPath(import.meta.url));
const { cases } = JSON.parse(
  fs.readFileSync(path.resolve(here, "../../docs/problem/BUP_CSE_FEST_2026_Preli_Public_Sample_Cases.json"), "utf8")
);
const sample = () => structuredClone(cases[0].input);

async function post(body, raw = false) {
  const res = await fetch(`${BASE}/optimize-energy`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ? body : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const checks = [
  ["GET /health returns {status:ok}", async () => {
    const res = await fetch(`${BASE}/health`);
    const json = await res.json();
    return res.status === 200 && JSON.stringify(json) === '{"status":"ok"}';
  }],
  ["valid sample -> 200 with exact top-level fields", async () => {
    const { status, json } = await post(sample());
    const keys = ["scenario_id", "directive_interpretation", "hourly_plan", "total_grid_kwh", "total_cost_bdt", "peak_grid_kwh", "plan_summary"];
    return status === 200 && JSON.stringify(Object.keys(json)) === JSON.stringify(keys) && json.hourly_plan.length === 24;
  }],
  ["malformed JSON -> 400", async () => (await post("{bad", true)).status === 400],
  ["23 hours -> 400", async () => { const b = sample(); b.hours.pop(); return (await post(b)).status === 400; }],
  ["duplicate hour -> 400", async () => { const b = sample(); b.hours[5].hour = 4; return (await post(b)).status === 400; }],
  ["string demand -> 400", async () => { const b = sample(); b.hours[3].demand_kwh = "abc"; return (await post(b)).status === 400; }],
  ["null hour entry -> 400", async () => { const b = sample(); b.hours[0] = null; return (await post(b)).status === 400; }],
  ["0 notes -> 400", async () => { const b = sample(); b.operator_notes = []; return (await post(b)).status === 400; }],
  ["4 notes -> 400", async () => { const b = sample(); b.operator_notes = ["a", "b", "c", "d"]; return (await post(b)).status === 400; }],
  ["empty note -> 400", async () => { const b = sample(); b.operator_notes = ["  "]; return (await post(b)).status === 400; }],
  ["missing battery field -> 400", async () => { const b = sample(); delete b.battery.capacity_kwh; return (await post(b)).status === 400; }],
  ["initial energy above capacity -> 422", async () => { const b = sample(); b.battery.initial_energy_kwh = 9999; return (await post(b)).status === 422; }],
  ["shuffled hours accepted and plan ordered 0..23", async () => {
    const b = sample(); b.hours.reverse();
    const { status, json } = await post(b);
    return status === 200 && json.hourly_plan.every((p, i) => p.hour === i);
  }],
  ["error bodies never leak internals", async () => {
    const b = sample(); b.hours[0] = null;
    const { json } = await post(b);
    return !/Cannot read|TypeError|at \w+ \(/.test(JSON.stringify(json));
  }],
];

let failed = 0;
for (const [name, fn] of checks) {
  let ok = false;
  try { ok = await fn(); } catch (e) { ok = false; }
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
}
console.log(`\n${checks.length - failed}/${checks.length} passed against ${BASE}`);
process.exit(failed ? 1 : 0);
