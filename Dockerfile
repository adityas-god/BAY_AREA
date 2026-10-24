# Production Nginx stage (pre-built on host)
FROM nginx:alpine

# Remove default nginx configs and static assets
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built production bundle from frontend/.output/public or frontend/dist
COPY frontend/.output/public /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
