# Multi-stage build: React 19 SPA build + Node.js 22 Express production runtime
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5002

# Install server dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --prefix server

# Copy server source
COPY server/ ./server/

# Copy built frontend assets
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5002

# Seed and launch unified server
CMD ["sh", "-c", "node server/src/db/seed.js && node server/src/index.js"]
