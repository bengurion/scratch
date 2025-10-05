# Docker Setup for Scratch WWW

This document provides instructions for running the Scratch WWW application using Docker, with special consideration for ARM architecture (Apple Silicon) compatibility.

## Quick Start

### Production Build
```bash
# Build and run the production container
npm run docker:up:prod
```

### Development Build
```bash
# Build and run the development container with hot reload
npm run docker:up:dev
```

## Prerequisites

- Docker Desktop (latest version recommended)
- Docker Compose v3.8+
- At least 4GB RAM allocated to Docker

## Architecture Support

This Docker setup is optimized for:
- **ARM64** (Apple Silicon M1/M2/M3 Macs)
- **AMD64** (Intel/AMD processors)

The Dockerfile includes specific dependencies and build configurations to handle native modules that may have ARM compatibility issues.

## Available Docker Commands

### Building Images
```bash
# Build production image
npm run docker:build

# Build development image
npm run docker:build:dev
```

### Running Containers
```bash
# Run production container
npm run docker:run

# Run development container with volume mounting
npm run docker:run:dev

# Start with docker-compose (recommended)
npm run docker:up

# Start development environment
npm run docker:up:dev

# Start production environment
npm run docker:up:prod
```

### Container Management
```bash
# Stop all containers
npm run docker:down

# View logs
npm run docker:logs

# Access container shell
npm run docker:shell

# Clean up everything (containers, volumes, images)
npm run docker:clean
```

## Docker Compose Profiles

The `docker-compose.yml` includes several profiles for different use cases:

### Default Profile
- `nginx`: Reverse proxy with SSL termination for HTTPS access
- `scratch-www`: Production-ready container behind nginx

### Development Profile (`--profile dev`)
- `nginx-dev`: Development reverse proxy with SSL
- `scratch-www-dev`: Development container with hot reload
- Volume mounting for live code changes

### Direct Access Profile (`--profile direct`)
- `scratch-www-direct`: Direct access without nginx (HTTP only)
- Use for testing or when only localhost access is needed

### Using Profiles
```bash
# Start production with nginx (recommended)
docker-compose up
# or
npm run docker:up:prod

# Start development with nginx and hot reload
docker-compose --profile dev up
# or
npm run docker:up:dev

# Start direct access (no HTTPS, microphone only works via localhost)
docker-compose --profile direct up
# or
npm run docker:up:direct
```

## 🎤 Microphone Access Fix

**Problem**: Microphone recording doesn't work when accessing via IP address (e.g., `http://192.168.1.100:8333`)

**Solution**: This Docker setup includes nginx reverse proxy with SSL termination to enable HTTPS access, which is required for microphone functionality.

### Quick Fix
1. Generate SSL certificates: `npm run docker:setup-ssl`
2. Start with nginx: `npm run docker:up:prod`
3. Access via HTTPS: `https://your-ip`

For detailed instructions, see [MICROPHONE_FIX.md](MICROPHONE_FIX.md)

## Environment Configuration

### Development Environment
Copy `.env.docker` to `.env.local` and modify as needed:

```bash
cp .env.docker .env.local
```

### Environment Variables
- `NODE_ENV`: Set to 'development' or 'production'
- `PORT`: Application port (default: 8333)
- `FALLBACK`: Fallback proxy URL for development
- `VIEW`: Specific view to load during development

## Multi-Stage Build Process

The Dockerfile uses a multi-stage build:

1. **Base Stage**: Sets up Node.js and system dependencies
2. **Dependencies Stage**: Installs npm packages
3. **Build Stage**: Compiles the application
4. **Production Stage**: Creates minimal runtime image

This approach:
- Reduces final image size
- Improves security by removing build tools
- Handles ARM-specific native module compilation

## Troubleshooting

### ARM Architecture Issues
If you encounter native module compilation errors on ARM Macs:

1. Ensure Docker Desktop is using the latest version
2. Try rebuilding with no cache:
   ```bash
   docker build --no-cache -t scratch-www .
   ```

### Memory Issues
If builds fail due to memory constraints:

1. Increase Docker Desktop memory allocation to 6GB+
2. The build process uses `NODE_OPTIONS=--max_old_space_size=8000`

### Port Conflicts
If port 8333 is already in use:

1. Change the port mapping in `docker-compose.yml`
2. Or set the `PORT` environment variable

### Volume Mounting Issues
For development with volume mounting:

1. Ensure Docker Desktop has file sharing enabled for your project directory
2. On Windows, use WSL2 backend for better performance

## Performance Optimization

### Build Performance
- The `.dockerignore` file excludes unnecessary files
- Multi-stage builds cache dependencies separately
- Use `docker:build:dev` for faster development builds

### Runtime Performance
- Production images run as non-root user
- Health checks ensure container reliability
- Proper signal handling for graceful shutdowns

## Security Considerations

- Containers run as non-root user (`scratch:nodejs`)
- Minimal production image reduces attack surface
- Health checks monitor application status
- Secrets should be passed via environment variables, not built into images

## Integration with CI/CD

Example GitHub Actions workflow:

```yaml
name: Docker Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: npm run docker:build
      - name: Test container
        run: |
          npm run docker:run &
          sleep 30
          curl -f http://localhost:8333 || exit 1
```

## Additional Services

### Redis Cache
Enable Redis for caching:
```bash
docker-compose --profile cache up
```

### Nginx Proxy
For production deployments with SSL:
```bash
# Create nginx configuration
mkdir -p docker
# Add your nginx.conf and SSL certificates
docker-compose --profile proxy up
```

## Support

For Docker-specific issues:
1. Check Docker Desktop logs
2. Verify system requirements
3. Try rebuilding without cache
4. Check the GitHub issues for ARM-specific problems

For application issues, refer to the main README.md file.