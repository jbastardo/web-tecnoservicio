# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Stage 1: Base image
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Install dependencies
# ------------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# ------------------------------------------------------------------------------
# Stage 3: Build the application
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public

# Variables de entorno en tiempo de compilación (si aplican)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Ejecutar el build de Next.js
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Production runner
# ------------------------------------------------------------------------------
FROM base AS runner
RUN apk add --no-cache su-exec
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATA_DIR="/app/data"

# Crear usuario seguro no privilegiado
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Crear directorio base para volumen persistente y backups
RUN mkdir -p /app/data /app/data/backups && chown -R nextjs:nodejs /app/data

# Copiar archivos públicos y el build standalone de Next.js
COPY --from=builder /app/public ./public

# Crear directorio de caché y asignar permisos
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar archivos compilados en modo standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar script de arranque seguro
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
