const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "WARNING: GEMINI_API_KEY is not set. AI generation requests will fail until it is configured in .env"
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

module.exports = { genAI, MODEL_NAME };
