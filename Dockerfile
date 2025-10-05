# Working Dockerfile for Scratch WWW with Local .sb3 Storage
# Single-stage build that properly installs all dependencies

FROM node:20-alpine

# Install system dependencies for canvas and build process
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    pkgconfig

# Create python symlink for packages that expect 'python' command
RUN ln -sf python3 /usr/bin/python

# Set environment variables
ENV PYTHON=/usr/bin/python3
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV WWW_VERSION=docker-build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for dev-server)
RUN npm ci --legacy-peer-deps

# Copy source code (test files excluded by .dockerignore)
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S scratch -u 1001 -G nodejs

# Create projects storage directory with proper permissions
RUN mkdir -p /app/projects && \
    chown -R scratch:nodejs /app

USER scratch

# Create volume for persistent .sb3 project storage
VOLUME ["/app/projects"]

EXPOSE 8333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8333', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]