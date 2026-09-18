import { env } from "../config/env.js";
import { buildPrompt } from "./prompt.service.js";
import { keyManager } from "./keyManager.service.js";

// Dashboard "AI Dispatch Assistant" only; the judged interpreter lives in interpreter.service.js.
const ASSISTANT_INSTRUCTION = `You are the GridWise Dispatch Assistant for a campus microgrid dashboard (BUP CSE Fest 2026).
GridWise plans 24 hourly steps: grid import, solar use, and battery charge/discharge at minimum grid cost (grid kWh x tariff),
with end-of-day battery energy equal to the starting energy. Operator notes become one of these directives:
solar_reduction {hours, factor = usable fraction}, minimum_battery_reserve {hours, minimum_energy_kwh},
no_charge_window {hours}, no_discharge_window {hours}, max_grid_window {hours, max_grid_kwh}, or no_op.
Hours are 0-23, start inclusive, end exclusive ("1 PM to 3 PM" -> [13, 14]).

Answer in concise GitHub-flavored Markdown: a one-line answer first, then short bullet points or a small table if useful,
and a JSON code block when showing a directive. Keep answers under 180 words. If a question is unrelated to campus energy
or GridWise, say so briefly.`;

export async function generateContent(prompt, options = {}) {
  const contents = buildPrompt(prompt, options);
  const model = options.model || env.GEMINI_MODEL;
  return await keyManager.execute(async (client) => {
    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: ASSISTANT_INSTRUCTION,
        temperature: 0.3,
        maxOutputTokens: 600,
        thinkingConfig: { thinkingLevel: "MINIMAL" },
      },
    });
    return response.text;
  });
}
