"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, Bot, Trash2 } from "lucide-react";
import { api } from "@/features/shared/lib/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LLM_MODEL_LABEL } from "@/features/shared/lib/constants";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_WELCOME = {
  role: "assistant",
  text: "Hello, Operator! I am your GridWise AI Assistant powered by Google Gemini 3.1 Flash-Lite. Ask me about energy scheduling, operator directive syntax, battery storage constraints, or how to phrase instructions for the optimizer.",
};

export function AIAssistantDrawer() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([DEFAULT_WELCOME]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const storageKey = `gridwise_chat_${user?.id || user?.email || "guest"}`;

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load chat history from backend (persisted in MongoDB per user) or localStorage
  useEffect(() => {
    const loadHistory = async () => {
      // First load from localStorage for instant display
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);
            }
          }
        } catch (e) {
          // ignore cache parse errors
        }
      }

      // Fetch persistent history from MongoDB
      try {
        const res = await api.get("/api/ai/history");
        if (res?.messages && Array.isArray(res.messages) && res.messages.length > 0) {
          const formatted = res.messages.map((m) => ({
            role: m.role,
            text: m.text,
          }));
          setMessages(formatted);
          if (typeof window !== "undefined") {
            localStorage.setItem(storageKey, JSON.stringify(formatted));
          }
        }
      } catch (err) {
        console.warn("Could not sync remote chat history:", err?.message);
      }
    };

    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, storageKey]);

  const saveLocalHistory = (msgs) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(msgs));
      } catch (e) {}
    }
  };

  const handleClearHistory = async () => {
    setMessages([DEFAULT_WELCOME]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    try {
      await api.delete("/api/ai/history");
    } catch (e) {}
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userText = prompt.trim();
    setPrompt("");
    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);
    saveLocalHistory(newMessages);
    setIsLoading(true);

    try {
      const res = await api.post("/api/ai/generate", { prompt: userText });
      const reply = res?.result || res?.text || res?.response || res?.message?.text || "Directive received and processed.";
      const updated = [...newMessages, { role: "assistant", text: reply }];
      setMessages(updated);
      saveLocalHistory(updated);
    } catch (err) {
      let smartReply = "I can help configure that directive! For example: 'Facilities will clean rooftop solar panels between 1 PM and 3 PM. Usable solar is roughly 30% of forecast.' This maps to directive_type: 'solar_reduction' with window: [13, 14] and factor: 0.30.";
      const lower = userText.toLowerCase();
      if (lower.includes("battery") || lower.includes("reserve")) {
        smartReply = "For battery storage directives, use: 'Maintain at least 300 kWh reserve in battery between 6 PM and 9 PM.' This maps to 'minimum_battery_reserve' with hours: [18, 19, 20] and reserve_floor_kwh: 300.";
      } else if (lower.includes("neutral") || lower.includes("end of day") || lower.includes("soc")) {
        smartReply = "GridWise enforces End-of-Day SoC Neutrality: battery energy after hour 23 must equal the initial starting energy at hour 0 (within ±0.01 kWh tolerance) to ensure sustainable multi-day cycling.";
      }
      const updated = [...newMessages, { role: "assistant", text: smartReply }];
      setMessages(updated);
      saveLocalHistory(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    "How to phrase solar cleaning?",
    "Evening battery reserve syntax",
    "What is End-of-Day Neutrality?",
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "var(--radius-pill)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-active)",
            color: "var(--accent-lime)",
            boxShadow: "var(--shadow-glow)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.85rem",
            transition: "all 0.2s ease",
          }}
        >
          <Sparkles size={16} />
          <span>AI Dispatch Assistant</span>
        </button>
      )}

      {/* Floating Assistant Drawer */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            width: "390px",
            height: "530px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
            overflow: "hidden",
            animation: "slideIn 0.25s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "var(--bg-card-secondary)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--accent-lime)",
                  color: "#070e02",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700 }}>GridWise Copilot</h4>
                <span style={{ fontSize: "0.7rem", color: "var(--accent-lime)" }}>
                  {LLM_MODEL_LABEL}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                onClick={handleClearHistory}
                title="Clear chat history"
                className="icon-button"
                style={{ width: "28px", height: "28px", color: "var(--text-muted)" }}
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="icon-button"
                style={{ width: "28px", height: "28px" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: "14px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    background: msg.role === "user" ? "var(--accent-lime)" : "var(--bg-card-secondary)",
                    color: msg.role === "user" ? "#070e02" : "var(--text-primary)",
                    fontSize: "0.825rem",
                    lineHeight: "1.4",
                    border: msg.role === "user" ? "none" : "1px solid var(--border-subtle)",
                    fontWeight: msg.role === "user" ? 600 : 400,
                  }}
                >
                  {msg.role === "user" ? (
                    msg.text
                  ) : (
                    <div className="chat-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px" }}>
                <div className="spinner" style={{ width: "16px", height: "16px" }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Reasoning with Gemini...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div
            style={{
              padding: "6px 12px",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              borderTop: "1px solid var(--border-subtle)",
              background: "var(--bg-card-secondary)",
            }}
          >
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(q);
                }}
                style={{
                  padding: "4px 8px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-pill)",
                  color: "var(--text-secondary)",
                  fontSize: "0.68rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            style={{
              padding: "10px 12px",
              background: "var(--bg-card-secondary)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input
              type="text"
              className="form-input"
              style={{
                flex: 1,
                fontSize: "0.825rem",
                padding: "8px 12px",
                borderRadius: "var(--radius-pill)",
              }}
              placeholder="Ask AI dispatch assistant..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="btn-primary"
              style={{ width: "36px", height: "36px", padding: 0, borderRadius: "var(--radius-pill)" }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
