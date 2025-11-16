# 🚀 Guía de Deployment - Saphirus

## 📋 Arquitectura de Deployment

- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Node.js + Express)
- **Base de Datos**: SQLite (en Railway)

---

## 🔧 Configuración de Railway (Backend)

### 1. Variables de Entorno Requeridas

Configura estas variables en Railway Dashboard → Project → Variables:

```bash
# Auth0
AUTH0_DOMAIN=teltrun.auth0.com
AUTH0_AUDIENCE=https://api.saphirus.com

# Email (Gmail)
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password-generado

# Base de Datos
DATABASE_PATH=/data/database.sqlite

# CORS
FRONTEND_URL=https://saphirus-livid.vercel.app

# Entorno
NODE_ENV=production
PORT=3000
```

### 2. Configuración del Proyecto

Railway detectará automáticamente `railway.json` que ya está en el repo:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 3. Persistencia de Base de Datos

⚠️ **IMPORTANTE**: SQLite en Railway necesita volumen persistente:

1. Ve a tu proyecto en Railway
2. Click en "Settings" → "Volumes"
3. Crear un volumen montado en `/data`
4. Asegúrate que `DATABASE_PATH=/data/database.sqlite`

**Alternativa**: Migrar a PostgreSQL (Railway ofrece PostgreSQL gratis)

### 4. Obtener la URL del Backend

Una vez deployado, Railway te dará una URL como:
```
https://tu-proyecto.up.railway.app
```

Copia esta URL para configurar Vercel.

---

## 🌐 Configuración de Vercel (Frontend)

### 1. Variables de Entorno Requeridas

Ve a Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# API Backend (Railway)
VITE_API_URL=https://tu-proyecto.up.railway.app

# Auth0
VITE_AUTH0_DOMAIN=teltrun.auth0.com
VITE_AUTH0_CLIENT_ID=47lLAFYR5N626d0RZc63saQ0q12E7Kin
VITE_AUTH0_AUDIENCE=https://api.saphirus.com
```

⚠️ **CRÍTICO**: Cambia `VITE_API_URL` de `http://localhost:3000` a tu URL de Railway.

### 2. Configuración del Build

Vercel usará automáticamente `vercel.json`:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Esto soluciona el error 404 en rutas como `/productos`.

### 3. Re-deploy

Después de configurar las variables de entorno:

1. Ve a Deployments
2. Click en los 3 puntos del último deployment
3. Click "Redeploy"

---

## 🔐 Configuración de Auth0

### 1. Allowed Callback URLs

Agregar en Auth0 Dashboard → Applications → Settings:

```
http://localhost:5173/,
https://saphirus-livid.vercel.app/
```

### 2. Allowed Logout URLs

```
http://localhost:5173/,
https://saphirus-livid.vercel.app/
```

### 3. Allowed Web Origins

```
http://localhost:5173,
https://saphirus-livid.vercel.app
```

### 4. Application URIs

Configurar el Application Login URI:
```
https://saphirus-livid.vercel.app
```

---

## 🧪 Testing del Deployment

### 1. Verificar Backend (Railway)

```bash
# Health check
curl https://tu-proyecto.up.railway.app/api/products

# Debe devolver JSON con productos
```

### 2. Verificar Frontend (Vercel)

1. ✅ Abrir https://saphirus-livid.vercel.app/
2. ✅ Navegar a /productos (no debe dar 404)
3. ✅ Hacer login con Auth0
4. ✅ Verificar que carguen productos desde Railway

### 3. Verificar CORS

Abrir DevTools → Console en Vercel:
- ❌ Si ves errores CORS → Revisar `FRONTEND_URL` en Railway
- ✅ No debe haber errores CORS

---

## 🐛 Troubleshooting

### Error 404 en rutas (ej: /productos)

**Causa**: Vercel no sabe que es una SPA
**Solución**: Usar `vercel.json` con rewrites (ya incluido)

### Frontend no carga productos

**Causa**: `VITE_API_URL` apunta a localhost
**Solución**:
1. Cambiar a URL de Railway en Vercel env vars
2. Redeploy

### Error CORS

**Causa**: Backend no permite origen de Vercel
**Solución**:
1. Configurar `FRONTEND_URL` en Railway
2. Verificar en `backend/server.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Base de datos vacía en Railway

**Causa**: SQLite se resetea sin volumen persistente
**Solución**:
1. Crear volumen en Railway montado en `/data`
2. O migrar a PostgreSQL

### Auth0 "Callback URL mismatch"

**Causa**: URLs no configuradas en Auth0
**Solución**: Agregar URLs de Vercel en Auth0 Dashboard

---

## 📝 Checklist de Deployment

### Backend (Railway)
- [ ] Proyecto creado y conectado al repo GitHub
- [ ] Variables de entorno configuradas
- [ ] `railway.json` en el repo
- [ ] Volumen persistente creado para SQLite
- [ ] Backend funcionando (hacer curl de prueba)
- [ ] Copiar URL del backend

### Frontend (Vercel)
- [ ] Proyecto creado y conectado al repo GitHub
- [ ] Variables de entorno configuradas (especialmente `VITE_API_URL`)
- [ ] `vercel.json` en el repo
- [ ] Build exitoso
- [ ] Rutas funcionando sin 404
- [ ] Productos cargando desde backend

### Auth0
- [ ] Callback URLs actualizadas
- [ ] Logout URLs actualizadas
- [ ] Web Origins actualizadas
- [ ] Login funciona correctamente

---

## 🔄 Flujo de Deploy Completo

```
1. Push código a GitHub
   ↓
2. Railway detecta cambios → Build automático del backend
   ↓
3. Vercel detecta cambios → Build automático del frontend
   ↓
4. Usuario accede a Vercel → Frontend llama a Railway → Todo funciona ✅
```

---

## 💡 Tips de Producción

### Performance
- ✅ Vite ya hace tree-shaking y minificación
- ✅ Railway maneja caching de `node_modules`
- 💡 Considera CDN para assets estáticos

### Seguridad
- ✅ HTTPS automático en Vercel y Railway
- ✅ Variables de entorno seguras (no en código)
- ✅ CORS configurado correctamente
- ⚠️ Lista blanca de emails en `backend/middleware/auth.js`

### Monitoreo
- 📊 Vercel Analytics (gratis)
- 📊 Railway Logs en Dashboard
- 📧 Notificaciones de error vía Gmail (ya configurado)

---

## 🆘 Soporte

Si algo no funciona:

1. **Revisar logs**:
   - Railway: Dashboard → Deployments → View Logs
   - Vercel: Dashboard → Deployments → Function Logs

2. **Verificar variables de entorno**:
   - Railway: Settings → Variables
   - Vercel: Settings → Environment Variables

3. **Hacer rollback si es necesario**:
   - Railway: Redeploy deployment anterior
   - Vercel: Redeploy deployment anterior

---

**Deployment configurado correctamente.** 🎉
