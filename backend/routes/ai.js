const express = require("express");
const router = express.Router();

const { chatWithAI } = require("../scripts/ai");
const { generateDoctorAbout } = require("../scripts/ai");

router.post("/chat", chatWithAI);
router.post("/about", generateDoctorAbout);

module.exports = router;