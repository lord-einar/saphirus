# Saphirus - Sistema de Venta de Productos

Sistema completo de ecommerce con scraping automático de productos desde saphirus.com.ar, gestión de inventario, pedidos y dashboard de vendedor.

## Stack Tecnológico

### Backend
- Node.js + Express
- SQLite (base de datos)
- Cheerio (web scraping)
- Auth0 (autenticación)
- Nodemailer (emails)
- node-cron (tareas programadas)

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Auth0 React SDK
- Axios

## Características

### Para Clientes
- ✅ Catálogo de productos con filtros por marca y categoría
- ✅ Búsqueda de productos
- ✅ Carrito de compras persistente
- ✅ Proceso de checkout simple
- ✅ Diseño responsive

### Para Vendedores
- ✅ Dashboard con estadísticas
- ✅ Gestión de inventario
- ✅ Gestión de pedidos
- ✅ Notificaciones por email
- ✅ Scraping automático diario
- ✅ Detección de productos nuevos
- ✅ Control de scraping manual

### Scraping
- ✅ Scraping automático cada 24 horas (3:00 AM)
- ✅ Detección automática de número de páginas
- ✅ Extracción de: nombre, marca, categoría, precio, imagen, URL
- ✅ Detección de productos nuevos
- ✅ Detección de productos dados de baja
- ✅ Logs detallados de cada scraping

## Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Cuenta de Auth0
- Cuenta de Gmail con contraseña de aplicación

## Instalación

### 1. Clonar el repositorio

```bash
cd Saphirus
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
PORT=3000
DATABASE_PATH=./database.sqlite
AUTH0_DOMAIN=tu-domain.auth0.com
AUTH0_AUDIENCE=tu-api-identifier
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Inicializar la base de datos:

```bash
npm run init-db
```

### 3. Configurar Frontend

```bash
cd ../frontend
npm install
```

Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Auth0:

```env
VITE_API_URL=http://localhost:3000
VITE_AUTH0_DOMAIN=tu-domain.auth0.com
VITE_AUTH0_CLIENT_ID=tu-client-id
VITE_AUTH0_AUDIENCE=tu-api-identifier
```

## Configuración de Auth0

### 1. Crear cuenta y aplicación

1. Ve a [auth0.com](https://auth0.com) y crea una cuenta
2. Crea una nueva aplicación (Single Page Application)
3. Crea una nueva API

### 2. Configurar la aplicación

En la configuración de tu aplicación de Auth0:

**Allowed Callback URLs:**
```
http://localhost:5173, https://tu-dominio.com
```

**Allowed Logout URLs:**
```
http://localhost:5173, https://tu-dominio.com
```

**Allowed Web Origins:**
```
http://localhost:5173, https://tu-dominio.com
```

### 3. Habilitar Google Login

1. En Auth0, ve a Authentication > Social
2. Habilita Google
3. Configura con tus credenciales de Google Console

### 4. Obtener credenciales

- **Domain:** `tu-domain.auth0.com` (visible en tu dashboard)
- **Client ID:** En la configuración de tu aplicación
- **Audience:** El identifier de tu API

## Configuración de Gmail

Para enviar emails, necesitas una contraseña de aplicación de Gmail:

1. Ve a tu cuenta de Google
2. Habilita la verificación en 2 pasos
3. Ve a Seguridad > Contraseñas de aplicación
4. Genera una nueva contraseña para "Correo"
5. Usa esa contraseña en `GMAIL_APP_PASSWORD`

## Uso en Desarrollo

### Iniciar Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Iniciar Frontend

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Comandos Disponibles

### Backend

- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en desarrollo con nodemon
- `npm run init-db` - Inicializa/resetea la base de datos

### Frontend

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run preview` - Previsualiza el build de producción

## Estructura del Proyecto

```
Saphirus/
├── backend/
│   ├── database/
│   │   ├── db.js
│   │   ├── init.js
│   │   └── schema.sql
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── inventory.js
│   │   ├── orders.js
│   │   ├── scraping.js
│   │   └── settings.js
│   ├── services/
│   │   ├── scraper.js
│   │   └── email.js
│   ├── utils/
│   │   └── cron.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductFilter.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── OrderForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── NewProducts.jsx
│   │   │   ├── ScrapingDashboard.jsx
│   │   │   └── Settings.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
│
└── README.md
```

## API Endpoints

### Autenticación

- `GET /api/auth/user` - Obtener usuario autenticado (requiere auth)

### Productos

