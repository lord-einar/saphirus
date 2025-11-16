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

    // Verificar si las tablas existen
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

    if (tables.length === 0) {
      console.log('⚠️  Base de datos vacía. Inicializando...');

      // Leer y ejecutar el esquema SQL
      const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
      db.exec(schema);

      console.log('✅ Base de datos inicializada correctamente');
      console.log(`✅ Tablas creadas: ${db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().length}`);
    } else {
      console.log(`✅ Base de datos OK (${tables.length} tablas encontradas)`);
    }

    db.close();
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error.message);
    throw error;
  }
}
