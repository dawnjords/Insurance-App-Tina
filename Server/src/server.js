import "dotenv/config";
import express from "express";
import cors from "cors";

import { makeModel } from "./gemini/gemini.js";
import { buildSystemPrompt } from "./gemini/tinaPrompt.js";
import { safeParseJSON } from "./util/json.js";
import { violatesRules } from "./domain/rules.js";

const app = express();
app.use(cors());
app.use(express.json());

// Simple health
app.get("/health", (_req, res) =>
  res.json({ ok: true, model: "gemini-2.5-flash" })
);

// Main Tina endpoint
app.post("/api/tina/next", async (req, res) => {
  const { history = [], consent = "unknown" } = req.body || {};

  // 1) Opt-in intro: NOT model-driven
  if (history.length === 0) {
    return res.json({
      action: "ask",
      message:
        "I’m Tina. I help you choose the right insurance policy. May I ask a few personal questions to make sure I recommend the best fit?",
      followUpQuestion: "Is it okay if I ask a few quick questions first?",
    });
  }

  // 2) Respect decline
  if (consent === "declined") {
    return res.json({
      action: "recommend",
      message:
        "No worries. If you change your mind later, I can ask a few quick questions and recommend a policy.",
      recommendedProducts: [],
    });
  }

  // 3) Ask/recommend via model
  try {
    const model = makeModel();
    const system = buildSystemPrompt();

    const contents = [
      { role: "user", parts: [{ text: system }] }, // pseudo-system
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
    ];

    // Keep it simple and widely-compatible
    const result = await model.generateContent({ contents });
    const raw = result?.response?.text?.() ?? "";

    let data = safeParseJSON(raw);

    // Apply server-side rule guard on recommendations
    if (
      data.action === "recommend" &&
      Array.isArray(data.recommendedProducts)
    ) {
      const facts = data.inferredFacts || {};
      data.recommendedProducts = data.recommendedProducts.filter(
        (r) => !violatesRules(r, facts)
      );
      if (data.recommendedProducts.length === 0) {
        data = {
          action: "ask",
          message:
            "I want to double-check a couple details so I can follow the eligibility rules.",
          followUpQuestion:
            "What type of vehicle is it, and roughly how old is it (in years)?",
        };
      }
    }

    return res.json(data);
  } catch (err) {
    console.error("Gemini error:", err?.message || err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () =>
  console.log(`Tina API listening on http://localhost:${port}`)
);
