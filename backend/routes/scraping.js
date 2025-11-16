import express from 'express';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import { runScraping } from '../services/scraper.js';
import db from '../database/db.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkJwt, ensureUser);

// Ejecutar scraping manual
router.post('/run', async (req, res) => {
  try {
    console.log(`Scraping manual iniciado por usuario ${req.user.email}`);

    // Ejecutar en background para no bloquear la respuesta
    runScraping().catch(error => {
      console.error('Error en scraping:', error);
    });

    res.json({
      message: 'Scraping iniciado. Revisa los logs para ver el progreso.',
      status: 'running'
    });
  } catch (error) {
    console.error('Error al iniciar scraping:', error);
    res.status(500).json({ error: 'Error al iniciar scraping' });
  }
});

// Obtener historial de scraping
router.get('/logs', (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const logs = db.prepare(`
      SELECT * FROM scraping_logs
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    const { total } = db.prepare('SELECT COUNT(*) as total FROM scraping_logs').get();

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error al obtener logs de scraping:', error);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
});

// Obtener último scraping
router.get('/latest', (req, res) => {
  try {
    const latestLog = db.prepare(`
      SELECT * FROM scraping_logs
      ORDER BY created_at DESC
      LIMIT 1
    `).get();

    if (!latestLog) {
      return res.json({ message: 'No hay logs de scraping' });
    }

    res.json(latestLog);
  } catch (error) {
    console.error('Error al obtener último log:', error);
    res.status(500).json({ error: 'Error al obtener último log' });
  }
});

export default router;
