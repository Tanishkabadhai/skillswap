const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const profile = await query(
      `SELECT p.id, p.user_id, p.bio, p.location, p.availability, p.avatar_url, p.created_at, p.updated_at,
              u.name, u.email, u.role,
              COALESCE(ROUND(AVG(r.score), 1), 0) AS average_rating,
              COUNT(r.id) AS rating_count
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN ratings r ON r.rated_user_id = u.id
       WHERE p.user_id = ?
       GROUP BY p.id, p.user_id, p.bio, p.location, p.availability, p.avatar_url, p.created_at, p.updated_at, u.name, u.email, u.role`,
      [req.user.id]
    );

    res.json({ success: true, profile: profile[0] || null });
  } catch (error) {
    next(error);
  }
});

router.put("/me", authenticate, async (req, res, next) => {
  try {
    const { name, bio, location, availability, avatarUrl } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }

    await query("UPDATE users SET name = ? WHERE id = ?", [name.trim(), req.user.id]);
    await query(
      `UPDATE profiles
       SET bio = ?, location = ?, availability = ?, avatar_url = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [bio || "", location || "", availability || "", avatarUrl || "", req.user.id]
    );

    res.json({ success: true, message: "Profile updated successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
