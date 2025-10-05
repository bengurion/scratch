# Docker Build Troubleshooting Guide for Scratch WWW

## ✅ SOLUTION FOUND

The Docker deployment issue has been **RESOLVED**! The problem was with the multi-stage Docker build approach that was separating dependency installation from the final runtime image.

### Root Cause
The `webpack-dev-middleware` error occurred because:
1. **Multi-stage build issue**: Dependencies were installed in one stage but not properly copied to the production stage
2. **Missing git**: The build process required git for version detection
3. **Canvas compilation**: Required Python and build tools in the container

### Working Solution
Use a **single-stage build** that installs all dependencies and builds in the same container:

```dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 make g++ git \
    cairo-dev jpeg-dev pango-dev musl-dev \
    giflib-dev pixman-dev libjpeg-turbo-dev \
    freetype-dev pkgconfig

# Create python symlink and set environment
RUN ln -sf python3 /usr/bin/python
ENV PYTHON=/usr/bin/python3
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV WWW_VERSION=docker-build

WORKDIR /app

# Install dependencies and build
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Create user and start
RUN addgroup -g 1001 -S nodejs && \
    adduser -S scratch -u 1001 -G nodejs && \
    chown -R scratch:nodejs /app
USER scratch

EXPOSE 8333
CMD ["npm", "start"]
```

## ✅ Verified Working

The container now:
- ✅ Builds successfully without canvas compilation errors
- ✅ Installs webpack-dev-middleware and all dependencies correctly
- ✅ Starts the dev-server without module errors
- ✅ Serves the application on port 8333
- ✅ Responds with HTTP 200 OK
- ✅ Excludes test files via .dockerignore for optimization

## Build and Run Commands

```bash
# Build the working image
docker build -t scratch-www .

# Run the container
docker run -d -p 8333:8333 --name scratch-www scratch-www

# Check if it's working
curl -I http://localhost:8333
# Should return: HTTP/1.1 200 OK

# View logs
docker logs scratch-www
# Should show: "Server listening on port 8333"
```

## Key Insights

1. **Architecture**: The scratch-www application uses a dev-server (Express + webpack-dev-middleware) even in production
2. **Dependencies**: All dependencies (including devDependencies) are needed because the dev-server requires webpack tooling
3. **Single-stage vs Multi-stage**: For this application, single-stage build works better than multi-stage
4. **Test exclusion**: The .dockerignore properly excludes test files, reducing image size

## Alternative Dockerfiles Available

- `Dockerfile` - Main working version (recommended)
- `Dockerfile.simple` - Simplified version used for testing
- `Dockerfile.optimized` - Multi-stage version (may have issues)
- `Dockerfile.alternative` - Fallback version

## Environment Variables

- `NODE_ENV=production` - Set production mode
- `PORT=8333` - Server port (default)
- `WWW_VERSION=docker-build` - Version identifier
- `NPM_CONFIG_LEGACY_PEER_DEPS=true` - Handle peer dependency conflicts

## Final Status: ✅ DEPLOYMENT SUCCESSFUL

The Scratch WWW application is now successfully containerized and running!