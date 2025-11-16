import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { initCronJobs } from './utils/cron.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import inventoryRoutes from './routes/inventory.js';
import ordersRoutes from './routes/orders.js';
import scrapingRoutes from './routes/scraping.js';
import settingsRoutes from './routes/settings.js';
import supplierOrdersRoutes from './routes/supplier-orders.js';
import salesPointsRoutes from './routes/sales-points.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir archivos estáticos (logos de marcas)
app.use('/brand-logos', express.static(path.join(__dirname, 'public', 'brand-logos')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/supplier-orders', supplierOrdersRoutes);
app.use('/api/sales-points', salesPointsRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API de Saphirus',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      inventory: '/api/inventory',
      orders: '/api/orders',
      scraping: '/api/scraping',
      settings: '/api/settings',
      supplierOrders: '/api/supplier-orders'
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Errores de Auth0/JWT
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Token inválido o expirado',
      message: err.message
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log('========================================\n');

  // Inicializar cron jobs para scraping automático
  initCronJobs();
});

export default app;
