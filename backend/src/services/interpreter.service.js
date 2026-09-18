import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { keyManager } from "./keyManager.service.js";
import { DIRECTIVE_TYPES } from "./guardrail.service.js";

/*
 * The LLM returns an intermediate format that is easy for a model to get right
 * (start/end hours, percentages as stated). Code then expands windows and converts
 * units in guardrail.service.js, so arithmetic never depends on the model.
 */
const SYSTEM_INSTRUCTION = `You interpret campus microgrid operator notes into machine-checkable directives for a 24-hour battery/grid/solar dispatch optimizer (hours 0-23 of ONE operating day).

Return exactly one interpretation per note, with note_index equal to the note's position (0-based).

directive_type must be one of:
- "solar_reduction": usable solar is reduced during a window. Set usable_solar_fraction = the fraction of forecast solar that REMAINS usable (0..1). "80% reduction" -> 0.2; "only 25% of forecast usable" -> 0.25; "about half of forecast" -> 0.5; "cut by a third" -> 0.6667; "one-fifth usable" -> 0.2; "no solar" -> 0.
- "minimum_battery_reserve": the battery must hold at least some energy during a window. If the note gives kWh set reserve_kwh. If it gives a percentage/fraction of battery capacity set reserve_percent_of_capacity (e.g. "half of capacity" -> 50) and do NOT convert it yourself.
- "no_charge_window": the battery must not charge (charger isolated/unavailable/disabled, charging prohibited).
- "no_discharge_window": the battery must not discharge (inverter/relay/protection work blocking discharge, discharging prohibited).
- "max_grid_window": grid import must not exceed a limit in each hour of a window (feeder/transformer/substation/utility import limits). Set max_grid_kwh.
- "no_op": the note does not constrain energy dispatch for this operating day: administrative/social/facility news (library, cafeteria, clubs, bookings, deadlines), notes about another day (next week, next month, tomorrow), or purely informational remarks.

Time windows (windows is a list of {start_hour, end_hour}):
- 24-hour clock. start_hour is INCLUSIVE, end_hour is EXCLUSIVE. "from 1 PM until 3 PM" -> {13, 15} (hours 13 and 14). "6 PM to 9 PM" -> {18, 21}.
- noon = 12. midnight as an end = 24, as a start = 0. "13:00-15:00" -> {13, 15}. "for three hours starting 7 PM" -> {19, 22}.
- Windows crossing midnight keep their order: "10 PM to 2 AM" -> {22, 2}.
- Use multiple windows only if the note names several separate periods.

Rules:
- Use only numbers stated or directly implied by the note. Never invent a window or a value; if a dispatch note has no usable window or value, use "no_op".
- If one note mentions several things, choose the single constraint it primarily imposes.
- Leave fields that do not apply to the directive_type out.
- explanation: one short sentence explaining the interpretation.`;

const EXAMPLES = `Examples (illustrative wording, not from the evaluation set):
Notes: ["PV strings on the engineering block are being re-cabled 9 AM to 11 AM; expect roughly a 60% drop in output.", "Chess club meets Thursday."]
Output: {"interpretations":[{"note_index":0,"directive_type":"solar_reduction","windows":[{"start_hour":9,"end_hour":11}],"usable_solar_fraction":0.4,"explanation":"A 60% drop leaves 40% of forecast solar usable from 09:00 to 11:00."},{"note_index":1,"directive_type":"no_op","explanation":"Club meeting news does not affect dispatch."}]}
Notes: ["Hold a quarter of the battery's capacity in reserve between 7 and 10 in the evening.", "Utility asks us to draw no more than 120 kWh per hour from the grid 5 PM-7 PM."]
Output: {"interpretations":[{"note_index":0,"directive_type":"minimum_battery_reserve","windows":[{"start_hour":19,"end_hour":22}],"reserve_percent_of_capacity":25,"explanation":"A quarter of capacity must stay stored from 19:00 to 22:00."},{"note_index":1,"directive_type":"max_grid_window","windows":[{"start_hour":17,"end_hour":19}],"max_grid_kwh":120,"explanation":"Grid import is limited to 120 kWh in each hour from 17:00 to 19:00."}]}`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    interpretations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          note_index: { type: "integer" },
          directive_type: { type: "string", enum: DIRECTIVE_TYPES },
          windows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                start_hour: { type: "integer" },
                end_hour: { type: "integer" },
              },
              required: ["start_hour", "end_hour"],
            },
          },
          usable_solar_fraction: { type: "number" },
          reserve_kwh: { type: "number" },
          reserve_percent_of_capacity: { type: "number" },
          max_grid_kwh: { type: "number" },
          explanation: { type: "string" },
        },
        required: ["note_index", "directive_type", "explanation"],
      },
    },
  },
  required: ["interpretations"],
};

/*
 * Config ladder. Not every model accepts every option (e.g. thinkingLevel vs thinkingBudget).
 * On HTTP 400 we step down one level for that model and remember it for later requests.
 */
const CONFIG_LEVELS = [
  { schema: true, thinking: { thinkingLevel: "MINIMAL" } },
  { schema: true, thinking: { thinkingBudget: 0 } },
  { schema: true, thinking: null },
  { schema: false, thinking: null },
];
const modelLevel = new Map();

