const Anthropic = require("@anthropic-ai/sdk");
const { buildPrompt, parseQuestionsJson } = require("./promptBuilder");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Haiku is the cheapest current Claude model — good fit for structured question generation.
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

async function generateQuestions(lectureText, subject, count = 10) {
  const prompt = buildPrompt(lectureText, subject, count);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return parseQuestionsJson(text);
}

module.exports = { generateQuestions };
