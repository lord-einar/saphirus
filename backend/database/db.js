import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || './database.sqlite';
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

export default db;
