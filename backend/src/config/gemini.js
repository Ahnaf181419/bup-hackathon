import { GoogleGenAI } from "@google/genai";
import { keyManager } from "../services/keyManager.service.js";
import { env } from "./env.js";

// Export a proxy so any call to gemini.models... automatically uses the active key
export const gemini = new Proxy(
  {},
  {
    get(target, prop) {
      const client = keyManager.getClient() || new GoogleGenAI({ apiKey: env.GEMINI_API_KEY || "dummy" });
      return client[prop];
    },
  }
);
