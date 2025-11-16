import express from 'express';
import { body, param, query } from 'express-validator';
import db from '../database/db.js';
import { checkJwt, ensureUser } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkJwt, ensureUser);

// ===== PUESTOS DE VENTA =====

// Listar todos los puestos de venta del usuario
router.get('/', [
  query('status').optional().isIn(['active', 'inactive', 'all'])
], (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const userId = req.user.id;

    let sql = 'SELECT * FROM sales_points WHERE user_id = ?';
    const params = [userId];

    if (status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const salesPoints = db.prepare(sql).all(...params);

    // Para cada puesto, calcular estadísticas
    const salesPointsWithStats = salesPoints.map(sp => {
      const stats = db.prepare(`
        SELECT
          COUNT(*) as total_products,
          SUM(quantity_assigned) as total_assigned,
          SUM(quantity_sold) as total_sold,
          SUM(quantity_assigned - quantity_sold) as total_pending,
          SUM(quantity_sold * price) as total_revenue,
          SUM((quantity_assigned - quantity_sold) * price) as total_expected
        FROM sales_point_inventory
        WHERE sales_point_id = ?
      `).get(sp.id);

      return {
        ...sp,
        stats: stats || {
          total_products: 0,
          total_assigned: 0,
          total_sold: 0,
          total_pending: 0,
          total_revenue: 0,
          total_expected: 0
        }
      };
    });

    res.json(salesPointsWithStats);
  } catch (error) {
    console.error('Error al listar puestos de venta:', error);
    res.status(500).json({ error: 'Error al obtener puestos de venta' });
  }
});

// Obtener un puesto de venta específico
router.get('/:id', [
  param('id').isInt()
], (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const salesPoint = db.prepare(`
      SELECT * FROM sales_points
      WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!salesPoint) {
      return res.status(404).json({ error: 'Puesto de venta no encontrado' });
    }

    // Obtener estadísticas
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_products,
        SUM(quantity_assigned) as total_assigned,
        SUM(quantity_sold) as total_sold,
        SUM(quantity_assigned - quantity_sold) as total_pending,
        SUM(quantity_sold * price) as total_revenue,
        SUM((quantity_assigned - quantity_sold) * price) as total_expected
      FROM sales_point_inventory
      WHERE sales_point_id = ?
    `).get(id);

    res.json({
      ...salesPoint,
      stats: stats || {
        total_products: 0,
        total_assigned: 0,
        total_sold: 0,
        total_pending: 0,
        total_revenue: 0,
        total_expected: 0
      }
    });
  } catch (error) {
    console.error('Error al obtener puesto de venta:', error);
    res.status(500).json({ error: 'Error al obtener puesto de venta' });
  }
});

// Crear puesto de venta
router.post('/', [
  body('name').notEmpty().trim(),
  body('location').optional().trim(),
  body('contact_name').optional().trim(),
  body('contact_phone').optional().trim(),
  body('notes').optional().trim()
], (req, res) => {
  try {
    const { name, location, contact_name, contact_phone, notes } = req.body;
    const userId = req.user.id;

    const result = db.prepare(`
      INSERT INTO sales_points (user_id, name, location, contact_name, contact_phone, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(userId, name, location || null, contact_name || null, contact_phone || null, notes || null);

    const newSalesPoint = db.prepare('SELECT * FROM sales_points WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(newSalesPoint);
  } catch (error) {
    console.error('Error al crear puesto de venta:', error);
    res.status(500).json({ error: 'Error al crear puesto de venta' });
  }
});

// Actualizar puesto de venta
router.put('/:id', [
  param('id').isInt(),
  body('name').optional().notEmpty().trim(),
  body('location').optional().trim(),
  body('contact_name').optional().trim(),
  body('contact_phone').optional().trim(),
  body('notes').optional().trim(),
  body('status').optional().isIn(['active', 'inactive'])
], (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, location, contact_name, contact_phone, notes, status } = req.body;

    // Verificar que el puesto pertenece al usuario
    const existing = db.prepare('SELECT id FROM sales_points WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Puesto de venta no encontrado' });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (contact_name !== undefined) {
      updates.push('contact_name = ?');
      params.push(contact_name);
    }
    if (contact_phone !== undefined) {
      updates.push('contact_phone = ?');
      params.push(contact_phone);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay cambios para actualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`
      UPDATE sales_points
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    const updated = db.prepare('SELECT * FROM sales_points WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar puesto de venta:', error);
    res.status(500).json({ error: 'Error al actualizar puesto de venta' });
  }
});

// Eliminar puesto de venta
router.delete('/:id', [
  param('id').isInt()
], (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = db.prepare('SELECT id FROM sales_points WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Puesto de venta no encontrado' });
    }

    db.prepare('DELETE FROM sales_points WHERE id = ?').run(id);
    res.json({ message: 'Puesto de venta eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar puesto de venta:', error);
    res.status(500).json({ error: 'Error al eliminar puesto de venta' });
  }
});

// ===== INVENTARIO DEL PUESTO =====

