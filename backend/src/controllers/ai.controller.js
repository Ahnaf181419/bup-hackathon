import { generateContent } from "../services/gemini.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const generate = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  const result = await generateContent(prompt);
  res.json({ result });
});
