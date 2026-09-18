import { generateContent } from "../services/gemini.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ValidationError } from "../utils/errors.js";

export const generate = asyncHandler(async (req, res) => {
  const prompt = req.body?.prompt;
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 2000) {
    throw new ValidationError("prompt must be a non-empty string of at most 2000 characters");
  }
  const result = await generateContent(prompt);
  res.json({ result });
});
