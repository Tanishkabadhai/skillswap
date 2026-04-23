const express = require("express");
const { authenticate } = require("../middleware/auth");
const { createResponse, hasOpenAI } = require("../utils/openai");

const router = express.Router();

router.use(authenticate);

router.get("/status", (req, res) => {
  res.json({ success: true, configured: hasOpenAI() });
});

router.post("/chat", async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const reply = await createResponse({
      instructions:
        "You are SkillSwap AI, a warm study helper inside a student skill-sharing platform. Give concise, practical guidance for learning strategy, practice plans, revision help, and project ideas. Keep answers useful and not too long.",
      input: message.trim()
    });

    res.json({ success: true, reply });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
