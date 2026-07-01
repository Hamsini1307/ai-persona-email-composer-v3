const mongoose = require("mongoose");

/**
 * Persona Schema
 * Represents a reusable AI "personality" that defines how Gemini
 * should write — its tone, vocabulary, and behavior. The system_prompt
 * field is later mapped directly to Gemini's system_instruction.
 */
const personaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Persona name is required"],
      trim: true,
      minlength: [2, "Persona name must be at least 2 characters"],
      maxlength: [100, "Persona name must be under 100 characters"],
    },
    system_prompt: {
      type: String,
      required: [true, "System prompt (behavior instructions) is required"],
      trim: true,
      minlength: [10, "System prompt should be at least 10 characters to be meaningful"],
      maxlength: [4000, "System prompt must be under 4000 characters"],
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt automatically
  }
);

module.exports = mongoose.model("Persona", personaSchema);
