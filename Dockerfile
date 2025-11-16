FROM node:18-alpine

WORKDIR /app

# Copiar package files desde backend
COPY backend/package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código del backend
COPY backend/ ./

# Exponer puerto
EXPOSE 3000

# Inicializar base de datos y luego iniciar servidor
CMD npm run init-db && npm start