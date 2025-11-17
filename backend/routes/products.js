import express from 'express';
import { query, param } from 'express-validator';
import db from '../database/db-auto.js';
import { scrapeProductDetail } from '../services/scraper.js';

const router = express.Router();

// Listar todos los productos activos (con filtros)
router.get('/', [
  query('brand').optional().isString(),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 10000 }),
  query('offset').optional().isInt({ min: 0 })
], (req, res) => {
  try {
    const { brand, category, search, limit = 10000, offset = 0 } = req.query;

    let sql = 'SELECT * FROM products WHERE is_active = 1';
    const params = [];

    if (brand) {
      sql += ' AND brand = ?';
      params.push(brand);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR brand LIKE ? OR category LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = db.prepare(sql).all(...params);

    // Obtener total de productos para paginación
    let countSql = 'SELECT COUNT(*) as total FROM products WHERE is_active = 1';
    const countParams = [];

    if (brand) {
      countSql += ' AND brand = ?';
      countParams.push(brand);
    }

    if (category) {
      countSql += ' AND category = ?';
      countParams.push(category);
    }

    if (search) {
      countSql += ' AND (name LIKE ? OR brand LIKE ? OR category LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const { total } = db.prepare(countSql).get(...countParams);

    res.json({
      products,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error al listar productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Obtener marcas únicas con logos
router.get('/brands', (req, res) => {
  try {
    const brands = db.prepare(`
      SELECT DISTINCT p.brand
      FROM products p
      WHERE p.is_active = 1 AND p.brand IS NOT NULL AND p.brand != ''
      ORDER BY p.brand ASC
    `).all();

    // Obtener logos de la tabla brands
    const brandsWithLogos = brands.map(b => {
      const brandInfo = db.prepare('SELECT logo_url FROM brands WHERE name = ?').get(b.brand);
      return {
        name: b.brand,
        logo: brandInfo?.logo_url || null
      };
    });

    res.json(brandsWithLogos);
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
});

// Obtener categorías únicas (opcionalmente filtradas por marca)
router.get('/categories', [
  query('brand').optional().isString()
], (req, res) => {
  try {
    const { brand } = req.query;

    let sql = `
      SELECT DISTINCT category
      FROM products
      WHERE is_active = 1 AND category IS NOT NULL AND category != '' AND category != 'Sin categoría'
    `;
    const params = [];

    if (brand) {
      sql += ' AND brand = ?';
      params.push(brand);
    }

    sql += ' ORDER BY category ASC';

    const categories = db.prepare(sql).all(...params);

    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Listar productos nuevos
router.get('/new', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT * FROM products
      WHERE is_active = 1 AND is_new = 1
      ORDER BY created_at DESC
    `).all();

    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos nuevos:', error);
    res.status(500).json({ error: 'Error al obtener productos nuevos' });
  }
});

// Listar productos dados de baja
router.get('/removed', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT * FROM products
      WHERE is_active = 0
      ORDER BY updated_at DESC
      LIMIT 100
    `).all();

    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos dados de baja:', error);
    res.status(500).json({ error: 'Error al obtener productos dados de baja' });
  }
});

// Obtener detalle de un producto
router.get('/:id', [
  param('id').isInt()
], async (req, res) => {
  try {
    const { id } = req.params;
    let product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si no tiene detalles, scrapearlos
    if ((!product.description || !product.attributes) && product.product_url) {
      console.log(`Scrapeando detalles para producto ${product.id}: ${product.name}`);

      const details = await scrapeProductDetail(product.product_url);

      // Actualizar en la base de datos
      const updateStmt = db.prepare(`
        UPDATE products
        SET description = COALESCE(?, description),
            attributes = COALESCE(?, attributes),
            sku = COALESCE(?, sku),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateStmt.run(details.description, details.attributes, details.sku, id);

      // Guardar logo de marca si está disponible
      if (details.brandName && details.brandLogoUrl) {
        const upsertBrandStmt = db.prepare(`
          INSERT INTO brands (name, logo_url, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(name) DO UPDATE SET
            logo_url = excluded.logo_url,
            updated_at = CURRENT_TIMESTAMP
        `);

        upsertBrandStmt.run(details.brandName, details.brandLogoUrl);
        console.log(`✓ Logo de marca guardado: ${details.brandName}`);
      }

      // Obtener el producto actualizado
      product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    }

    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

export default router;
