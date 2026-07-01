const mongoose = require("mongoose");
const Persona = require("../models/Persona");
const { genAI, MODEL_NAME } = require("../config/gemini");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Builds the user-turn prompt that gets sent to Gemini alongside the
 * system_instruction. The persona's tone/vocabulary rules live in the
 * system_instruction; this turn supplies the concrete task context
 * (the email to respond to, and what the user wants to achieve).
 */
function buildUserPrompt(rawEmail, objective) {
  return [
    "You are replying to the email below on behalf of the user.",
    "",
    "INCOMING EMAIL:",
    "---",
    rawEmail,
    "---",
    "",
    "OBJECTIVE FOR THIS REPLY:",
    objective,
    "",
    "Write a complete, ready-to-send email reply that achieves the objective above,",
    "while staying fully in character according to your system instructions.",
    "Return ONLY the email body text — no subject line, no explanations, no markdown formatting.",
  ].join("\n");
}

/**
 * POST /api/generate
 * Body: { personaId, raw_email, objective }
 *
 * Workflow:
 *  1. Look up the selected persona to retrieve its system_prompt.
 *  2. Map system_prompt -> Gemini's systemInstruction.
 *  3. Send raw_email + objective as the user turn.
 *  4. Return Gemini's generated reply to the client.
 */
exports.generateEmailResponse = async (req, res) => {
  try {
    const { personaId, raw_email, objective } = req.body;

    // --- Input validation ---
    if (!personaId || !isValidObjectId(personaId)) {
      return res.status(400).json({ success: false, message: "A valid 'personaId' is required." });
    }
    if (!raw_email || typeof raw_email !== "string" || !raw_email.trim()) {
      return res.status(400).json({ success: false, message: "'raw_email' is required and must be non-empty." });
    }
    if (!objective || typeof objective !== "string" || !objective.trim()) {
      return res.status(400).json({ success: false, message: "'objective' is required and must be non-empty." });
    }

    // --- Fetch persona ---
    const persona = await Persona.findById(personaId);
    if (!persona) {
      return res.status(404).json({ success: false, message: "Selected persona was not found." });
    }

    // --- Fail fast if Gemini isn't configured ---
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Server is missing GEMINI_API_KEY configuration. Contact the administrator.",
      });
    }

    // --- Map system_prompt directly to Gemini's system_instruction ---
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: persona.system_prompt,
    });

    const userPrompt = buildUserPrompt(raw_email.trim(), objective.trim());

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const generatedText = result?.response?.text?.();

    if (!generatedText || !generatedText.trim()) {
      // Fallback: Gemini returned an empty/blocked response (e.g. safety filter)
      return res.status(502).json({
        success: false,
        message: "Gemini returned an empty response. This can happen if the content was filtered. Please try rephrasing the email or objective.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        persona: { id: persona._id, name: persona.name },
        generated_reply: generatedText.trim(),
      },
    });
  } catch (err) {
    console.error("generateEmailResponse error:", err);

    // Distinguish common Gemini failure modes for a clearer client-side message
    const message = err?.message || "";

    if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is invalid. Please check the server configuration.",
      });
    }

    if (message.toLowerCase().includes("quota") || message.includes("429")) {
      return res.status(429).json({
        success: false,
        message: "Gemini API rate limit or quota exceeded. Please try again shortly.",
      });
    }

    if (message.toLowerCase().includes("timeout") || message.toLowerCase().includes("network")) {
      return res.status(503).json({
        success: false,
        message: "Could not reach the Gemini API. Please check your network connection and try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while generating the email response.",
    });
  }
};
