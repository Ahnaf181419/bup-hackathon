import { generateContent } from "../services/gemini.service.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ValidationError } from "../utils/errors.js";
import { OPERATOR_ID } from "../config/operator.js";

// Chat history is a convenience: if MongoDB is unavailable the assistant still answers.
async function saveMessage(userId, role, text) {
  try {
    return await ChatMessage.create({ userId, role, text });
  } catch (err) {
    console.warn("[ai] chat history not saved:", err.message);
    return { role, text };
  }
}

export const getHistory = asyncHandler(async (req, res) => {
  const userId = OPERATOR_ID;
  const messages = await ChatMessage.find({ userId })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();
  res.json({ messages });
});

export const clearHistory = asyncHandler(async (req, res) => {
  const userId = OPERATOR_ID;
  await ChatMessage.deleteMany({ userId });
  res.json({ message: "Chat history cleared" });
});

export const generate = asyncHandler(async (req, res) => {
  const prompt = req.body?.prompt;
  const userId = OPERATOR_ID;

  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 2000) {
    throw new ValidationError("prompt must be a non-empty string of at most 2000 characters");
  }

  await saveMessage(userId, "user", prompt.trim());

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
      reply = "For solar adjustments, use directive_type: 'solar_reduction'. Example: 'Facilities will clean rooftop solar panels between 1 PM and 3 PM. Usable solar is roughly 30% of forecast.' This maps to hours: [13, 14] and factor: 0.3.";
    } else if (p.includes("battery") || p.includes("reserve") || p.includes("charge")) {
      reply = "For battery reserves, use directive_type: 'minimum_battery_reserve' or 'no_charge_window'. Example: 'Maintain at least 300 kWh reserve between 6 PM and 9 PM.' maps to hours: [18, 19, 20] and minimum_energy_kwh: 300.";
    } else if (p.includes("neutral") || p.includes("end of day") || p.includes("soc")) {
      reply = "GridWise strictly audits End-of-Day Battery SoC Neutrality at hour 23. The final stored energy must equal the starting storage (within ±0.01 tolerance), preventing depletion loops across operational days.";
    } else {
      reply = `Received operator directive query. You can instruct GridWise with natural language constraints regarding solar curtailment, peak grid caps, maintenance windows, or battery minimum reserves.`;
    }
  }

  const savedReply = await saveMessage(userId, "assistant", reply);

  res.json({
    result: reply,
    message: savedReply,
  });
});
