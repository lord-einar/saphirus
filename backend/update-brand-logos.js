/**
 * Script para actualizar los logos de las marcas
 *
 * Este script:
 * 1. Obtiene todas las marcas desde los productos
 * 2. Scrapea los logos desde Saphirus.com.ar
 * 3. Los descarga y guarda localmente
 * 4. Actualiza la base de datos
 *
 * Uso: node update-brand-logos.js
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database/db-auto.js';
import { scrapeProductDetail } from './services/scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGOS_DIR = path.join(__dirname, 'public', 'brand-logos');

console.log('=== Actualizando logos de marcas ===\n');

async function updateBrandLogos() {
  // Asegurar que existe la carpeta
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }

  // Obtener todas las marcas únicas de productos activos
  const brands = await db.prepare(`
    SELECT DISTINCT brand
    FROM products
    WHERE is_active = TRUE AND brand IS NOT NULL AND brand != ''
    ORDER BY brand
  `).all();

  console.log(`Encontradas ${brands.length} marcas en productos\n`);

  // Paso 1: Scrapear logos desde Saphirus
  for (const brandRow of brands) {
    const brandName = brandRow.brand;
    console.log(`📦 Procesando: ${brandName}`);

    // Verificar si ya existe el logo
    const existingBrand = await db.prepare('SELECT logo_url FROM brands WHERE name = ?').get(brandName);
    if (existingBrand?.logo_url && !existingBrand.logo_url.startsWith('http')) {
      console.log(`  ✓ Ya tiene logo local: ${existingBrand.logo_url}\n`);
      continue;
    }

    // Obtener un producto de esta marca
    const product = await db.prepare(`
      SELECT id, name, product_url
      FROM products
      WHERE brand = ? AND product_url IS NOT NULL AND is_active = TRUE
      LIMIT 1
    `).get(brandName);

    if (!product) {
      console.log(`  ⚠️  No se encontró producto con URL\n`);
      continue;
    }

    try {
      console.log(`  📄 Scrapeando desde: ${product.name}`);
      const details = await scrapeProductDetail(product.product_url);

      if (details.brandName && details.brandLogoUrl) {
        // Descargar la imagen
        console.log(`  📥 Descargando logo...`);
        const response = await axios.get(details.brandLogoUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        // Crear nombre de archivo
        const urlPath = new URL(details.brandLogoUrl).pathname;
        const ext = path.extname(urlPath) || '.svg';
        const fileName = details.brandName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') + ext;

        const filePath = path.join(LOGOS_DIR, fileName);
        fs.writeFileSync(filePath, response.data);

        // Actualizar BD con ruta local
        const localPath = `/brand-logos/${fileName}`;
        const upsertStmt = db.prepare(`
          INSERT INTO brands (name, logo_url, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(name) DO UPDATE SET
            logo_url = excluded.logo_url,
            updated_at = CURRENT_TIMESTAMP
        `);
        await upsertStmt.run(details.brandName, localPath);

        console.log(`  ✅ Logo guardado: ${fileName}\n`);
      } else {
        console.log(`  ⚠️  No se encontró logo en la página\n`);
      }

      // Pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log('=== Proceso completado ===\n');

  // Mostrar resumen
  const savedBrands = await db.prepare('SELECT * FROM brands ORDER BY name').all();
  console.log(`Total de marcas con logos: ${savedBrands.length}\n`);
  savedBrands.forEach(b => {
    console.log(`✓ ${b.name}: ${b.logo_url}`);
  });
}

updateBrandLogos()
  .then(() => {
    db.close();
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    db.close();
    process.exit(1);
  });
