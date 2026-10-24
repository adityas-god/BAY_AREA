# Production Nginx stage (pre-built on host)
FROM nginx:alpine

# Remove default nginx configs and static assets
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built production bundle from frontend/.output/public or frontend/dist
COPY frontend/.output/public /usr/share/nginx/html

# Guarantee index.html exists for Nginx if TanStack generated _shell.html
RUN if [ ! -f /usr/share/nginx/html/index.html ] && [ -f /usr/share/nginx/html/_shell.html ]; then \
      cp /usr/share/nginx/html/_shell.html /usr/share/nginx/html/index.html; \
    fi

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
