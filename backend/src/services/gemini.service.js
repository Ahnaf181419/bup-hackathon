import { gemini } from "../config/gemini.js";
import { buildPrompt } from "./prompt.service.js";

export async function generateContent(prompt, options = {}) {
  const contents = buildPrompt(prompt, options);
  const response = await gemini.models.generateContent({
    model: options.model || "gemini-3.6-flash",
    contents,
  });
  return response.text;
}
