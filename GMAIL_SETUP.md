# Configuración de Gmail para Saphirus

## Opción 1: Desactivar Email (Para testing sin email)

Si solo quieres probar la aplicación sin configurar emails, **no hagas nada**. El sistema funcionará perfectamente sin enviar emails.

## Opción 2: Configurar Gmail (Para producción)

### Paso 1: Habilitar Verificación en 2 Pasos

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Click en "Seguridad" en el menú lateral
3. Busca "Verificación en dos pasos"
4. Sigue las instrucciones para habilitarla (si no la tienes)

### Paso 2: Generar Contraseña de Aplicación

1. En la misma sección de Seguridad
2. Busca "Contraseñas de aplicaciones" (aparece solo si tienes 2FA habilitado)
3. Selecciona:
   - **Aplicación:** Correo
   - **Dispositivo:** Otro (nombre personalizado) → escribe "Saphirus"
4. Google generará una contraseña de 16 caracteres
5. **Copia esta contraseña** (no la podrás ver de nuevo)

### Paso 3: Configurar el Backend

Edita el archivo `backend/.env`:

```env
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Nota:** Usa la contraseña de aplicación generada, NO tu contraseña normal de Gmail.

### Paso 4: Reiniciar el Servidor

```bash
cd backend
# Ctrl+C para detener el servidor
npm run dev
```

Deberías ver:
```
✓ Servicio de email configurado correctamente
```

## Solución de Problemas

### Error: "Invalid login"
- Verifica que estés usando la contraseña de aplicación, no tu contraseña normal
- Asegúrate de que la verificación en 2 pasos esté habilitada

### Error: "Missing credentials"
- Verifica que ambos campos (`GMAIL_USER` y `GMAIL_APP_PASSWORD`) estén configurados en `.env`
- Asegúrate de no tener espacios extra al copiar la contraseña

### Los emails no llegan
- Revisa la carpeta de Spam
- Verifica que el email del vendedor esté configurado en el dashboard
- Revisa los logs del servidor para ver si hay errores

## Testing sin Gmail Real

Si no quieres usar tu Gmail real, puedes:

1. Crear una cuenta de Gmail dedicada para el proyecto
2. O usar un servicio como Mailtrap.io para testing
3. O simplemente dejar el servicio deshabilitado (funcionará todo excepto el envío de emails)
