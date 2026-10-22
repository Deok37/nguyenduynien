const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'portfolio_user',
  password: process.env.DB_PASSWORD || 'PortfolioUser@2024SecurePass',
  database: process.env.DB_NAME || 'portfolio_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Function to check DB connectivity with retry for Docker startup
async function checkDbConnection(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const p = await getPool();
      const [rows] = await p.query('SELECT 1 as connected');
      console.log(`[Database] Connected successfully to MySQL (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
      return true;
    } catch (err) {
      console.warn(`[Database] Attempt ${i + 1}/${retries} failed to connect to MySQL: ${err.message}. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('[Database] Could not connect to MySQL after maximum retries.');
  return false;
}

module.exports = {
  getPool,
  checkDbConnection
};
