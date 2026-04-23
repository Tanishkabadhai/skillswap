const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { createResponse, hasOpenAI } = require("../utils/openai");

const router = express.Router();

router.use(authenticate);

router.get("/favorites", async (req, res, next) => {
  try {
    const favorites = await query(
      `SELECT f.favorite_user_id, u.name, u.email, p.location, p.bio
       FROM favorites f
       JOIN users u ON u.id = f.favorite_user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE f.user_id = ?
       ORDER BY u.name ASC`,
      [req.user.id]
    );
    res.json({ success: true, favorites });
  } catch (error) {
    next(error);
  }
});

router.post("/favorites", async (req, res, next) => {
  try {
    const { favoriteUserId } = req.body;
    if (!favoriteUserId) {
      return res.status(400).json({ success: false, message: "Favorite user ID is required." });
    }
    if (Number(favoriteUserId) === Number(req.user.id)) {
      return res.status(400).json({ success: false, message: "You cannot favorite yourself." });
    }

    await query(
      "INSERT IGNORE INTO favorites (user_id, favorite_user_id, created_at) VALUES (?, ?, NOW())",
      [req.user.id, favoriteUserId]
    );
    res.status(201).json({ success: true, message: "Teacher bookmarked successfully." });
  } catch (error) {
    next(error);
  }
});

router.delete("/favorites/:id", async (req, res, next) => {
  try {
    await query("DELETE FROM favorites WHERE user_id = ? AND favorite_user_id = ?", [req.user.id, req.params.id]);
    res.json({ success: true, message: "Bookmark removed." });
  } catch (error) {
    next(error);
  }
});

router.get("/roadmaps", async (req, res, next) => {
  try {
    const roadmaps = await query(
      `SELECT id, skill_topic, current_level, goal, roadmap_text, created_at
       FROM learning_roadmaps
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, roadmaps });
  } catch (error) {
    next(error);
  }
});

router.post("/roadmaps", async (req, res, next) => {
  try {
    const { skillTopic, currentLevel, goal } = req.body;
    if (!skillTopic || !currentLevel || !goal) {
      return res.status(400).json({ success: false, message: "Skill topic, level, and goal are required." });
    }

    let roadmapText;

    if (hasOpenAI()) {
      roadmapText = await createResponse({
        instructions:
          "You generate learning roadmaps for students. Return a structured 6-step roadmap with short headings and practical actions. Keep it concise but specific.",
        input: `Create a roadmap for skill topic: ${skillTopic}. Current level: ${currentLevel}. Goal: ${goal}.`
      });
    } else {
      roadmapText = [
        `1. Clarify the target for ${skillTopic} and define one small win for this week.`,
        `2. Review fundamentals appropriate for a ${currentLevel} learner and identify weak spots.`,
        `3. Practice one project-based exercise aligned with the goal: ${goal}.`,
        `4. Schedule one peer exchange or feedback session inside SkillSwap.`,
        `5. Record notes, blockers, and next steps after each study session.`,
        `6. Reassess progress after one week and raise the challenge level gradually.`
      ].join("\n");
    }

    const result = await query(
      `INSERT INTO learning_roadmaps
       (user_id, skill_topic, current_level, goal, roadmap_text, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [req.user.id, skillTopic.trim(), currentLevel.trim(), goal.trim(), roadmapText]
    );

    res.status(201).json({ success: true, message: "Roadmap generated.", roadmapId: result.insertId, roadmapText });
  } catch (error) {
    next(error);
  }
});

router.get("/notes", async (req, res, next) => {
  try {
    const notes = await query(
      `SELECT id, request_id, note_title, note_body, created_at
       FROM session_notes
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, notes });
  } catch (error) {
    next(error);
  }
});

router.post("/notes", async (req, res, next) => {
  try {
    const { requestId, noteTitle, noteBody } = req.body;
    if (!noteTitle || !noteBody) {
      return res.status(400).json({ success: false, message: "Note title and note body are required." });
    }

    const result = await query(
      `INSERT INTO session_notes (user_id, request_id, note_title, note_body, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [req.user.id, requestId || null, noteTitle.trim(), noteBody.trim()]
    );

    res.status(201).json({ success: true, message: "Session note saved.", noteId: result.insertId });
  } catch (error) {
    next(error);
  }
});

router.get("/verifications", async (req, res, next) => {
  try {
    const verifications = await query(
      `SELECT id, title, portfolio_url, proof_text, status, created_at
       FROM skill_verifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, verifications });
  } catch (error) {
    next(error);
  }
});

router.post("/verifications", async (req, res, next) => {
  try {
    const { title, portfolioUrl, proofText } = req.body;
    if (!title || !portfolioUrl) {
      return res.status(400).json({ success: false, message: "Title and portfolio URL are required." });
    }

    const result = await query(
      `INSERT INTO skill_verifications
       (user_id, title, portfolio_url, proof_text, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [req.user.id, title.trim(), portfolioUrl.trim(), proofText || ""]
    );

    res.status(201).json({ success: true, message: "Verification submitted.", verificationId: result.insertId });
  } catch (error) {
    next(error);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    const [favorites] = await query("SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?", [req.user.id]);
    const [roadmaps] = await query("SELECT COUNT(*) AS total FROM learning_roadmaps WHERE user_id = ?", [req.user.id]);
    const [notes] = await query("SELECT COUNT(*) AS total FROM session_notes WHERE user_id = ?", [req.user.id]);
    const [verifications] = await query("SELECT COUNT(*) AS total FROM skill_verifications WHERE user_id = ?", [req.user.id]);
    const [completed] = await query(
      "SELECT COUNT(*) AS total FROM exchange_requests WHERE status = 'completed' AND (sender_id = ? OR receiver_id = ?)",
      [req.user.id, req.user.id]
    );

    const badges = [];
    if (favorites.total >= 1) badges.push("Connector");
    if (roadmaps.total >= 1) badges.push("Planner");
    if (notes.total >= 1) badges.push("Reflective Learner");
    if (verifications.total >= 1) badges.push("Portfolio Builder");
    if (completed.total >= 1) badges.push("Exchange Finisher");

    const streak = favorites.total + roadmaps.total + notes.total + verifications.total + completed.total;

    res.json({
      success: true,
      summary: {
        favorites: favorites.total,
        roadmaps: roadmaps.total,
        notes: notes.total,
        verifications: verifications.total,
        completed: completed.total,
        badges,
        streak
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
