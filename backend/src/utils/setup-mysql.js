/**
 * MySQL Table Setup for xsow
 * Run: node backend/src/utils/setup-mysql.js
 * Requires: npm install mysql2 dotenv
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DB = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "xsow_db",
  port: parseInt(process.env.DB_PORT) || 3306,
};

const TABLES = [
  "products", "users", "orders", "carts", "sales",
  "promos", "reviews", "subscribers", "bulkorders", "settings",
];

async function setup() {
  console.log(`\n🔌 Connecting to MySQL at ${DB.host}:${DB.port}...`);

  // Create database if not exists
  const conn = await mysql.createConnection({ host: DB.host, user: DB.user, password: DB.password, port: DB.port });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB.database}\``);
  await conn.end();

  // Connect to database
  const pool = mysql.createPool(DB);

  for (const table of TABLES) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${table}\` (
        id VARCHAR(255) PRIMARY KEY,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log(`  ✅ Table '${table}' ready`);
  }

  console.log(`\n✅ All ${TABLES.length} tables created in '${DB.database}'`);
  console.log(`\n📝 To switch to MySQL, add to your .env file:`);
  console.log(`   DB_TYPE=mysql`);
  console.log(`   DB_HOST=${DB.host}`);
  console.log(`   DB_USER=${DB.user}`);
  console.log(`   DB_PASSWORD=${DB.password}`);
  console.log(`   DB_NAME=${DB.database}`);
  console.log(`   DB_PORT=${DB.port}\n`);

  await pool.end();
  process.exit(0);
}

setup().catch((err) => {
  console.error("❌ MySQL setup failed:", err.message);
  console.log("\nMake sure XAMPP/MySQL is running and credentials are correct.");
  process.exit(1);
});