- `GET /api/products` - Listar productos (con filtros opcionales)
- `GET /api/products/:id` - Detalle de producto
- `GET /api/products/brands` - Listar marcas
- `GET /api/products/categories` - Listar categorías
- `GET /api/products/new` - Productos nuevos (requiere auth)
- `GET /api/products/removed` - Productos dados de baja (requiere auth)

### Inventario

- `GET /api/inventory` - Obtener inventario (requiere auth)
- `POST /api/inventory/:productId` - Agregar producto al inventario (requiere auth)
- `PUT /api/inventory/:productId` - Actualizar stock (requiere auth)
- `DELETE /api/inventory/:productId` - Eliminar del inventario (requiere auth)

### Pedidos

- `POST /api/orders` - Crear pedido (público)
- `GET /api/orders` - Listar pedidos (requiere auth)
- `GET /api/orders/:id` - Detalle de pedido (requiere auth)
- `PUT /api/orders/:id/items/:itemId` - Actualizar estado de item (requiere auth)
- `PUT /api/orders/:id/complete` - Completar pedido (requiere auth)
- `PUT /api/orders/:id/cancel` - Cancelar pedido (requiere auth)

### Scraping

- `POST /api/scraping/run` - Ejecutar scraping manual (requiere auth)
- `GET /api/scraping/logs` - Historial de scraping (requiere auth)
- `GET /api/scraping/latest` - Último scraping (requiere auth)

### Configuración

- `GET /api/settings` - Obtener configuración (requiere auth)
- `PUT /api/settings/email` - Actualizar email de notificaciones (requiere auth)

## Flujo de Pedidos

1. **Cliente realiza pedido:**
   - Agrega productos al carrito
   - Completa formulario con datos de contacto
   - Confirma pedido

2. **Sistema procesa:**
   - Guarda pedido en base de datos con status "pending"
   - Envía email al vendedor con detalles del pedido

3. **Vendedor gestiona:**
   - Ve el pedido en el dashboard
   - Marca cada producto como:
     - ✓ Vendido (descuenta del inventario)
     - ✗ No vendido (no afecta inventario)
     - 🔄 Reemplazado (descuenta producto nuevo, suma el original)
   - Marca el pedido como completado

## Scraping Automático

El scraping se ejecuta automáticamente todos los días a las 3:00 AM.

### Configuración del horario

Editar en `backend/utils/cron.js`:

```javascript
// Cambiar el horario (formato cron)
cron.schedule('0 3 * * *', async () => {
  // 0 3 * * * = 3:00 AM todos los días
  // */5 * * * * = cada 5 minutos (para testing)
});
```

### Funcionalidades del scraping

- Detecta automáticamente el número de páginas
- Extrae productos con todos sus datos
- Identifica productos nuevos (marca con flag `is_new`)
- Identifica productos dados de baja (marca con `is_active = 0`)
- Actualiza precios de productos existentes
- Genera logs detallados

## Deployment

### Backend (Railway/Render)

1. Crear nuevo proyecto en Railway o Render
2. Conectar repositorio
3. Configurar variables de entorno
4. Deploy automático

**Variables de entorno en producción:**
```env
PORT=3000
DATABASE_PATH=./database.sqlite
AUTH0_DOMAIN=tu-domain.auth0.com
AUTH0_AUDIENCE=tu-api-identifier
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Frontend (Vercel/Netlify)

1. Crear nuevo proyecto
2. Conectar repositorio
3. Configurar build:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Configurar variables de entorno
5. Deploy automático

**Variables de entorno en producción:**
```env
VITE_API_URL=https://tu-backend.railway.app
VITE_AUTH0_DOMAIN=tu-domain.auth0.com
VITE_AUTH0_CLIENT_ID=tu-client-id
VITE_AUTH0_AUDIENCE=tu-api-identifier
```

## Solución de Problemas

### Error de autenticación

- Verifica que las credenciales de Auth0 sean correctas
- Asegúrate de que las URLs de callback estén configuradas en Auth0
- Revisa que el `audience` coincida en frontend y backend

### Emails no se envían

- Verifica que tengas una contraseña de aplicación de Gmail (no tu contraseña normal)
- Asegúrate de que la verificación en 2 pasos esté habilitada
- Revisa los logs del servidor para ver errores específicos

### Scraping falla

- Verifica tu conexión a internet
- El sitio puede estar caído temporalmente
- Revisa los logs de scraping en el dashboard
- Prueba ejecutar scraping manual para ver el error

### Base de datos corrupta

Reinicializar la base de datos:

```bash
cd backend
rm database.sqlite
npm run init-db
```

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

MIT

## Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio.
