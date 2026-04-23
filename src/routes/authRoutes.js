const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { createToken, isEmail } = require("../utils/helpers");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    if (!isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, 'student', 1)",
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );

    await query("INSERT INTO profiles (user_id, bio, location, availability, created_at, updated_at) VALUES (?, '', '', '', NOW(), NOW())", [result.insertId]);

    const token = createToken(result.insertId);
    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const users = await query(
      "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );

    if (!users.length || !users[0].is_active) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = createToken(users[0].id);
    return res.json({
      success: true,
      message: "Login successful.",
      token
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
