const express = require("express");
const router = express.Router();
const {
  createPersona,
  getPersonas,
  getPersonaById,
  updatePersona,
  deletePersona,
} = require("../controllers/personaController");

router.post("/", createPersona);       // Create
router.get("/", getPersonas);          // Read all
router.get("/:id", getPersonaById);    // Read one
router.put("/:id", updatePersona);     // Update
router.delete("/:id", deletePersona);  // Delete

module.exports = router;
