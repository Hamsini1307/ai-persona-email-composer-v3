const mongoose = require("mongoose");
const Persona = require("../models/Persona");

/**
 * Small helper to keep error responses consistent across the controller.
 */
function sendError(res, status, message, details) {
  return res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// CREATE — POST /api/personas
exports.createPersona = async (req, res) => {
  try {
    const { name, system_prompt } = req.body;

    if (!name || !system_prompt) {
      return sendError(res, 400, "Both 'name' and 'system_prompt' are required.");
    }

    const persona = await Persona.create({ name, system_prompt });

    return res.status(201).json({ success: true, data: persona });
  } catch (err) {
    if (err.name === "ValidationError") {
      return sendError(res, 400, "Validation failed.", err.message);
    }
    console.error("createPersona error:", err);
    return sendError(res, 500, "Failed to create persona.");
  }
};

// READ ALL — GET /api/personas
exports.getPersonas = async (req, res) => {
  try {
    const personas = await Persona.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: personas.length, data: personas });
  } catch (err) {
    console.error("getPersonas error:", err);
    return sendError(res, 500, "Failed to fetch personas.");
  }
};

// READ ONE — GET /api/personas/:id
exports.getPersonaById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid persona ID format.");
    }

    const persona = await Persona.findById(id);

    if (!persona) {
      return sendError(res, 404, "Persona not found.");
    }

    return res.status(200).json({ success: true, data: persona });
  } catch (err) {
    console.error("getPersonaById error:", err);
    return sendError(res, 500, "Failed to fetch persona.");
  }
};

// UPDATE — PUT /api/personas/:id
exports.updatePersona = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, system_prompt } = req.body;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid persona ID format.");
    }

    if (!name && !system_prompt) {
      return sendError(res, 400, "Provide at least one field ('name' or 'system_prompt') to update.");
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (system_prompt !== undefined) updates.system_prompt = system_prompt;

    const persona = await Persona.findByIdAndUpdate(id, updates, {
      new: true, // return the updated document
      runValidators: true,
    });

    if (!persona) {
      return sendError(res, 404, "Persona not found.");
    }

    return res.status(200).json({ success: true, data: persona });
  } catch (err) {
    if (err.name === "ValidationError") {
      return sendError(res, 400, "Validation failed.", err.message);
    }
    console.error("updatePersona error:", err);
    return sendError(res, 500, "Failed to update persona.");
  }
};

// DELETE — DELETE /api/personas/:id
exports.deletePersona = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid persona ID format.");
    }

    const persona = await Persona.findByIdAndDelete(id);

    if (!persona) {
      return sendError(res, 404, "Persona not found.");
    }

    return res.status(200).json({ success: true, message: "Persona deleted successfully.", data: persona });
  } catch (err) {
    console.error("deletePersona error:", err);
    return sendError(res, 500, "Failed to delete persona.");
  }
};
