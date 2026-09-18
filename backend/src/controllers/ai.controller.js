import { generateContent } from "../services/gemini.service.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ValidationError } from "../utils/errors.js";

export const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id || "demo-operator";
  const messages = await ChatMessage.find({ userId })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();
  res.json({ messages });
});

export const clearHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id || "demo-operator";
  await ChatMessage.deleteMany({ userId });
  res.json({ message: "Chat history cleared" });
});

export const generate = asyncHandler(async (req, res) => {
  const prompt = req.body?.prompt;
  const userId = req.user?.id || "demo-operator";

  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 2000) {
    throw new ValidationError("prompt must be a non-empty string of at most 2000 characters");
  }

  // Save user prompt
  await ChatMessage.create({
    userId,
    role: "user",
    text: prompt.trim(),
  });

  let reply = "";
  try {
    const aiText = await generateContent(prompt);
    if (aiText && aiText.trim()) {
      reply = aiText.trim();
    }
  } catch (err) {
    console.warn("AI generation fallback:", err.message);
  }

  // Domain-aware fallback if LLM is offline or rate-limited
  if (!reply) {
    const p = prompt.toLowerCase();
    if (p.includes("solar") || p.includes("cleaning") || p.includes("cloud")) {
      reply = "For solar adjustments, use directive_type: 'solar_reduction'. Example: 'Facilities will clean rooftop solar panels between 1 PM and 3 PM. Usable solar is roughly 30% of forecast.' This sets window: [13, 14] and factor: 0.30.";
    } else if (p.includes("battery") || p.includes("reserve") || p.includes("charge")) {
      reply = "For battery reserves, use directive_type: 'minimum_battery_reserve' or 'no_charge_window'. Example: 'Maintain at least 300 kWh reserve between 6 PM and 9 PM.' maps to hours: [18, 19, 20] and reserve_floor_kwh: 300.";
    } else if (p.includes("neutral") || p.includes("end of day") || p.includes("soc")) {
      reply = "GridWise strictly audits End-of-Day Battery SoC Neutrality at hour 23. The final stored energy must equal the starting storage (within ±0.01 tolerance), preventing depletion loops across operational days.";
    } else {
      reply = `Received operator directive query. You can instruct GridWise with natural language constraints regarding solar curtailment, peak grid caps, maintenance windows, or battery minimum reserves.`;
    }
  }

  // Save assistant reply
  const savedReply = await ChatMessage.create({
    userId,
    role: "assistant",
    text: reply,
  });

  res.json({
    result: reply,
    message: savedReply,
  });
});
