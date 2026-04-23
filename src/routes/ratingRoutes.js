const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { requestId, ratedUserId, score, feedback } = req.body;

    if (!requestId || !ratedUserId || !score) {
      return res.status(400).json({ success: false, message: "Request, rated user, and score are required." });
    }

    const numericScore = Number(score);
    if (numericScore < 1 || numericScore > 5) {
      return res.status(400).json({ success: false, message: "Score must be between 1 and 5." });
    }

    const exchanges = await query(
      `SELECT id FROM exchange_requests
       WHERE id = ? AND status = 'completed' AND (sender_id = ? OR receiver_id = ?)`,
      [requestId, req.user.id, req.user.id]
    );

    if (!exchanges.length) {
      return res.status(400).json({ success: false, message: "Completed exchange not found." });
    }

    const existing = await query(
      "SELECT id FROM ratings WHERE request_id = ? AND reviewer_id = ? LIMIT 1",
      [requestId, req.user.id]
    );

    if (existing.length) {
      return res.status(409).json({ success: false, message: "You have already rated this exchange." });
    }

    await query(
      `INSERT INTO ratings (request_id, reviewer_id, rated_user_id, score, feedback, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [requestId, req.user.id, ratedUserId, numericScore, feedback || ""]
    );

    res.status(201).json({ success: true, message: "Rating submitted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
