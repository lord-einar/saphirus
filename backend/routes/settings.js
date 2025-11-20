import express from 'express';
import { body } from 'express-validator';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import db from '../database/db-auto.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkJwt, ensureUser);

// Obtener configuración del usuario
router.get('/', (req, res) => {
  try {
    const { notification_email, email, name } = req.user;

    res.json({
      notification_email: notification_email || email,
      email,
      name
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Actualizar email de notificaciones
router.put('/email', [
  body('notification_email').isEmail()
], async (req, res) => {
  try {
    const { notification_email } = req.body;

    const update = db.prepare(`
      UPDATE users SET notification_email = ? WHERE id = ?
    `);

    await update.run(notification_email, req.user.id);

    res.json({
      message: 'Email de notificaciones actualizado',
      notification_email
    });
  } catch (error) {
    console.error('Error al actualizar email:', error);
    res.status(500).json({ error: 'Error al actualizar email' });
  }
});

export default router;
