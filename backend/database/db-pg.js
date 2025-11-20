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
    const self = this;
    return {
      get: async (...params) => {
        const client = self.currentClient || await self.pool.connect();
        try {
          // Convertir placeholders de ? a $1, $2, etc.
          const pgSql = self.convertPlaceholders(sql);
          const result = await client.query(pgSql, params);
          return result.rows[0] || null;
        } finally {
          if (!self.currentClient) {
            client.release();
          }
        }
      },

      all: async (...params) => {
        const client = self.currentClient || await self.pool.connect();
        try {
          const pgSql = self.convertPlaceholders(sql);
          const result = await client.query(pgSql, params);
          return result.rows;
        } finally {
          if (!self.currentClient) {
            client.release();
          }
        }
      },

      run: async (...params) => {
        const client = self.currentClient || await self.pool.connect();
        try {
          let pgSql = self.convertPlaceholders(sql);

          // Si es un INSERT y no tiene RETURNING, agregarlo para obtener el ID
          if (pgSql.trim().toUpperCase().startsWith('INSERT') &&
              !pgSql.toUpperCase().includes('RETURNING')) {
            pgSql += ' RETURNING id';
          }

          const result = await client.query(pgSql, params);
          return {
            changes: result.rowCount,
            lastInsertRowid: result.rows[0]?.id || null
          };
        } finally {
          if (!self.currentClient) {
            client.release();
          }
        }
      }
    };
  }

  // Simular transacciones de SQLite
  transaction(fn) {
    const self = this;
    return async (...args) => {
      const client = await self.pool.connect();
      try {
        await client.query('BEGIN');
        self.currentClient = client;

        await fn(...args);

        await client.query('COMMIT');
        self.currentClient = null;
      } catch (error) {
        await client.query('ROLLBACK');
        self.currentClient = null;
        throw error;
      } finally {
        client.release();
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
