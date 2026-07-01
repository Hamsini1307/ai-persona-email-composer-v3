const express = require("express");
const router = express.Router();
const { generateEmailResponse } = require("../controllers/generateController");

router.post("/", generateEmailResponse);

module.exports = router;
