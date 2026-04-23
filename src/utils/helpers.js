const jwt = require("jsonwebtoken");

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || "skillswap_secret", {
    expiresIn: "7d"
  });

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const sanitizePagination = (page = 1, limit = 20) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit
  };
};

module.exports = {
  createToken,
  isEmail,
  sanitizePagination
};
