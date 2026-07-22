const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generates multiple-choice practice questions from lecture text.
 * @param {string} lectureText - extracted text from the PDF
 * @param {string} subject - subject/topic label
 * @param {number} count - number of questions to generate
 * @returns {Promise<Array>} array of { questionText, options, correctAnswer, explanation, difficulty }
 */
async function generateQuestions(lectureText, subject, count = 10) {
  // Truncate very long lectures to keep prompt size reasonable
  const trimmed = lectureText.slice(0, 20000);

  const prompt = `You are a medical education expert writing board-style practice questions.

Based ONLY on the lecture content below (subject: ${subject}), generate exactly ${count} multiple-choice questions
in the style of USMLE-type exam questions. Each question should have 4 options (A-D), one correct answer,
a brief explanation, and a difficulty rating.

Respond ONLY with a JSON array, no preamble, no markdown fences. Format:
[
  {
    "questionText": "...",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "correctAnswer": "A",
    "explanation": "...",
    "difficulty": "EASY" | "MEDIUM" | "HARD"
  }
]

LECTURE CONTENT:
${trimmed}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Failed to parse AI-generated questions as JSON: " + err.message);
  }
}

module.exports = { generateQuestions };
