# Inicio Rápido - Saphirus

Guía para empezar a usar la aplicación en **menos de 5 minutos**.

## ✅ Lo que ya está listo

- ✅ Backend configurado y corriendo en http://localhost:3000
- ✅ Base de datos inicializada
- ✅ Estructura completa del proyecto
- ⚠️ Email deshabilitado (opcional)
- ⚠️ Auth0 sin configurar (necesario para vendedor)

## 🚀 Probar la Aplicación SIN configurar nada

### 1. Iniciar el Frontend

Abre una **nueva terminal** y ejecuta:

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará en: **http://localhost:5173**

### 2. ¿Qué funciona sin configurar Auth0?

**✅ Funciona:**
- Ver catálogo de productos (cuando hagas el primer scraping)
- Agregar productos al carrito
- Ver carrito
- Proceso de checkout (crear pedidos)
- Búsqueda y filtros de productos

**❌ NO funciona (requiere Auth0):**
- Login del vendedor
- Dashboard del vendedor
- Gestión de inventario
- Ver pedidos
- Configuración

### 3. Tu Primera Prueba

1. Abre http://localhost:5173
2. Click en **"Productos"**
3. Verás que no hay productos aún

### 4. Hacer tu Primer Scraping

**Terminal del backend** (la que ya está corriendo), presiona `Ctrl+C` para detener.

Ejecuta el scraping manualmente:

```bash
cd backend
node -e "import('./services/scraper.js').then(m => m.runScraping())"
```

Esto tardará **2-3 minutos** y extraerá todos los productos de saphirus.com.ar.

Luego reinicia el backend:

```bash
npm run dev
```

**Ahora sí** deberías ver productos en el frontend! 🎉

### 5. Probar el Flujo de Compra

1. Ve a **"Productos"**
2. Agrega productos al carrito
3. Ve a **"Carrito"**
4. Click en **"Finalizar compra"**
5. Completa el formulario
6. Confirma el pedido

El pedido se guardará en la base de datos, pero **no recibirás email** (porque no configuraste Gmail).

## 🔐 Configurar Auth0 (Requerido para el Dashboard)

Si quieres usar el dashboard del vendedor:

1. **Lee:** [AUTH0_SETUP.md](./AUTH0_SETUP.md)
2. Sigue los pasos (toma ~10 minutos)
3. Edita `backend/.env` y `frontend/.env` con tus credenciales
4. Reinicia ambos servidores

## 📧 Configurar Gmail (Opcional)

Si quieres recibir emails de pedidos:

1. **Lee:** [GMAIL_SETUP.md](./GMAIL_SETUP.md)
2. Genera una contraseña de aplicación
3. Edita `backend/.env`
4. Reinicia el backend

## 📊 Scraping Automático

El scraping se ejecuta automáticamente **todos los días a las 3:00 AM**.

Para cambiarlo, edita `backend/utils/cron.js`:

```javascript
// Cada 5 minutos (para testing)
cron.schedule('*/5 * * * *', async () => {
  await runScraping();
});

// Cada día a las 3 AM (producción)
cron.schedule('0 3 * * *', async () => {
  await runScraping();
});
```

## 🛠️ Comandos Útiles

### Ver la base de datos

```bash
cd backend
sqlite3 database.sqlite
```

Comandos SQLite:
```sql
-- Ver todos los productos
SELECT * FROM products LIMIT 10;

-- Ver pedidos
SELECT * FROM orders;

-- Ver logs de scraping
SELECT * FROM scraping_logs;

-- Salir
.quit
```

### Resetear la base de datos

```bash
cd backend
rm database.sqlite
npm run init-db
```

### Ejecutar scraping manualmente (desde código)

```javascript
// backend/test-scraping.js
import { runScraping } from './services/scraper.js';
await runScraping();
```

```bash
node backend/test-scraping.js
```

## 📁 Estructura de Archivos Importantes

```
backend/
├── .env              ← Configuración (credenciales)
├── database.sqlite   ← Base de datos (auto-generada)
├── server.js         ← Servidor principal
└── services/
    └── scraper.js    ← Lógica de scraping

frontend/
├── .env              ← Configuración del frontend
└── src/
    ├── pages/        ← Páginas de la app
    └── components/   ← Componentes reutilizables
```

## 🐛 Problemas Comunes

### "Error: Cannot find module"
```bash
cd backend
npm install

cd ../frontend
npm install
```

### Los productos no aparecen
- Verifica que el backend esté corriendo
- Haz un scraping manual primero
- Revisa la consola del navegador (F12)

### "Network Error" en el frontend
- Verifica que el backend esté corriendo en el puerto 3000
- Revisa `frontend/.env` → `VITE_API_URL=http://localhost:3000`

### El login no funciona
- Necesitas configurar Auth0 (ver AUTH0_SETUP.md)
- O usa la app sin login (solo como cliente)

## 🎯 Próximos Pasos

1. ✅ Haz un scraping para tener productos
2. ✅ Prueba el flujo de compra como cliente
3. ⚠️ Configura Auth0 para acceder al dashboard
4. ⚠️ (Opcional) Configura Gmail para emails
5. 🚀 Personaliza la app según tus necesidades

## 💡 Tips

- El carrito se guarda en `localStorage` (persiste al cerrar el navegador)
- Puedes ejecutar múltiples scrapings sin problemas
- La base de datos es un archivo SQLite simple
- Todos los logs están en la consola del backend

## 🆘 ¿Necesitas Ayuda?

- Lee el [README.md](./README.md) completo
- Revisa [AUTH0_SETUP.md](./AUTH0_SETUP.md)
- Revisa [GMAIL_SETUP.md](./GMAIL_SETUP.md)
- Verifica los logs de la consola

¡Disfruta usando Saphirus! 🎉
