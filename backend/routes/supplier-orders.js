import express from 'express';
import { body, param, query } from 'express-validator';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import db from '../database/db.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkJwt, ensureUser);

// Listar pedidos al proveedor
router.get('/', [
  query('status').optional().isString()
], (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    let sql = `
      SELECT
        so.*,
        p.name as product_name,
        p.brand,
        p.category,
        p.sku,
        p.image_url
      FROM supplier_orders so
      JOIN products p ON so.product_id = p.id
      WHERE so.user_id = ?
    `;
    const params = [userId];

    if (status) {
      sql += ' AND so.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY so.created_at DESC';

    const orders = db.prepare(sql).all(...params);

    res.json(orders);
  } catch (error) {
    console.error('Error al obtener pedidos al proveedor:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// Crear pedido al proveedor
router.post('/', [
  body('product_id').isInt({ min: 1 }),
  body('quantity').isInt({ min: 1 }),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const { product_id, quantity, notes } = req.body;
    const userId = req.user.id;

    // Verificar si ya existe un pedido pendiente para este producto
    const existing = db.prepare(`
      SELECT * FROM supplier_orders
      WHERE product_id = ? AND user_id = ? AND status = 'pending'
    `).get(product_id, userId);

    if (existing) {
      // Actualizar cantidad del pedido existente
      db.prepare(`
        UPDATE supplier_orders
        SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(quantity, existing.id);

      const updated = db.prepare('SELECT * FROM supplier_orders WHERE id = ?').get(existing.id);
      return res.json(updated);
    }

    // Crear nuevo pedido
    const insert = db.prepare(`
      INSERT INTO supplier_orders (product_id, user_id, quantity, notes)
      VALUES (?, ?, ?, ?)
    `);

    const result = insert.run(product_id, userId, quantity, notes || null);
    const newOrder = db.prepare('SELECT * FROM supplier_orders WHERE id = ?').get(result.lastInsertRowid);

    res.json(newOrder);
  } catch (error) {
    console.error('Error al crear pedido al proveedor:', error);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

// Actualizar pedido al proveedor
router.put('/:id', [
  param('id').isInt({ min: 1 }),
  body('quantity').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['pending', 'ordered', 'received', 'cancelled']),
  body('notes').optional().isString()
], (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, status, notes } = req.body;
    const userId = req.user.id;

    // Verificar que el pedido pertenece al usuario
    const order = db.prepare('SELECT * FROM supplier_orders WHERE id = ? AND user_id = ?').get(id, userId);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const updates = [];
    const params = [];

    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.json(order);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id, userId);

    db.prepare(`
      UPDATE supplier_orders
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...params);

    const updated = db.prepare('SELECT * FROM supplier_orders WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar pedido al proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

// Eliminar pedido al proveedor
router.delete('/:id', [
  param('id').isInt({ min: 1 })
], (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = db.prepare('DELETE FROM supplier_orders WHERE id = ? AND user_id = ?').run(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ message: 'Pedido eliminado' });
  } catch (error) {
    console.error('Error al eliminar pedido al proveedor:', error);
    res.status(500).json({ error: 'Error al eliminar pedido' });
  }
});

export default router;
