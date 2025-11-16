# 🔐 Sistema de Control de Acceso - Saphirus

## ✅ Implementación Completada

El sistema ahora solo permite acceso a usuarios con correos específicos autorizados.

---

## 📧 **EMAILS AUTORIZADOS**

Solo estos correos pueden acceder al sistema:

1. **marisojeda50@gmail.com**
2. **germanojeda83@gmail.com**

Cualquier otro correo será **rechazado automáticamente**.

---

## 🛡️ **CÓMO FUNCIONA**

### Backend (Seguridad)

**Archivo:** `/backend/middleware/auth.js`

```javascript
// Lista blanca de emails autorizados
const ALLOWED_EMAILS = [
  'marisojeda50@gmail.com',
  'germanojeda83@gmail.com'
];
```

**Proceso:**
1. Usuario hace login con Auth0
2. Auth0 valida credenciales (Google OAuth)
3. Backend recibe token JWT
4. Middleware extrae el email del token
5. **Verifica si está en la lista blanca**
6. Si NO está autorizado → Error 403 (Acceso Denegado)
7. Si SÍ está autorizado → Continúa normalmente

**Logs de Seguridad:**
```bash
# Cuando alguien no autorizado intenta acceder:
⚠️  Intento de acceso no autorizado: usuario@ejemplo.com
```

### Frontend (UX)

**Archivo:** `/frontend/src/pages/AccessDenied.jsx`

Cuando un usuario no autorizado intenta acceder, ve:
- ❌ Página de "Acceso Denegado"
- 🚫 Icono visual claro
- ℹ️ Mensaje explicativo
- 📧 Email con el que intentó acceder
- 🔘 Botón para cerrar sesión
- ✉️ Botón para contactar administrador

---

## 🔄 **FLUJO COMPLETO**

### Usuario Autorizado
```
1. Entra a la app
2. Click en "Iniciar Sesión"
3. Login con Google (marisojeda50@gmail.com)
4. Auth0 valida ✓
5. Backend verifica email ✓
6. ✅ Accede al Dashboard
```

### Usuario NO Autorizado
```
1. Entra a la app
2. Click en "Iniciar Sesión"
3. Login con Google (otro-email@gmail.com)
4. Auth0 valida ✓
5. Backend verifica email ✗
6. ❌ Ve página "Acceso Denegado"
7. Opciones:
   - Cerrar sesión
   - Contactar administrador
```

---

## 📁 **ARCHIVOS MODIFICADOS**

### Backend
✅ `/backend/middleware/auth.js`
- Agregada lista `ALLOWED_EMAILS`
- Función `isEmailAuthorized()`
- Verificación en middleware `ensureUser`
- Response 403 si no autorizado
- Logging de intentos no autorizados

### Frontend
✅ `/frontend/src/pages/AccessDenied.jsx` (NUEVO)
- Página de acceso denegado

✅ `/frontend/src/context/AuthContext.jsx`
- Estado `accessDenied`
- Callback para detectar 403

✅ `/frontend/src/utils/api.js`
- Interceptor `setupAccessDeniedInterceptor()`
- Detecta errores 403

✅ `/frontend/src/App.jsx`
- Muestra `<AccessDenied />` si `accessDenied === true`

---

## 🔧 **CÓMO AGREGAR/QUITAR EMAILS**

### Agregar nuevo email autorizado:

**Archivo:** `/backend/middleware/auth.js` (línea 8)

```javascript
const ALLOWED_EMAILS = [
  'marisojeda50@gmail.com',
  'germanojeda83@gmail.com',
  'nuevo-email@gmail.com'  // ← Agregar aquí
];
```

### Quitar email:

Simplemente eliminar la línea correspondiente del array.

**IMPORTANTE:**
- ⚠️ Reiniciar el servidor backend después de cambiar la lista
- ✅ No se requiere cambios en frontend
- ✅ No se requiere cambios en base de datos

---

## 🧪 **TESTING**

### Test 1: Email Autorizado
```bash
1. Ir a http://localhost:5173
2. Login con marisojeda50@gmail.com o germanojeda83@gmail.com
3. ✅ Debe acceder al dashboard normalmente
```

### Test 2: Email NO Autorizado
```bash
1. Ir a http://localhost:5173
2. Login con otro email (ej: test@gmail.com)
3. ❌ Debe ver página "Acceso Denegado"
4. ✅ Debe poder cerrar sesión
5. ✅ Debe poder contactar administrador
```

### Test 3: Verificar Logs
```bash
# En la consola del backend verás:
⚠️  Intento de acceso no autorizado: test@gmail.com
```

---

## 🚀 **DEPLOYMENT**

