export function safeParseJSON(text) {
  if (!text) return fallbackAsk();
  try {
    return JSON.parse(text);
  } catch {}
  const fence = text.match(/```(?:json)?\\n([\\s\\S]*?)\\n```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1]);
    } catch {}
  }
  const tailObj = text.match(/\{[\s\S]*\}$/);
  if (tailObj) {
    try {
      return JSON.parse(tailObj[0]);
    } catch {}
  }
  return fallbackAsk();
}

function fallbackAsk() {
  return {
    action: "ask",
    message: "Thanks! I have a quick question to get us started.",
    followUpQuestion: "What type of vehicle do you drive?",
  };
}
