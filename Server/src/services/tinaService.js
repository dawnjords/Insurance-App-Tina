import { makeModel } from "../gemini/gemini.js";
import { buildSystemPrompt } from "../gemini/tinaPrompt.js";

export class TinaService {
  static async getResponse(history, knownFacts) {
    const model = makeModel();
    const system = buildSystemPrompt();
    const cleanHistory = TinaService.cleanHistory(history);

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `${system}\n\nCURRENT KNOWN FACTS:\n${JSON.stringify(
              knownFacts,
              null,
              2
            )}`,
          },
        ],
      },
      ...cleanHistory,
    ];

    const result = await model.generateContent({
      contents,
      generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
    });

    return TinaService.processResponse(result.response, cleanHistory);
  }

  static cleanHistory(history) {
    return history.reduce((clean, msg) => {
      if (msg.role === "system") return clean;

      const last = clean[clean.length - 1];
      if (
        last?.text === msg.text ||
        (last?.role === "model" && msg.role === "assistant")
      ) {
        return clean;
      }

      clean.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      });
      return clean;
    }, []);
  }

  static processResponse(response, history) {
    let text = response
      .text()
      .replace(/```json\n?/, "")
      .replace(/```\n?$/, "")
      .trim();

    const parsed = JSON.parse(text);
    const lastMessage = history.filter((m) => m.role === "model").pop()
      ?.parts[0]?.text;

    if (lastMessage) {
      try {
        const lastParsed = JSON.parse(lastMessage);
        if (lastParsed.message === parsed.message) {
          parsed.message = "Could you please provide more details about that?";
        }
      } catch (e) {}
    }

    return parsed;
  }
}
