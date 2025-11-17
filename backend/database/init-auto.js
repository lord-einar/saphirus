import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const usePostgres = !!process.env.DATABASE_URL;

export async function initDatabase() {
  console.log('🔄 Verificando base de datos...');

  try {
    if (usePostgres) {
      console.log('🐘 Usando PostgreSQL');
      await initPostgres();
    } else {
      console.log('📁 Usando SQLite');
      await initSQLite();
    }
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error.message);
    throw error;
  }
}

async function initPostgres() {
  const { pool } = await import('./db-pg.js');

  try {
    // Verificar conexión
    const client = await pool.connect();
    console.log(`✅ Conectado a PostgreSQL`);

    // Verificar tablas existentes
    const tablesBefore = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log(`📊 Tablas existentes: ${tablesBefore.rows.length}`);

    // Ejecutar schema PostgreSQL
    console.log('🔄 Ejecutando schema-pg.sql...');
    const schema = readFileSync(join(__dirname, 'schema-pg.sql'), 'utf8');
    await client.query(schema);

    // Verificar tablas después
    const tablesAfter = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log(`✅ Base de datos sincronizada: ${tablesAfter.rows.length} tablas`);

    const tableNames = tablesAfter.rows.map(t => t.table_name).join(', ');
    console.log(`📋 Tablas: ${tableNames}`);

    client.release();
  } catch (error) {
    console.error('❌ Error en PostgreSQL:', error.message);
    throw error;
  }
}

async function initSQLite() {
  const Database = (await import('better-sqlite3')).default;
  const dbPath = process.env.DATABASE_PATH || './database.sqlite';
  console.log(`📁 Ruta: ${dbPath}`);

  const db = new Database(dbPath);

  try {
    // Verificar tablas existentes
    const tablesBefore = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📊 Tablas existentes: ${tablesBefore.length}`);

    // Ejecutar schema SQLite
    console.log('🔄 Ejecutando schema.sql...');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);

    // Verificar tablas después
    const tablesAfter = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`✅ Base de datos sincronizada: ${tablesAfter.length} tablas`);

    const tableNames = tablesAfter.map(t => t.name).join(', ');
    console.log(`📋 Tablas: ${tableNames}`);

    db.close();
  } catch (error) {
    db.close();
    throw error;
  }
}
