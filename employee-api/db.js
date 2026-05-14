const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: Number(process.env.DB_QUEUE_LIMIT) || 0,
});

const promisePool = pool.promise();

async function checkDatabaseConnection() {
  const startedAt = Date.now();
  await promisePool.query("SELECT 1");

  return {
    isHealthy: true,
    latencyMs: Date.now() - startedAt,
  };
}

promisePool.checkDatabaseConnection = checkDatabaseConnection;

module.exports = promisePool;