// Obtener inventario de un puesto de venta
router.get('/:id/inventory', [
  param('id').isInt()
], (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que el puesto pertenece al usuario
    const salesPoint = db.prepare('SELECT id FROM sales_points WHERE id = ? AND user_id = ?').get(id, userId);
    if (!salesPoint) {
      return res.status(404).json({ error: 'Puesto de venta no encontrado' });
    }

    const inventory = db.prepare(`
      SELECT
        spi.*,
        p.name as product_name,
        p.brand as product_brand,
        p.category as product_category,
        p.image_url as product_image,
        (spi.quantity_assigned - spi.quantity_sold) as quantity_pending,
        (spi.quantity_sold * spi.price) as revenue,
        ((spi.quantity_assigned - spi.quantity_sold) * spi.price) as expected_revenue
      FROM sales_point_inventory spi
      JOIN products p ON spi.product_id = p.id
      WHERE spi.sales_point_id = ?
      ORDER BY spi.assigned_at DESC
    `).all(id);

    res.json(inventory);
  } catch (error) {
    console.error('Error al obtener inventario del puesto:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// Agregar producto al inventario del puesto
router.post('/:id/inventory', [
  param('id').isInt(),
  body('product_id').isInt(),
  body('quantity').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 })
], (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, quantity, price } = req.body;
    const userId = req.user.id;

    // Verificar que el puesto pertenece al usuario
    const salesPoint = db.prepare('SELECT id FROM sales_points WHERE id = ? AND user_id = ?').get(id, userId);
    if (!salesPoint) {
      return res.status(404).json({ error: 'Puesto de venta no encontrado' });
    }

    // Verificar que el producto existe
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si ya existe este producto en el puesto
    const existing = db.prepare(`
      SELECT id, quantity_assigned FROM sales_point_inventory
      WHERE sales_point_id = ? AND product_id = ?
    `).get(id, product_id);

    if (existing) {
      // Si ya existe, sumar a la cantidad asignada
      db.prepare(`
        UPDATE sales_point_inventory
        SET quantity_assigned = quantity_assigned + ?,
            price = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(quantity, price, existing.id);

      const updated = db.prepare(`
        SELECT * FROM sales_point_inventory WHERE id = ?
      `).get(existing.id);

      return res.json(updated);
    } else {
      // Si no existe, crear nuevo registro
      const result = db.prepare(`
        INSERT INTO sales_point_inventory (sales_point_id, product_id, quantity_assigned, quantity_sold, price)
        VALUES (?, ?, ?, 0, ?)
      `).run(id, product_id, quantity, price);

      const newItem = db.prepare(`
        SELECT * FROM sales_point_inventory WHERE id = ?
      `).get(result.lastInsertRowid);

      return res.status(201).json(newItem);
    }
  } catch (error) {
    console.error('Error al agregar producto al puesto:', error);
    res.status(500).json({ error: 'Error al agregar producto' });
  }
});

// Actualizar cantidad vendida de un producto en el puesto
router.put('/:salesPointId/inventory/:itemId', [
  param('salesPointId').isInt(),
  param('itemId').isInt(),
  body('quantity_sold').isInt({ min: 0 })
], (req, res) => {
  try {
    const { salesPointId, itemId } = req.params;
    const { quantity_sold } = req.body;
    const userId = req.user.id;

    // Verificar que el puesto pertenece al usuario
    const salesPoint = db.prepare('SELECT id FROM sales_points WHERE id = ? AND user_id = ?').get(salesPointId, userId);
    if (!salesPoint) {
      return res.status(404).json({ error: 'Puesto de venta no encontrado' });
    }

    // Verificar que el item pertenece al puesto
    const item = db.prepare(`
      SELECT * FROM sales_point_inventory
      WHERE id = ? AND sales_point_id = ?
    `).get(itemId, salesPointId);

    if (!item) {
      return res.status(404).json({ error: 'Producto no encontrado en el puesto' });
    }

    // Verificar que quantity_sold no exceda quantity_assigned
    if (quantity_sold > item.quantity_assigned) {
      return res.status(400).json({
        error: `La cantidad vendida (${quantity_sold}) no puede ser mayor a la cantidad asignada (${item.quantity_assigned})`
      });
    }

    db.prepare(`
      UPDATE sales_point_inventory
      SET quantity_sold = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(quantity_sold, itemId);

    const updated = db.prepare(`
      SELECT * FROM sales_point_inventory WHERE id = ?
    `).get(itemId);

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar cantidad vendida:', error);
    res.status(500).json({ error: 'Error al actualizar cantidad vendida' });
  }
});

// Eliminar producto del inventario del puesto
router.delete('/:salesPointId/inventory/:itemId', [
  param('salesPointId').isInt(),
  param('itemId').isInt()
], (req, res) => {
  try {
    const { salesPointId, itemId } = req.params;
    const userId = req.user.id;

    // Verificar que el puesto pertenece al usuario
    const salesPoint = db.prepare('SELECT id FROM sales_points WHERE id = ? AND user_id = ?').get(salesPointId, userId);
    if (!salesPoint) {
      return res.status(404).json({ error: 'Puesto de venta no encontrado' });
    }

    // Verificar que el item pertenece al puesto
    const item = db.prepare(`
      SELECT id FROM sales_point_inventory
      WHERE id = ? AND sales_point_id = ?
    `).get(itemId, salesPointId);

    if (!item) {
      return res.status(404).json({ error: 'Producto no encontrado en el puesto' });
    }

    db.prepare('DELETE FROM sales_point_inventory WHERE id = ?').run(itemId);
    res.json({ message: 'Producto eliminado del puesto exitosamente' });
  } catch (error) {
    console.error('Error al eliminar producto del puesto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
