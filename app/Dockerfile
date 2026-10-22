# Use official minimal Node.js Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# HARDENING: Change ownership to non-root built-in user 'node'
RUN chown -R node:node /app

# HARDENING: Switch to unprivileged non-root user
USER node

# Expose internal port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "server.js"]
