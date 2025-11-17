import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Crear pool de conexiones PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Wrapper para compatibilidad con sintaxis de better-sqlite3
class PostgresWrapper {
  constructor(pool) {
    this.pool = pool;
  }

  // Simular db.prepare().get() de SQLite
  prepare(sql) {
    return {
      get: async (...params) => {
        const client = await this.pool.connect();
        try {
          // Convertir placeholders de ? a $1, $2, etc.
          const pgSql = this.convertPlaceholders(sql);
          const result = await client.query(pgSql, params);
          return result.rows[0] || null;
        } finally {
          client.release();
        }
      },

      all: async (...params) => {
        const client = await this.pool.connect();
        try {
          const pgSql = this.convertPlaceholders(sql);
          const result = await client.query(pgSql, params);
          return result.rows;
        } finally {
          client.release();
        }
      },

      run: async (...params) => {
        const client = await this.pool.connect();
        try {
          const pgSql = this.convertPlaceholders(sql);
          const result = await client.query(pgSql, params);
          return {
            changes: result.rowCount,
            lastInsertRowid: result.rows[0]?.id || null
          };
        } finally {
          client.release();
        }
      }
    };
  }

  // Ejecutar SQL directo (para migrations)
  async exec(sql) {
    const client = await this.pool.connect();
    try {
      await client.query(sql);
    } finally {
      client.release();
    }
  }

  // Convertir placeholders ? a $1, $2, $3...
  convertPlaceholders(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  }

  // Simular pragma (no hace nada en PostgreSQL)
  pragma() {
    return this;
  }

  async close() {
    await this.pool.end();
  }
}

const db = new PostgresWrapper(pool);

export default db;
export { pool };