const CACHE_MAX = 500;
const cache = new Map(); // key -> raw interpretations (LRU by insertion order)
const inFlight = new Map(); // key -> Promise, dedupes concurrent identical requests

function buildPrompt(notes, battery) {
  const noteLines = notes.map((n, i) => `${i}: ${JSON.stringify(n)}`).join("\n");
  return `${EXAMPLES}

Battery for this scenario: capacity ${battery.capacity_kwh} kWh, base minimum ${battery.minimum_energy_kwh} kWh, max charge ${battery.max_charge_kwh_per_hour} kWh/h, max discharge ${battery.max_discharge_kwh_per_hour} kWh/h.

Interpret these ${notes.length} operator note(s):
${noteLines}`;
}

function parseModelJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const list = Array.isArray(parsed) ? parsed : parsed?.interpretations;
  if (!Array.isArray(list)) throw new Error("LLM JSON has no interpretations array");
  return list;
}

function errorStatus(err) {
  if (err?.timeout) return null;
  if (Number.isInteger(err?.status)) return err.status;
  const m = String(err?.message || "").match(/"code"\s*:\s*(\d{3})|got status:\s*(\d{3})/i);
  return m ? Number(m[1] || m[2]) : null;
}

async function callModel(model, prompt, timeoutMs) {
  const level = CONFIG_LEVELS[modelLevel.get(model) ?? 0];
  const controller = new AbortController();
  let timer;
  const config = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0,
    responseMimeType: "application/json",
    // Timeout is enforced locally (abort + race). Don't pass httpOptions.timeout: the SDK forwards it
    // as a server deadline and the API rejects deadlines under 10 s with HTTP 400.
    abortSignal: controller.signal,
  };
  if (level.schema) config.responseJsonSchema = RESPONSE_SCHEMA;
  if (level.thinking) config.thinkingConfig = level.thinking;

  try {
    const ai = keyManager.getClient();
    if (!ai) throw new Error("No Gemini client available");
    const response = await Promise.race([
      ai.models.generateContent({ model, contents: prompt, config }),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          const e = new Error(`LLM timed out after ${timeoutMs} ms`);
          e.timeout = true;
          reject(e);
        }, timeoutMs);
      }),
    ]);
    return parseModelJson(response.text);
  } finally {
    clearTimeout(timer);
  }
}

async function interpretWithLLM(notes, battery) {
  const prompt = buildPrompt(notes, battery);
  const deadline = Date.now() + env.LLM_TOTAL_BUDGET_MS;
  const models = [env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL].filter((m, i, a) => m && a.indexOf(m) === i);

  let modelIdx = 0;
  let retries = 0;
  let lastError = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 1000 || modelIdx >= models.length) break;
    const model = models[modelIdx];
    const started = Date.now();
    try {
      const list = await callModel(model, prompt, Math.min(env.LLM_TIMEOUT_MS, remaining));
      logger.info(`[interpreter] ${model} answered in ${Date.now() - started} ms using key [${keyManager.getCurrentKeyPreview()}]`);
      return { entries: list, model };
    } catch (err) {
      lastError = err;
      const status = errorStatus(err);
      logger.warn(`[interpreter] ${model} failed (${status ?? (err.timeout ? "timeout" : "parse/network")}): ${String(err.message).slice(0, 160)}`);

      if (status === 400) {
        const next = (modelLevel.get(model) ?? 0) + 1;
        if (next < CONFIG_LEVELS.length) {
          modelLevel.set(model, next); // retry same model with a simpler config
          continue;
        }
        modelIdx++;
      } else if (status === 429 || status === 403) {
        // Rate limit / Quota: rotate to next available API key in pool and retry same model!
        if (keyManager.rotate("429_rate_limit")) {
          logger.warn(`[interpreter] Switched to next API key in pool; retrying ${model}...`);
          continue;
        }
        modelIdx++; // all keys in pool hit quota; step down to fallback model
      } else if (status === 404 || err.timeout) {
        modelIdx++; // quota / unknown model / slow: move to the next model
      } else if (retries < 1) {
        retries++; // transient 5xx, network, or malformed JSON: one retry
        await new Promise((r) => setTimeout(r, 250));
      } else {
        modelIdx++;
      }
    }
  }
  return { entries: null, error: lastError ? String(lastError.message).slice(0, 200) : "LLM unavailable" };
}

/**
 * Interpret operator notes with the LLM. Returns { entries, source, model } where entries is the
 * raw LLM list (not yet guardrailed) or null when the LLM could not be used.
 */
export async function interpretOperatorNotes(notes, battery) {
  if (!keyManager.hasKeys()) return { entries: null, source: "none", error: "GEMINI_API_KEY not configured" };

  const key = JSON.stringify([notes, battery.capacity_kwh, battery.minimum_energy_kwh]);
  if (cache.has(key)) {
    const hit = cache.get(key);
    cache.delete(key);
    cache.set(key, hit);
    return { entries: hit.entries, source: "llm-cache", model: hit.model };
  }
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = interpretWithLLM(notes, battery)
    .then((res) => {
      if (res.entries) {
        cache.set(key, res);
        if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
        return { entries: res.entries, source: "llm", model: res.model };
      }
      return { entries: null, source: "none", error: res.error };
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}
