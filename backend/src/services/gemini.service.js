import { gemini } from "../config/gemini.js";
import { buildPrompt } from "./prompt.service.js";

export async function generateContent(prompt, options = {}) {
  const contents = buildPrompt(prompt, options);
  const model = options.model || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const response = await gemini.models.generateContent({
    model,
    contents,
  });
  return response.text;
}
