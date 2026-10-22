FROM nginx:1.25-alpine

# Install openssl for certificate verification/fallback
RUN apk add --no-cache openssl

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom hardened configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy SSL certificates
COPY ssl /etc/nginx/ssl

# Set proper permissions for SSL files
RUN chmod 600 /etc/nginx/ssl/localhost.key && chmod 644 /etc/nginx/ssl/localhost.crt

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
