# ─── Étape 1 : Build React ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ─── Étape 2 : Serve avec Nginx (non-root) ──────────────────────────────────
# nginxinc/nginx-unprivileged tourne en user nginx (UID 101) et écoute sur
# 8080 : pas de root dans le conteneur (audit NAS 2026-07-30). Tag épinglé.
FROM nginxinc/nginx-unprivileged:1.29.5-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
