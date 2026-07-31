# ============================================
# TradeGuard AI — React (Vite) Frontend
# Multi-stage: build static assets, then serve with nginx.
# nginx also reverse-proxies /api -> Node gateway so the SPA
# talks to the backend same-origin (no CORS needed).
# ============================================

# ---- Stage 1: build the static bundle ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

# ---- Stage 2: serve with nginx ----
FROM nginx:1.27-alpine

# Replace the default site config with our SPA + API-proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
