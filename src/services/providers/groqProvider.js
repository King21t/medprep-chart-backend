const Groq = require("groq-sdk");
const { buildPrompt, parseQuestionsJson } = require("./promptBuilder");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Llama 3.3 70B is Groq's strongest free-tier model for instruction-following/JSON output.
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

async function generateQuestions(lectureText, subject, count = 10) {
  const prompt = buildPrompt(lectureText, subject, count);

  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices?.[0]?.message?.content || "";
  return parseQuestionsJson(text);
}

module.exports = { generateQuestions };
