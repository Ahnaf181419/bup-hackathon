import { gemini } from "../config/gemini.js";
import { env } from "../config/env.js";
import { buildPrompt } from "./prompt.service.js";

export async function generateContent(prompt, options = {}) {
  const contents = buildPrompt(prompt, options);
  const response = await gemini.models.generateContent({
    model: options.model || env.GEMINI_MODEL,
    contents,
  });
  return response.text;
}
