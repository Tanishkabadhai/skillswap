const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { receiverId, skillId, message } = req.body;

    if (!receiverId || !skillId) {
      return res.status(400).json({ success: false, message: "Receiver and skill are required." });
    }

    if (Number(receiverId) === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot request your own skill." });
    }

    const skills = await query("SELECT id, user_id FROM user_skills WHERE id = ? LIMIT 1", [skillId]);
    if (!skills.length || Number(skills[0].user_id) !== Number(receiverId)) {
      return res.status(400).json({ success: false, message: "Selected skill is invalid." });
    }

    const result = await query(
      `INSERT INTO exchange_requests
       (sender_id, receiver_id, skill_id, note, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [req.user.id, receiverId, skillId, message || ""]
    );

    res.status(201).json({ success: true, message: "Exchange request sent.", requestId: result.insertId });
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", authenticate, async (req, res, next) => {
  try {
    const incoming = await query(
      `SELECT er.id, er.status, er.note, er.created_at,
              sender.name AS sender_name, sender.id AS sender_id,
              skill.title AS skill_title
       FROM exchange_requests er
       JOIN users sender ON sender.id = er.sender_id
       JOIN user_skills skill ON skill.id = er.skill_id
       WHERE er.receiver_id = ?
       ORDER BY er.created_at DESC`,
      [req.user.id]
    );

    const outgoing = await query(
      `SELECT er.id, er.status, er.note, er.created_at,
              receiver.name AS receiver_name, receiver.id AS receiver_id,
              skill.title AS skill_title
       FROM exchange_requests er
       JOIN users receiver ON receiver.id = er.receiver_id
       JOIN user_skills skill ON skill.id = er.skill_id
       WHERE er.sender_id = ?
       ORDER BY er.created_at DESC`,
      [req.user.id]
    );

    const accepted = await query(
      `SELECT er.id, er.status, er.note, er.created_at,
              sender.name AS sender_name, receiver.name AS receiver_name, skill.title AS skill_title
       FROM exchange_requests er
       JOIN users sender ON sender.id = er.sender_id
       JOIN users receiver ON receiver.id = er.receiver_id
       JOIN user_skills skill ON skill.id = er.skill_id
       WHERE (er.sender_id = ? OR er.receiver_id = ?) AND er.status IN ('accepted', 'completed')
       ORDER BY er.updated_at DESC`,
      [req.user.id, req.user.id]
    );

    res.json({ success: true, dashboard: { incoming, outgoing, accepted } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/respond", authenticate, async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be accepted or rejected." });
    }

    const result = await query(
      "UPDATE exchange_requests SET status = ?, updated_at = NOW() WHERE id = ? AND receiver_id = ? AND status = 'pending'",
      [action, req.params.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Pending request not found." });
    }

    res.json({ success: true, message: `Request ${action}.` });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/complete", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE exchange_requests
       SET status = 'completed', updated_at = NOW()
       WHERE id = ? AND (sender_id = ? OR receiver_id = ?) AND status = 'accepted'`,
      [req.params.id, req.user.id, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Accepted request not found." });
    }

    res.json({ success: true, message: "Exchange marked as completed." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
