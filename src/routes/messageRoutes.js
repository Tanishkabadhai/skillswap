const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const verifyParticipant = async (requestId, userId) => {
  const rows = await query(
    "SELECT id FROM exchange_requests WHERE id = ? AND (sender_id = ? OR receiver_id = ?) LIMIT 1",
    [requestId, userId, userId]
  );
  return rows.length > 0;
};

router.get("/:requestId", authenticate, async (req, res, next) => {
  try {
    const allowed = await verifyParticipant(req.params.requestId, req.user.id);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "You are not part of this exchange." });
    }

    const messages = await query(
      `SELECT m.id, m.request_id, m.sender_id, m.message, m.created_at, u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.request_id = ?
       ORDER BY m.created_at ASC`,
      [req.params.requestId]
    );

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
});

router.post("/:requestId", authenticate, async (req, res, next) => {
  try {
    const allowed = await verifyParticipant(req.params.requestId, req.user.id);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "You are not part of this exchange." });
    }

    if (!req.body.message || !req.body.message.trim()) {
      return res.status(400).json({ success: false, message: "Message text is required." });
    }

    const result = await query(
      "INSERT INTO messages (request_id, sender_id, message, created_at) VALUES (?, ?, ?, NOW())",
      [req.params.requestId, req.user.id, req.body.message.trim()]
    );

    res.status(201).json({ success: true, message: "Message sent.", messageId: result.insertId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
