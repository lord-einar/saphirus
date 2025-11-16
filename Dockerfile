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

# Comando de inicio
CMD ["npm", "start"]