import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");

/**
 * MySQL-first Database with JSON fallback
 * ========================================
 * Default: MySQL (XAMPP) — set credentials in .env
 * Fallback: JSON files if MySQL unavailable
 *
 * .env config:
 *   DB_HOST=localhost
 *   DB_USER=root
 *   DB_PASSWORD=
 *   DB_NAME=xsow_db
 *   DB_PORT=3306
 *
 * Setup: node backend/src/utils/setup-mysql.js
 */

class JsonDB {
  constructor(filename) {
    this.filePath = path.join(DATA_DIR, `${filename}.json`);
  }
  readAll() {
    try { return JSON.parse(fs.readFileSync(this.filePath, "utf-8")); }
    catch { return []; }
  }
  writeAll(data) {
    try { fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8"); return true; }
    catch { return false; }
  }
  findById(id) { return this.readAll().find(item => item.id === id) || null; }
  create(record) { const d = this.readAll(); d.push(record); this.writeAll(d); return record; }
  update(id, updates) {
    const d = this.readAll();
    const i = d.findIndex(item => item.id === id);
    if (i === -1) return null;
    d[i] = { ...d[i], ...updates };
    this.writeAll(d);
    return d[i];
  }
  delete(id) {
    const d = this.readAll();
    const f = d.filter(item => item.id !== id);
    if (f.length === d.length) return false;
    this.writeAll(f);
    return true;
  }
}

// Try MySQL first, fall back to JSON
let DB;
if (process.env.DB_TYPE === "json") {
  DB = JsonDB;
  console.log("📁 Using JSON file database");
} else {
  try {
    const { default: MysqlDB } = await import("./mysql-db.js");
    // Test connection
    const { getPool } = await import("./mysql-db.js");
    await getPool().query("SELECT 1");
    DB = MysqlDB;
    console.log("🗄️  Using MySQL database");
  } catch (err) {
    console.warn("⚠️  MySQL unavailable, using JSON fallback:", err.message);
    console.warn("   To use MySQL: npm install mysql2 && node backend/src/utils/setup-mysql.js");
    DB = JsonDB;
  }
}

export default DB;
