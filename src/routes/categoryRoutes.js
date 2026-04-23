const express = require("express");
const { query } = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const categories = await query("SELECT id, name, description FROM categories ORDER BY name ASC");
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required." });
    }
    const result = await query(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name.trim(), description || ""]
    );
    res.status(201).json({ success: true, message: "Category created.", categoryId: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Category already exists." });
    }
    next(error);
  }
});

module.exports = router;
