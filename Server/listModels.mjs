import "dotenv/config";

const key = process.env.GOOGLE_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
  key
)}`;

const res = await fetch(url);
if (!res.ok) {
  console.error("ListModels failed:", res.status, await res.text());
  process.exit(1);
}
const data = await res.json();

for (const m of data.models || []) {
  // Only show ones that support generateContent
  if ((m.supportedGenerationMethods || []).includes("generateContent")) {
    console.log(m.name);
  }
}
