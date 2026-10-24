# Dockerfile for Frontend (SPA / Static Web App)
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies based on package-lock.json
COPY frontend/package*.json ./
RUN npm ci

# Copy source code and build
COPY frontend/ ./
RUN npm run build

# Production Nginx stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets (.output/public or dist depending on nitro/vite output)
COPY --from=builder /app/.output/public /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
