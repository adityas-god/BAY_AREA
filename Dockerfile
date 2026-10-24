# Dockerfile for Frontend (SPA / Static Web App)
FROM node:22 AS builder

WORKDIR /app

# Copy package manifests
COPY frontend/package*.json ./

# Cleanly install dependencies using npm install
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
