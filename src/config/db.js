const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.DB_USER || process.env.MYSQLUSER || "root",
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || "skillswap",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool({
  ...dbConfig
});

const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const testConnection = async () => {
  const connection = await pool.getConnection();
  connection.release();
};

module.exports = {
  pool,
  query,
  testConnection
};
