# Configuración de Auth0 para Saphirus

Esta guía te ayudará a configurar Auth0 paso a paso para que funcione con la aplicación Saphirus.

## Paso 1: Crear Cuenta en Auth0

1. Ve a https://auth0.com
2. Click en "Sign Up"
3. Completa el registro (es gratis para desarrollo)
4. Selecciona tu región (elige la más cercana a tu ubicación)

## Paso 2: Crear una Aplicación (Single Page Application)

1. En el dashboard de Auth0, ve a **Applications** → **Applications**
2. Click en **Create Application**
3. Nombre: `Saphirus Frontend` (o el que prefieras)
4. Tipo: **Single Page Web Applications**
5. Click en **Create**

### Configurar la Aplicación

En la pestaña **Settings**:

1. **Allowed Callback URLs:**
   ```
   http://localhost:5173, http://localhost:5173/callback
   ```

2. **Allowed Logout URLs:**
   ```
   http://localhost:5173
   ```

3. **Allowed Web Origins:**
   ```
   http://localhost:5173
   ```

4. Scroll abajo y click en **Save Changes**

### Obtener Credenciales

Copia estos valores (los necesitarás después):

- **Domain:** `tu-tenant.us.auth0.com` o similar
- **Client ID:** Una cadena larga alfanumérica

## Paso 3: Crear una API

1. En el dashboard, ve a **Applications** → **APIs**
2. Click en **Create API**
3. Configuración:
   - **Name:** `Saphirus API`
   - **Identifier:** `https://saphirus-api` (puede ser cualquier URL, no necesita existir)
   - **Signing Algorithm:** RS256
4. Click en **Create**

### Obtener Audience

- **Identifier/Audience:** Lo que pusiste arriba (ej: `https://saphirus-api`)

## Paso 4: Habilitar Google Login

1. Ve a **Authentication** → **Social**
2. Busca **Google** en la lista
3. Click en el toggle para habilitarlo
4. Auth0 te dará dos opciones:

### Opción A: Usar credenciales de Auth0 (Más Fácil)
- Solo haz click en el toggle y listo
- Auth0 usa sus propias credenciales de Google
- **Recomendado para desarrollo**

### Opción B: Usar tus propias credenciales de Google
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. Agrega las URIs de redirección de Auth0
6. Copia Client ID y Client Secret a Auth0

**Para desarrollo, usa la Opción A.**

## Paso 5: Configurar el Backend

Edita `backend/.env`:

```env
AUTH0_DOMAIN=tu-tenant.us.auth0.com
AUTH0_AUDIENCE=https://saphirus-api
```

Reemplaza con tus valores reales.

## Paso 6: Configurar el Frontend

Edita `frontend/.env`:

```env
VITE_AUTH0_DOMAIN=tu-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=tu-client-id-del-paso-2
VITE_AUTH0_AUDIENCE=https://saphirus-api
```

## Paso 7: Probar la Configuración

1. Inicia el backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Inicia el frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Abre http://localhost:5173
4. Click en "Iniciar sesión"
5. Deberías ver la pantalla de login de Auth0
6. Selecciona "Continue with Google"

## Configuración para Producción

Cuando despliegues a producción:

### En Auth0:

Actualiza las URLs en la configuración de la aplicación:

**Allowed Callback URLs:**
```
https://tu-dominio.com, https://tu-dominio.com/callback
```

**Allowed Logout URLs:**
```
https://tu-dominio.com
```

**Allowed Web Origins:**
```
https://tu-dominio.com
```

### En tus archivos .env:

Actualiza las URLs del frontend en producción.

## Solución de Problemas

### Error: "Callback URL mismatch"
- Verifica que `http://localhost:5173` esté en **Allowed Callback URLs**
- Asegúrate de haber guardado los cambios en Auth0

### Error: "Invalid audience"
- Verifica que el `AUDIENCE` sea el mismo en backend y frontend
- Debe coincidir con el Identifier de tu API en Auth0

### El login no muestra Google
- Verifica que Google esté habilitado en **Authentication** → **Social**
- Espera 1-2 minutos después de habilitarlo

### Error: "Missing domain or client ID"
- Verifica que todos los valores en `.env` estén sin comillas
- Reinicia el servidor después de editar `.env`

## Testing sin Auth0

Si quieres probar la app sin autenticación:

1. Comenta las rutas protegidas temporalmente
2. O crea una cuenta Auth0 de prueba (es gratis)
3. Auth0 ofrece un tier gratuito generoso para desarrollo

## Recursos Adicionales

- [Documentación de Auth0](https://auth0.com/docs)
- [Auth0 React SDK](https://auth0.com/docs/quickstart/spa/react)
- [Auth0 Node.js API](https://auth0.com/docs/quickstart/backend/nodejs)
