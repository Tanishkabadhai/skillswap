require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const { testConnection } = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const skillRoutes = require("./src/routes/skillRoutes");
const requestRoutes = require("./src/routes/requestRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const ratingRoutes = require("./src/routes/ratingRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const growthRoutes = require("./src/routes/growthRoutes");
const circleRoutes = require("./src/routes/circleRoutes");
const aiRoutes = require("./src/routes/aiRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "app.html"));
});

app.get("/api/health", async (req, res) => {
  try {
    await testConnection();
    res.json({ success: true, message: "SkillSwap API is running." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database connection failed." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/growth", growthRoutes);
app.use("/api/circles", circleRoutes);
app.use("/api/ai", aiRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error."
  });
});

app.listen(PORT, () => {
  console.log(`SkillSwap server running on http://localhost:${PORT}`);
});
