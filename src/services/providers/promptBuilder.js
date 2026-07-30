/**
 * Builds the question-generation prompt shared by every AI provider,
 * so switching providers (e.g. Groq -> Claude) never changes question quality/format.
 */
function buildPrompt(lectureText, subject, count) {
  const trimmed = lectureText.slice(0, 20000);

  return `You are a medical education expert writing board-style practice questions.

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
}

function parseQuestionsJson(rawText) {
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Failed to parse AI-generated questions as JSON: " + err.message);
  }
}

module.exports = { buildPrompt, parseQuestionsJson };
