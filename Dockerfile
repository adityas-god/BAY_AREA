# Production Nginx stage (pre-built on host)
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy pre-built production bundle from frontend/.output/public or frontend/dist
COPY frontend/.output/public /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
