import express from 'express';
import { body, param } from 'express-validator';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import { sendNewOrderEmail } from '../services/email.js';
import db from '../database/db-auto.js';

const router = express.Router();

// Crear nuevo pedido (público - no requiere autenticación)
router.post('/', [
  body('customer_name').notEmpty().trim(),
  body('customer_lastname').notEmpty().trim(),
  body('customer_phone').notEmpty().trim(),
  body('customer_notes').optional().trim(),
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isInt(),
  body('items.*.quantity').isInt({ min: 1 })
], async (req, res) => {
  try {
    const { customer_name, customer_lastname, customer_phone, customer_notes, items } = req.body;

    // Validar que todos los productos existen y obtener sus precios
    const validatedItems = [];
    for (const item of items) {
      const product = await db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.product_id);
      if (!product) {
        return res.status(400).json({ error: `Producto con ID ${item.product_id} no encontrado` });
      }
      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
        product_name: product.name,
        brand: product.brand
      });
    }

    // Insertar pedido
    const insertOrder = db.prepare(`
      INSERT INTO orders (customer_name, customer_lastname, customer_phone, customer_notes)
      VALUES (?, ?, ?, ?)
    `);

    const orderResult = await insertOrder.run(customer_name, customer_lastname, customer_phone, customer_notes || null);
    const orderId = orderResult.lastInsertRowid;

    // Insertar items del pedido
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of validatedItems) {
      await insertItem.run(orderId, item.product_id, item.quantity, item.price);
    }

    // Obtener el pedido completo para enviar email
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    // Enviar email al vendedor (obtener email del primer usuario registrado por ahora)
    // En producción, podrías tener múltiples vendedores o un email configurado
    const vendedor = await db.prepare('SELECT notification_email FROM users ORDER BY id ASC LIMIT 1').get();

    if (vendedor && vendedor.notification_email) {
      await sendNewOrderEmail({ order, items: validatedItems }, vendedor.notification_email);
    }

    res.status(201).json({
      message: 'Pedido creado correctamente',
      order_id: orderId,
      order
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

// Listar pedidos (requiere autenticación de vendedor)
router.get('/', checkJwt, ensureUser, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM orders';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = await db.prepare(sql).all(...params);

    // Obtener total de pedidos
    let countSql = 'SELECT COUNT(*) as total FROM orders';
    if (status) {
      countSql += ' WHERE status = ?';
    }

    const { total } = await db.prepare(countSql).get(...(status ? [status] : []));

    res.json({
      orders,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// Obtener detalle de un pedido
router.get('/:id', checkJwt, ensureUser, [
  param('id').isInt()
], async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Obtener items del pedido con información del producto
    const items = await db.prepare(`
      SELECT
        oi.*,
        p.name as product_name,
        p.brand,
        p.image_url,
        rp.name as replaced_product_name
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      LEFT JOIN products rp ON oi.replaced_with_product_id = rp.id
      WHERE oi.order_id = ?
    `).all(id);

    res.json({
      ...order,
      items
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

// Actualizar estado de un item del pedido
router.put('/:id/items/:itemId', checkJwt, ensureUser, [
  param('id').isInt(),
  param('itemId').isInt(),
  body('status').isIn(['pending', 'sold', 'not_sold', 'replaced']),
  body('replaced_with_product_id').optional().isInt()
], async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { status, replaced_with_product_id } = req.body;

    // Verificar que el pedido existe
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Verificar que el item existe
    const item = await db.prepare('SELECT * FROM order_items WHERE id = ? AND order_id = ?').get(itemId, id);
    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // Si es reemplazo, validar el producto de reemplazo
    if (status === 'replaced' && !replaced_with_product_id) {
      return res.status(400).json({ error: 'Debe especificar el producto de reemplazo' });
    }

    // Actualizar item
    const updateItem = db.prepare(`
      UPDATE order_items
      SET status = ?, replaced_with_product_id = ?
      WHERE id = ?
    `);

    await updateItem.run(status, replaced_with_product_id || null, itemId);

    // Si se vendió o reemplazó, actualizar inventario
    if (status === 'sold') {
      // Descontar del inventario original
      await db.prepare(`
        UPDATE inventory
        SET stock = stock - ?
        WHERE product_id = ? AND user_id = ?
      `).run(item.quantity, item.product_id, req.user.id);
    } else if (status === 'replaced' && replaced_with_product_id) {
      // Descontar del inventario del producto de reemplazo
      await db.prepare(`
        UPDATE inventory
        SET stock = stock - ?
        WHERE product_id = ? AND user_id = ?
      `).run(item.quantity, replaced_with_product_id, req.user.id);

      // Reestablecer stock del producto original (si se había descontado)
      if (item.status === 'sold') {
        await db.prepare(`
          UPDATE inventory
          SET stock = stock + ?
          WHERE product_id = ? AND user_id = ?
        `).run(item.quantity, item.product_id, req.user.id);
      }
    }

    // Actualizar timestamp del pedido
    await db.prepare('UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    res.json({ message: 'Item actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar item:', error);
    res.status(500).json({ error: 'Error al actualizar item' });
  }
});

// Marcar pedido como completado
router.put('/:id/complete', checkJwt, ensureUser, [
  param('id').isInt()
], async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const update = db.prepare(`
      UPDATE orders
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    await update.run(id);

    res.json({ message: 'Pedido marcado como completado' });
  } catch (error) {
    console.error('Error al completar pedido:', error);
    res.status(500).json({ error: 'Error al completar pedido' });
  }
});

// Cancelar pedido
router.put('/:id/cancel', checkJwt, ensureUser, [
  param('id').isInt()
], async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const update = db.prepare(`
      UPDATE orders
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    await update.run(id);

    res.json({ message: 'Pedido cancelado' });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ error: 'Error al cancelar pedido' });
  }
});

export default router;
