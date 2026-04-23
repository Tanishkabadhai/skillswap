const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { reportedUserId, reason, details } = req.body;
    if (!reportedUserId || !reason) {
      return res.status(400).json({ success: false, message: "Reported user and reason are required." });
    }

    const result = await query(
      `INSERT INTO reports (reporter_id, reported_user_id, reason, details, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'open', NOW(), NOW())`,
      [req.user.id, reportedUserId, reason.trim(), details || ""]
    );

    res.status(201).json({ success: true, message: "Report submitted.", reportId: result.insertId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
