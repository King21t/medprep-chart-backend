/**
 * AI question generation — provider-agnostic entry point.
 *
 * Set AI_PROVIDER=groq (default, free) or AI_PROVIDER=claude in your .env
 * to choose which model actually generates the questions. Everything else
 * (routes, controllers, prompt, JSON format) stays exactly the same either way.
 */
const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

const impl =
  provider === "claude" || provider === "anthropic"
    ? require("./providers/anthropicProvider")
    : require("./providers/groqProvider");

module.exports = { generateQuestions: impl.generateQuestions };
