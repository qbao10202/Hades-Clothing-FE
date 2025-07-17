# Multi-stage build for production-ready Angular application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application for production
RUN npm run build:prod

# Production stage with Nginx
FROM nginx:alpine

# Install wget and gettext for envsubst
RUN apk add --no-cache wget gettext

# Copy custom nginx configuration as a template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy built application from the correct path
COPY --from=build /app/dist/sales-frontend /usr/share/nginx/html

# Create nginx user for security (alpine already has nginx user)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Expose port (default 8080 for Railway, but can be overridden)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx with envsubst to substitute PORT
CMD envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;' 