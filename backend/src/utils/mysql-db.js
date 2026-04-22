/**
 * MySQL Database Adapter for xsow
 * ================================
 * Drop-in replacement for JsonDB when using XAMPP/MySQL.
 *
 * SETUP:
 * 1. Install: npm install mysql2
 * 2. Create database: CREATE DATABASE xsow_db;
 * 3. Set env vars in .env:
 *      DB_TYPE=mysql
 *      DB_HOST=localhost
 *      DB_USER=root
 *      DB_PASSWORD=
 *      DB_NAME=xsow_db
 *      DB_PORT=3306
 * 4. Run: node backend/src/utils/setup-mysql.js  (creates tables)
 * 5. Restart server — it auto-detects DB_TYPE=mysql
 *
 * The server uses the same model API regardless of backend.
 * JsonDB is the default (no setup needed). MySQL is optional.
 */

import mysql from "mysql2/promise";

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "xsow_db",
      port: parseInt(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

class MysqlDB {
  constructor(tableName) {
    this.table = tableName;
  }

  async readAll() {
    try {
      const [rows] = await getPool().query(`SELECT * FROM ${this.table}`);
      return rows.map((r) => {
        // Parse JSON fields
        if (r.data) return JSON.parse(r.data);
        return r;
      });
    } catch (err) {
      console.error(`MySQL readAll ${this.table}:`, err.message);
      return [];
    }
  }

  async findById(id) {
    try {
      const [rows] = await getPool().query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
      if (!rows.length) return null;
      return rows[0].data ? JSON.parse(rows[0].data) : rows[0];
    } catch (err) {
      console.error(`MySQL findById ${this.table}:`, err.message);
      return null;
    }
  }

  async create(record) {
    try {
      await getPool().query(
        `INSERT INTO ${this.table} (id, data) VALUES (?, ?)`,
        [record.id, JSON.stringify(record)]
      );
      return record;
    } catch (err) {
      console.error(`MySQL create ${this.table}:`, err.message);
      return record;
    }
  }

  async update(id, updates) {
    try {
      const existing = await this.findById(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates };
      await getPool().query(
        `UPDATE ${this.table} SET data = ? WHERE id = ?`,
        [JSON.stringify(updated), id]
      );
      return updated;
    } catch (err) {
      console.error(`MySQL update ${this.table}:`, err.message);
      return null;
    }
  }

  async delete(id) {
    try {
      const [result] = await getPool().query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error(`MySQL delete ${this.table}:`, err.message);
      return false;
    }
  }

  // Compatibility with JsonDB writeAll
  async writeAll(data) {
    try {
      await getPool().query(`DELETE FROM ${this.table}`);
      for (const record of data) {
        await this.create(record);
      }
      return true;
    } catch (err) {
      console.error(`MySQL writeAll ${this.table}:`, err.message);
      return false;
    }
  }
}

export default MysqlDB;
