import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function App() {
  const [history, setHistory] = useState([]);
  const [consent, setConsent] = useState("unknown");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastTurn, setLastTurn] = useState(null);
  const endRef = useRef(null);

  // auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, lastTurn]);

  // opt in message
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tina/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ history: [] }),
        });
        const data = await res.json();

        if (data?.message) {
          setHistory([{ role: "assistant", text: data.message }]);
          setLastTurn(data);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to reach Tina API");
      }
    })();
  }, []);

  async function callTina(nextHistory, nextConsent = consent) {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/tina/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: nextHistory,
          consent: nextConsent,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLastTurn(data);
      setHistory([...nextHistory, { role: "assistant", text: data.message }]);
    } catch (err) {
      console.error("API error:", err);
      setLastTurn({
        action: "ask",
        message: "Sorry, there was an error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Yes/No buttons
  async function answerConsent(answer) {
    const userText = answer === "yes" ? "Yes" : "No thanks.";
    const newHistory = [...history, { role: "user", text: userText }];
    const nextConsent = answer === "yes" ? "granted" : "declined";
    setHistory(newHistory);
    setConsent(nextConsent);
    await callTina(newHistory, nextConsent);
  }

  async function submitAnswer(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const newHistory = [...history, { role: "user", text: trimmed }];
    setHistory(newHistory);
    setInput("");
    await callTina(newHistory);
  }

  function restart() {
    setHistory([]);
    setConsent("unknown");
    setInput("");
    setLoading(false);
    setLastTurn(null);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tina/next`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ history: [] }),
        });
        const data = await res.json();
        if (data?.message) {
          setHistory([{ role: "assistant", text: data.message }]);
          setLastTurn(data);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }

  const isAsking = lastTurn?.action === "ask";
  const isRecommending = lastTurn?.action === "recommend";

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-500 p-4">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded p-6">
        {/* Header */}
        <div className="mb-4 text-center">
          <img
            src="/tina.webp"
            alt="Tina Logo"
            className="mx-auto mb-2"
            style={{ width: "300px", height: "auto" }}
          />
          <h1 className="text-center text-xl font-semibold text-slate-600">
            Hi! I'm Tina, from Turners – Your Insurance Policy Assistant
          </h1>
        </div>

        {/* Chat window w bubb;es*/}
        <div className="h-[60vh] overflow-y-auto space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
          {history.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[85%]">
                  <div
                    className={`text-xs mb-1 ${
                      isUser ? "text-slate-600 text-right" : "text-blue-700"
                    }`}
                  >
                    {isUser ? "Me:" : "Tina:"}
                  </div>
                  <div
                    className={[
                      "whitespace-pre-wrap leading-relaxed px-4 py-2 rounded-2xl shadow-sm",
                      isUser
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm",
                    ].join(" ")}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Consent buttons */}
        {history.length === 1 && consent === "unknown" && (
          <div className="flex gap-3 mt-4">
            <button
              className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60"
              onClick={() => answerConsent("yes")}
              disabled={loading}
            >
              Yes
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:opacity-60"
              onClick={() => answerConsent("no")}
              disabled={loading}
            >
              No thanks
            </button>
          </div>
        )}

        {consent === "granted" && isAsking && (
          <form onSubmit={submitAnswer} className="mt-4 flex">
            <input
              className="flex-1 px-4 py-2 rounded-l-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Type your answer here"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              aria-label="Your answer"
            />
            <button
              className="px-5 py-2 rounded-r-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        )}

        {/* Recommendation view */}
        {isRecommending && (
          <div className="mt-5 space-y-3">
            {Array.isArray(lastTurn?.recommendedProducts) &&
            lastTurn.recommendedProducts.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Recommendation</h3>
                {lastTurn.recommendedProducts.map((p, i) => (
                  <div key={i} className="border rounded-xl p-3 bg-white">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-slate-600">{p.why}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                Click below to start over.
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-black"
                onClick={restart}
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
