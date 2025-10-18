export const TinaTurnSchema = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["ask", "recommend"] },
    message: { type: "string" }, // what Tina says to the user
    followUpQuestion: { type: "string" }, // present when action = "ask"
    missingInfo: { type: "array", items: { type: "string" } },
    recommendedProducts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          why: { type: "string" },
        },
        required: ["name", "why"],
      },
    },
    inferredFacts: {
      type: "object",
      additionalProperties: true,
    },
  },
  required: ["action", "message"],
};
