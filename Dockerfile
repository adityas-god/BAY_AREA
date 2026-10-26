# Production Nginx container (pre-built on host runner)
FROM nginx:alpine

# Remove default nginx configs and static assets
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built production bundle from frontend/.output/public
COPY frontend/.output/public /usr/share/nginx/html

# Guarantee index.html exists for Nginx if TanStack generated _shell.html
RUN if [ ! -f /usr/share/nginx/html/index.html ] && [ -f /usr/share/nginx/html/_shell.html ]; then \
      cp /usr/share/nginx/html/_shell.html /usr/share/nginx/html/index.html; \
    fi

# Expose standard HTTP port
EXPOSE 80

# Health check endpoint verification
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
