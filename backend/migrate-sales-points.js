import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database/db-auto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Ejecutando migración: Puestos de venta ===\n');

try {
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'database', 'migrations', 'add_sales_points.sql'),
    'utf8'
  );

  // Ejecutar todas las sentencias
  db.exec(migrationSQL);

  console.log('✅ Migración completada exitosamente\n');

  // Verificar que las tablas se crearon
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND (name='sales_points' OR name='sales_point_inventory')
    ORDER BY name
  `).all();

  console.log('Tablas creadas:');
  tables.forEach(t => console.log(`  - ${t.name}`));

} catch (error) {
  console.error('❌ Error en la migración:', error);
  process.exit(1);
}

db.close();
console.log('\n✅ Proceso completado');
