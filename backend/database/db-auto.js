import dotenv from 'dotenv';
dotenv.config();

// Detectar automáticamente qué base de datos usar
const usePostgres = !!process.env.DATABASE_URL;

let db;

if (usePostgres) {
  console.log('🐘 Usando PostgreSQL (Railway)');
  const { default: pgDb } = await import('./db-pg.js');
  db = pgDb;
} else {
  console.log('📁 Usando SQLite (desarrollo local)');
  const Database = (await import('better-sqlite3')).default;
  const dbPath = process.env.DATABASE_PATH || './database.sqlite';
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
}

export default db;
export { usePostgres };
