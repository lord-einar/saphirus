import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import db from '../database/db.js';

// ====================================
// LISTA BLANCA DE EMAILS AUTORIZADOS
// ====================================
const ALLOWED_EMAILS = [
  'marisojeda50@gmail.com',
  'germanojeda83@gmail.com'
];

// Función para verificar si un email está autorizado
const isEmailAuthorized = (email) => {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase().trim());
};

// Middleware JWT de Auth0
export const checkJwt = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

// Middleware para crear/obtener usuario en la BD
export const ensureUser = async (req, res, next) => {
  try {
    const auth0Id = req.auth.sub;

    // Intentar obtener email y name de diferentes fuentes
    let email = req.auth.email ||
                req.auth[`${process.env.AUTH0_AUDIENCE}email`] ||
                req.auth[`https://${process.env.AUTH0_DOMAIN}/email`];

    let name = req.auth.name ||
               req.auth[`${process.env.AUTH0_AUDIENCE}name`] ||
               req.auth[`https://${process.env.AUTH0_DOMAIN}/name`];

    // Si no tenemos email, intentar obtenerlo del userinfo endpoint de Auth0
    if (!email) {
      try {
        const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });

        if (response.ok) {
          const userInfo = await response.json();
          email = userInfo.email;
          name = name || userInfo.name;
        }
      } catch (fetchError) {
        console.error('Error obteniendo userinfo:', fetchError);
      }
    }

    // ====================================
    // VERIFICAR LISTA BLANCA DE EMAILS
    // ====================================
    if (!isEmailAuthorized(email)) {
      console.warn(`⚠️  Intento de acceso no autorizado: ${email}`);
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Tu correo no tiene permisos para acceder a este sistema',
        email: email
      });
    }

    // Buscar usuario existente
    let user = db.prepare('SELECT * FROM users WHERE auth0_id = ?').get(auth0Id);

    if (!user) {
      // Crear nuevo usuario
      const insert = db.prepare(`
        INSERT INTO users (auth0_id, email, name, notification_email)
        VALUES (?, ?, ?, ?)
      `);

      const result = insert.run(auth0Id, email, name || 'Usuario', email);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      console.log('✓ Nuevo usuario creado:', email);
    }

    // Adjuntar usuario al request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en ensureUser:', error);
    console.error('Token payload:', req.auth);
    res.status(500).json({ error: 'Error al procesar usuario' });
  }
};

// Middleware opcional para rutas que pueden o no tener autenticación
export const optionalAuth = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
  credentialsRequired: false
});
