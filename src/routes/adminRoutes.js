const express = require("express");
const { query } = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/stats", async (req, res, next) => {
  try {
    const [users] = await query("SELECT COUNT(*) AS total FROM users");
    const [skills] = await query("SELECT COUNT(*) AS total FROM user_skills");
    const [requests] = await query("SELECT COUNT(*) AS total FROM exchange_requests");
    const [reports] = await query("SELECT COUNT(*) AS total FROM reports WHERE status = 'open'");

    res.json({
      success: true,
      stats: {
        users: users.total,
        skills: skills.total,
        requests: requests.total,
        openReports: reports.total
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              p.location,
              COALESCE(ROUND(AVG(r.score), 1), 0) AS average_rating
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN ratings r ON r.rated_user_id = u.id
       GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at, p.location
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    await query(
      "UPDATE users SET role = COALESCE(?, role), is_active = COALESCE(?, is_active) WHERE id = ?",
      [role || null, typeof isActive === "boolean" ? Number(isActive) : null, req.params.id]
    );
    res.json({ success: true, message: "User updated." });
  } catch (error) {
    next(error);
  }
});

router.get("/reports", async (req, res, next) => {
  try {
    const reports = await query(
      `SELECT r.id, r.reason, r.details, r.status, r.created_at,
              reporter.name AS reporter_name, reported.name AS reported_name
       FROM reports r
       JOIN users reporter ON reporter.id = r.reporter_id
       JOIN users reported ON reported.id = r.reported_user_id
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
});

router.patch("/reports/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["open", "reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid report status." });
    }
    await query("UPDATE reports SET status = ?, updated_at = NOW() WHERE id = ?", [status, req.params.id]);
    res.json({ success: true, message: "Report updated." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
