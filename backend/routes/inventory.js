import express from 'express';
import { body, param } from 'express-validator';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import db from '../database/db-auto.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkJwt, ensureUser);

// Obtener inventario del vendedor
router.get('/', (req, res) => {
  try {
    const inventory = db.prepare(`
      SELECT
        i.id,
        i.stock,
        p.id as product_id,
        p.sku,
        p.name,
        p.brand,
        p.category,
        p.price,
        p.image_url,
        p.is_active
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      WHERE i.user_id = ?
      ORDER BY p.name ASC
    `).all(req.user.id);

    res.json(inventory);
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// Agregar producto al inventario
router.post('/:productId', [
  param('productId').isInt(),
  body('stock').isInt({ min: 0 })
], (req, res) => {
  try {
    const { productId } = req.params;
    const { stock = 0 } = req.body;

    // Verificar que el producto existe
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si ya existe en el inventario
    const existing = db.prepare(`
      SELECT * FROM inventory WHERE product_id = ? AND user_id = ?
    `).get(productId, req.user.id);

    if (existing) {
      return res.status(400).json({ error: 'El producto ya está en tu inventario' });
    }

    // Agregar al inventario
    const insert = db.prepare(`
      INSERT INTO inventory (product_id, user_id, stock)
      VALUES (?, ?, ?)
    `);

    const result = insert.run(productId, req.user.id, stock);

    res.status(201).json({
      id: result.lastInsertRowid,
      product_id: productId,
      stock,
      message: 'Producto agregado al inventario'
    });
  } catch (error) {
    console.error('Error al agregar producto al inventario:', error);
    res.status(500).json({ error: 'Error al agregar producto' });
  }
});

// Actualizar stock de un producto
router.put('/:productId', [
  param('productId').isInt(),
  body('stock').isInt({ min: 0 })
], (req, res) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;

    // Verificar que el producto está en el inventario del usuario
    const inventoryItem = db.prepare(`
      SELECT * FROM inventory WHERE product_id = ? AND user_id = ?
    `).get(productId, req.user.id);

    if (!inventoryItem) {
      return res.status(404).json({ error: 'Producto no encontrado en tu inventario' });
    }

    // Actualizar stock
    const update = db.prepare(`
      UPDATE inventory SET stock = ? WHERE product_id = ? AND user_id = ?
    `);

    update.run(stock, productId, req.user.id);

    res.json({
      product_id: productId,
      stock,
      message: 'Stock actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
});

// Eliminar producto del inventario
router.delete('/:productId', [
  param('productId').isInt()
], (req, res) => {
  try {
    const { productId } = req.params;

    const deleteStmt = db.prepare(`
      DELETE FROM inventory WHERE product_id = ? AND user_id = ?
    `);

    const result = deleteStmt.run(productId, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado en tu inventario' });
    }

    res.json({ message: 'Producto eliminado del inventario' });
  } catch (error) {
    console.error('Error al eliminar producto del inventario:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
