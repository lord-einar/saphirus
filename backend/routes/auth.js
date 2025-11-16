import express from 'express';
import { checkJwt, ensureUser } from '../middleware/auth.js';

const router = express.Router();

// Obtener datos del usuario autenticado
router.get('/user', checkJwt, ensureUser, (req, res) => {
  try {
    const { id, email, name, notification_email, created_at } = req.user;
    res.json({
      id,
      email,
      name,
      notification_email,
      created_at
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
  }
});

export default router;
