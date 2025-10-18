import "dotenv/config";
import express from "express";
import cors from "cors";
import { makeModel } from "./gemini/gemini.js";
import { buildSystemPrompt } from "./gemini/tinaPrompt.js";
import { TinaTurnSchema } from "./util/jsonSchema.js";
import { violatesRules } from "./domain/rules.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/tina/next", async (req, res) => {
  const { history = [], consent = "unknown" } = req.body || {};

  //  opt-in
  if (history.length === 0) {
    return res.json({
      action: "ask",
      message:
        "I’m Tina. I help you choose the right insurance policy. May I ask a few personal questions to make sure I recommend the best policy for you?",
      followUpQuestion: "Is it okay if I ask you a few quick questions first?",
    });
  }

  // opt-in declined
  if (consent === "declined") {
    return res.json({
      action: "recommend",
      message:
        "No worries. If you change your mind later, I can ask a few quick questions and recommend a policy.",
      recommendedProducts: [],
    });
  }

  // asks questions and eventually recommends
  try {
    const model = makeModel();

    const system = buildSystemPrompt();
    const content = [
      { role: "user", parts: [{ text: system }] },
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
    ];

    const result = await model.generateContent({
      contents: content,
      responseMimeType: "application/json",
      responseSchema: TinaTurnSchema,
    });

    const raw = result.response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      // ask follow up question as a fallback to inconlusive responses
      data = {
        action: "ask",
        message: "Thanks! I have a quick question to get us started.",
        followUpQuestion: raw.trim() || "What kind of vehicle do you drive?",
      };
    }

    // recommend with rules enforxed
    if (
      data.action === "recommend" &&
      Array.isArray(data.recommendedProducts)
    ) {
      const facts = data.inferredFacts || {};
      data.recommendedProducts = data.recommendedProducts.filter(
        (r) => !violatesRules(r, facts)
      );

      // If everything got filtered out due to rules, pivot back to a clarifying ask
      if (data.recommendedProducts.length === 0) {
        data.action = "ask";
        data.message =
          "I want to make sure the recommendation fits the rules. A couple of quick checks:";
        data.followUpQuestion =
          data.missingInfo?.[0] ||
          "What type of vehicle is it, and how old is it (in years)?";
      }
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

const port = Number(process.env.PORT);
app.listen(port, () =>
  console.log(`Tina API listening on http://localhost:${port}`)
);
