const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authorization token is required." });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "skillswap_secret");
    const users = await query(
      "SELECT id, name, email, role, is_active FROM users WHERE id = ? LIMIT 1",
      [decoded.userId]
    );

    if (!users.length || !users[0].is_active) {
      return res.status(401).json({ success: false, message: "User account is unavailable." });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};
