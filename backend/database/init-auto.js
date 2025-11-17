import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function initDatabase() {
  const dbPath = process.env.DATABASE_PATH || './database.sqlite';

  console.log('🔄 Verificando base de datos...');
  console.log(`📁 Ruta: ${dbPath}`);

  try {
    const db = new Database(dbPath);

    // Verificar tablas existentes
    const tablesBefore = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📊 Tablas existentes: ${tablesBefore.length}`);

    // SIEMPRE ejecutar el schema (es seguro con CREATE TABLE IF NOT EXISTS)
    console.log('🔄 Ejecutando schema.sql...');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);

    // Verificar tablas después
    const tablesAfter = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`✅ Base de datos sincronizada: ${tablesAfter.length} tablas`);

    // Listar las tablas
    const tableNames = tablesAfter.map(t => t.name).join(', ');
    console.log(`📋 Tablas: ${tableNames}`);

    db.close();
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error.message);
    throw error;
  }
}