### Variables de Entorno
No se requieren nuevas variables de entorno.

### Proceso de Deploy

1. **Backend:**
```bash
cd backend
# Los cambios en auth.js ya están listos
npm start
```

2. **Frontend:**
```bash
cd frontend
# Los componentes nuevos se compilarán automáticamente
npm run build
```

### Verificación Post-Deploy
1. Probar login con email autorizado
2. Probar login con email NO autorizado
3. Verificar logs del servidor

---

## 🔒 **SEGURIDAD**

### Buenas Prácticas Implementadas:
✅ **Whitelist en Backend** - La validación está en el servidor (no se puede bypasear)
✅ **Logging de Intentos** - Se registran todos los intentos no autorizados
✅ **UX Clara** - El usuario sabe exactamente por qué no puede acceder
✅ **Case Insensitive** - `MARIA@GMAIL.COM` = `maria@gmail.com`
✅ **Trim Automático** - Ignora espacios en blanco

### Lo que NO hace (y por qué está bien):
❌ No bloquea IPs - Auth0 ya maneja rate limiting
❌ No usa CAPTCHA - Auth0 ya tiene protección anti-bot
❌ No envía emails automáticos - Evita spam

---

## 📞 **SOPORTE**

### Si un usuario no autorizado necesita acceso:

1. **Usuario contacta a:**
   - marisojeda50@gmail.com
   - germanojeda83@gmail.com

2. **Administrador evalúa la solicitud**

3. **Si se aprueba:**
   - Agregar email a `ALLOWED_EMAILS` en `/backend/middleware/auth.js`
   - Reiniciar servidor backend
   - ✅ Usuario ya puede acceder

4. **Si se rechaza:**
   - El usuario queda sin acceso permanentemente

---

## 🎨 **DISEÑO DE LA PÁGINA DE ACCESO DENEGADO**

```
┌──────────────────────────────────────────┐
│                                          │
│              🚫 [Icono grande]           │
│                                          │
│         Acceso Denegado                  │
│                                          │
│   Tu cuenta no tiene permisos para       │
│   acceder a este sistema.                │
│                                          │
│   ┌────────────────────────────────┐    │
│   │ Email utilizado:                │    │
│   │ usuario@ejemplo.com             │    │
│   └────────────────────────────────┘    │
│                                          │
│   ℹ️ ¿Necesitas acceso?                  │
│   Contacta al administrador para         │
│   solicitar autorización.                │
│                                          │
│   [ Cerrar Sesión ]                      │
│   [ ✉️ Contactar Administrador ]         │
│                                          │
└──────────────────────────────────────────┘
```

---

## 💡 **TIPS**

1. **Para desarrollo local:**
   - Puedes agregar temporalmente tu email personal
   - Recuerda quitarlo antes de deploy

2. **Para testing:**
   - Crea cuentas de Google de prueba
   - No agregues emails de prueba a producción

3. **Monitoreo:**
   - Revisa los logs periódicamente
   - Si ves muchos intentos del mismo email, investiga

4. **Backup de la lista:**
   - Guarda una copia de `ALLOWED_EMAILS` en lugar seguro
   - Documenta por qué cada email tiene acceso

---

## ❓ **FAQ**

**Q: ¿Puedo usar emails de otros proveedores (no Gmail)?**
A: Sí, mientras esté configurado en Auth0.

**Q: ¿Qué pasa con usuarios que YA tienen cuenta pero no están autorizados?**
A: Verán la página de acceso denegado. Sus datos en BD siguen ahí pero no pueden acceder.

**Q: ¿Puedo hacer la lista dinámica (en BD)?**
A: Sí, pero por seguridad es mejor tenerla hardcodeada en el código.

**Q: ¿Se pueden usar dominios completos (ej: @empresa.com)?**
A: Sí, modifica la función `isEmailAuthorized()` para soportar esto:
```javascript
const isEmailAuthorized = (email) => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();

  // Verificar emails específicos
  if (ALLOWED_EMAILS.includes(normalizedEmail)) return true;

  // Verificar dominios completos
  const domain = normalizedEmail.split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
};
```

**Q: ¿Los usuarios pueden ver quién más tiene acceso?**
A: No, la lista solo está en el backend.

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

- [x] Lista de emails en backend
- [x] Middleware de verificación
- [x] Logging de intentos no autorizados
- [x] Página de acceso denegado
- [x] Interceptor en frontend
- [x] Integración con AuthContext
- [x] Documentación completa
- [x] Testing local

---

**Sistema de Control de Acceso implementado correctamente.** 🎉

Solo **marisojeda50@gmail.com** y **germanojeda83@gmail.com** pueden acceder al sistema.
