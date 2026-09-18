import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

class KeyManager {
  constructor() {
    this.keys = this.loadKeys();
    this.currentIndex = 0;
    this.clients = new Map(); // key -> GoogleGenAI instance
    this.cooldowns = new Map(); // key -> cooldown until timestamp
  }

  loadKeys() {
    const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || "";
    const parsed = raw
      .split(/[\s,;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 10);
    return parsed.length > 0 ? parsed : [];
  }

  hasKeys() {
    return this.keys.length > 0;
  }

  getKeyCount() {
    return this.keys.length;
  }

  /**
   * Get the current active GoogleGenAI client
   */
  getClient() {
    if (this.keys.length === 0) return null;
    const key = this.keys[this.currentIndex];
    if (!this.clients.has(key)) {
      this.clients.set(key, new GoogleGenAI({ apiKey: key }));
    }
    return this.clients.get(key);
  }

  getCurrentKeyPreview() {
    if (this.keys.length === 0) return "none";
    const k = this.keys[this.currentIndex];
    return `${k.slice(0, 8)}...${k.slice(-4)}`;
  }

  /**
   * Rotate to the next available API key in the pool
   */
  rotate(reason = "rate_limit") {
    if (this.keys.length <= 1) return false;

    const oldIndex = this.currentIndex;
    const oldKey = this.keys[oldIndex];
    // Put old key on 60s cooldown
    this.cooldowns.set(oldKey, Date.now() + 60000);

    // Pick next available key
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    const newKey = this.keys[this.currentIndex];
    const preview = `${newKey.slice(0, 8)}...${newKey.slice(-4)}`;

    logger.warn(
      `[key-manager] Key #${oldIndex} (${reason}). Auto-switched to Key #${this.currentIndex} [${preview}] (pool size: ${this.keys.length})`
    );
    return true;
  }

  /**
   * Execute an operation with automatic key failover on 429 / 403 quota errors
   */
  async execute(operation) {
    if (this.keys.length === 0) {
      throw new Error("No GEMINI_API_KEY configured");
    }

    let lastError = null;
    const attempts = Math.min(this.keys.length, 5);

    for (let i = 0; i < attempts; i++) {
      const client = this.getClient();
      try {
        return await operation(client);
      } catch (err) {
        lastError = err;
        const msg = String(err?.message || "");
        const status = err?.status || (err?.error && err.error.code) || 0;
        const isRateLimit =
          status === 429 ||
          status === 403 ||
          msg.includes("429") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("quota") ||
          msg.includes("rate limit") ||
          msg.includes("High demand");

        if (isRateLimit && this.keys.length > 1) {
          const rotated = this.rotate("429/quota");
          if (rotated) continue;
        }
        throw err;
      }
    }
    throw lastError;
  }
}

export const keyManager = new KeyManager();
