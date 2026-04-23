const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const circles = await query(
      `SELECT c.id, c.name, c.description, c.created_at, cat.name AS category_name, u.name AS creator_name,
              COUNT(cm.user_id) AS member_count
       FROM learning_circles c
       JOIN categories cat ON cat.id = c.category_id
       JOIN users u ON u.id = c.creator_id
       LEFT JOIN circle_members cm ON cm.circle_id = c.id
       GROUP BY c.id, c.name, c.description, c.created_at, cat.name, u.name
       ORDER BY c.created_at DESC`
    );
    res.json({ success: true, circles });
  } catch (error) {
    next(error);
  }
});

router.get("/mine", async (req, res, next) => {
  try {
    const circles = await query(
      `SELECT c.id, c.name, c.description, cat.name AS category_name
       FROM circle_members cm
       JOIN learning_circles c ON c.id = cm.circle_id
       JOIN categories cat ON cat.id = c.category_id
       WHERE cm.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, circles });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, categoryId, description } = req.body;
    if (!name || !categoryId) {
      return res.status(400).json({ success: false, message: "Circle name and category are required." });
    }

    const result = await query(
      `INSERT INTO learning_circles (name, category_id, description, creator_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [name.trim(), categoryId, description || "", req.user.id]
    );

    await query("INSERT INTO circle_members (circle_id, user_id, joined_at) VALUES (?, ?, NOW())", [result.insertId, req.user.id]);
    res.status(201).json({ success: true, message: "Learning circle created.", circleId: result.insertId });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/join", async (req, res, next) => {
  try {
    await query("INSERT IGNORE INTO circle_members (circle_id, user_id, joined_at) VALUES (?, ?, NOW())", [req.params.id, req.user.id]);
    res.json({ success: true, message: "Joined learning circle." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
