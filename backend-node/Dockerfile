# ============================================
# TradeGuard AI — Node.js API Gateway
# Production-ready image (also fine for local dev)
# ============================================
FROM node:20-alpine

# Small init process so SIGTERM is forwarded correctly and zombies are reaped
RUN apk add --no-cache tini

WORKDIR /app

# Install dependencies first (better layer caching).
# Use npm ci when a lockfile is present for reproducible installs.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy application source
COPY . .

# Run as the built-in non-root user for security
USER node

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Lightweight container healthcheck against the health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
