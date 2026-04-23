const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { sanitizePagination } = require("../utils/helpers");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { categoryId, q, page, limit } = req.query;
    const pagination = sanitizePagination(page, limit);
    const filters = [];
    const params = [];

    if (categoryId) {
      filters.push("s.category_id = ?");
      params.push(categoryId);
    }

    if (q) {
      filters.push("(s.title LIKE ? OR s.description LIKE ? OR c.name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const rows = await query(
      `SELECT s.id, s.user_id, s.category_id, s.title, s.description, s.level, s.created_at,
              u.name AS teacher_name, c.name AS category_name,
              COALESCE(ROUND(AVG(r.score), 1), 0) AS teacher_rating
       FROM user_skills s
       JOIN users u ON u.id = s.user_id
       JOIN categories c ON c.id = s.category_id
       LEFT JOIN ratings r ON r.rated_user_id = u.id
       ${where}
       GROUP BY s.id, s.user_id, s.category_id, s.title, s.description, s.level, s.created_at, u.name, c.name
       ORDER BY s.created_at DESC
       LIMIT ${pagination.limit} OFFSET ${pagination.offset}`,
      params
    );

    res.json({ success: true, skills: rows, page: pagination.page, limit: pagination.limit });
  } catch (error) {
    next(error);
  }
});

router.get("/mine", authenticate, async (req, res, next) => {
  try {
    const skills = await query(
      `SELECT s.id, s.title, s.description, s.level, s.category_id, c.name AS category_name
       FROM user_skills s
       JOIN categories c ON c.id = s.category_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, skills });
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { title, description, level, categoryId } = req.body;
    if (!title || !categoryId) {
      return res.status(400).json({ success: false, message: "Title and category are required." });
    }

    const result = await query(
      `INSERT INTO user_skills (user_id, category_id, title, description, level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [req.user.id, categoryId, title.trim(), description || "", level || "Beginner"]
    );

    res.status(201).json({ success: true, message: "Skill added successfully.", skillId: result.insertId });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, level, categoryId } = req.body;
    if (!title || !categoryId) {
      return res.status(400).json({ success: false, message: "Title and category are required." });
    }
    const existing = await query("SELECT id FROM user_skills WHERE id = ? AND user_id = ? LIMIT 1", [id, req.user.id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Skill not found." });
    }

    await query(
      `UPDATE user_skills
       SET title = ?, description = ?, level = ?, category_id = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [title, description || "", level || "Beginner", categoryId, id, req.user.id]
    );

    res.json({ success: true, message: "Skill updated successfully." });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const result = await query("DELETE FROM user_skills WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Skill not found." });
    }
    res.json({ success: true, message: "Skill deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
