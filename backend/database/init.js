import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || './database.sqlite';
const db = new Database(dbPath);

console.log('Inicializando base de datos...');

try {
  // Leer y ejecutar el esquema SQL
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  console.log('✓ Base de datos inicializada correctamente');
  console.log(`✓ Archivo de base de datos: ${dbPath}`);
} catch (error) {
  console.error('✗ Error al inicializar la base de datos:', error.message);
  process.exit(1);
} finally {
  db.close();
}
