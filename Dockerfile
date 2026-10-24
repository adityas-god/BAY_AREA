# Dockerfile for Frontend (Built with Node Debian/Slim for native rollup/rolldown compatibility)
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY frontend/package*.json ./

# Install with npm install (fallback-resilient)
RUN npm install

# Copy source code and build
COPY frontend/ ./
RUN npm run build

# Production Nginx stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets (.output/public or dist)
COPY --from=builder /app/.output/public /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
