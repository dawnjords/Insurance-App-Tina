import "dotenv/config";
import express from "express";
import cors from "cors";
import { TinaService } from "./services/tinaService.js";

const app = express();
app.use(cors());
app.use(express.json());

// Constants
const INTRO_MESSAGE = {
  action: "ask",
  message:
    "I'm Tina. I help you choose the right vehicle insurance policy. May I ask a few questions to make sure I recommend the best policy for you?",
};

const DECLINE_MESSAGE = {
  action: "recommend",
  message:
    "No worries. If you change your mind later, I can ask a few quick questions and recommend a policy.",
  recommendedProducts: [],
};

// health chekc
app.get("/health", (_req, res) =>
  res.json({ ok: true, model: "gemini-2.5-flash" })
);

// Tina endpoint
app.post("/api/tina/next", async (req, res) => {
  const { history = [], consent = "unknown" } = req.body || {};

  // intro/opt in
  if (history.length === 0) {
    return res.json(INTRO_MESSAGE);
  }

  // opt in declined
  if (consent === "declined") {
    return res.json(DECLINE_MESSAGE);
  }

  // ask and recommend
  try {
    const knownFacts = extractKnownInfo(history);
    const response = await TinaService.getResponse(history, knownFacts);
    res.json(response);
  } catch (err) {
    console.error("Model error:", err);
    res.status(500).json({
      action: "ask",
      message: "Sorry, I'm having technical difficulties. Could you try again?",
    });
  }
});

function extractKnownInfo(history) {
  const facts = {
    vehicleType: null,
    vehicleAgeYears: null,
    coveragePreference: null,
    isRacingCar: null,
  };

  return history.reduce((known, msg) => {
    if (msg.role === "model") {
      try {
        const data = JSON.parse(msg.text);
        if (data.inferredFacts) {
          Object.entries(data.inferredFacts).forEach(([key, value]) => {
            if (value != null) known[key] = value;
          });
        }
      } catch (e) {}
    }
    return known;
  }, facts);
}

const port = Number(process.env.PORT || 4000);
app.listen(port, () =>
  console.log(`Tina API listening on http://localhost:${port}`)
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    action: "ask",
    message: "I'm having trouble processing that. Could you please try again?",
  });
});
