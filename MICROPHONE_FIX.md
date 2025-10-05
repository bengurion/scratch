# Microphone Access Fix for Docker Deployment

## Problem
When accessing the Scratch WWW application through a Docker container via IP address (e.g., `http://192.168.1.100:80`), the microphone recording functionality doesn't work. This is due to browser security policies that require HTTPS for accessing sensitive APIs like `getUserMedia()` for microphone recording, except when accessing via `localhost`.

## Root Cause
Modern browsers (Chrome, Firefox, Safari, etc.) block microphone access over HTTP connections for security reasons, with the exception of `localhost`. When you access the application via:
- ✅ `http://localhost:8333` - Works (localhost exception)
- ❌ `http://192.168.1.100:80` - Blocked (insecure connection)
- ✅ `https://192.168.1.100:443` - Works (secure connection)

## Solution: Nginx Reverse Proxy with SSL Termination
This repository uses nginx as a reverse proxy with SSL termination to provide HTTPS access, enabling microphone functionality when connecting via IP address. This is a clean, production-ready approach that:

- ✅ Handles SSL termination at the proxy level
- ✅ Keeps the Node.js app simple (HTTP only)
- ✅ Provides proper security headers
- ✅ Enables HTTP to HTTPS redirects
- ✅ Supports WebSocket connections
- ✅ Includes static asset caching

## Architecture

```
Browser (HTTPS) → Nginx (SSL Termination) → Scratch WWW (HTTP)
     :443              :80 → :443              :8333
```

## Quick Setup

### 1. Generate SSL Certificates
```bash
# Generate self-signed SSL certificates
npm run docker:setup-ssl
```

### 2. Start with Nginx Reverse Proxy
```bash
# Production setup with nginx
npm run docker:up:prod

# Development setup with nginx
npm run docker:up:dev
```

### 3. Access the Application
- **HTTPS (with microphone)**: `https://your-ip` (port 443)
- **HTTP (redirects to HTTPS)**: `http://your-ip` (port 80)

## Detailed Setup Instructions

### Method 1: Production with Nginx (Recommended)

1. **Generate SSL certificates:**
   ```bash
   ./ssl/generate-certs.sh
   ```

2. **Start the services:**
   ```bash
   docker-compose up nginx scratch-www
   # or
   npm run docker:up:prod
   ```

3. **Access the application:**
   - `https://localhost` or `https://your-ip`
   - HTTP requests to port 80 automatically redirect to HTTPS

### Method 2: Development with Nginx

1. **Generate SSL certificates:**
   ```bash
   ./ssl/generate-certs.sh
   ```

2. **Start development services:**
   ```bash
   docker-compose --profile dev up
   # or
   npm run docker:up:dev
   ```

3. **Features:**
   - Hot reload enabled
   - Source code mounted for development
   - HTTPS access with microphone support

### Method 3: Direct Access (No Nginx)

For testing or when you only need localhost access:

```bash
docker-compose --profile direct up scratch-www-direct
# or
npm run docker:up:direct
```

**Note:** This method only provides HTTP access on port 8333, so microphone will only work via `localhost`.

## Available Ports & Services

| Port | Service | Protocol | Purpose | Microphone Access |
|------|---------|----------|---------|-------------------|
| 80 | nginx | HTTP | Redirects to HTTPS | ❌ Redirected |
| 443 | nginx | HTTPS | Main application access | ✅ Full access |
| 8333 | scratch-www | HTTP | Direct access (testing) | ❌ Only via localhost |

## Docker Compose Profiles

| Profile | Command | Services | Use Case |
|---------|---------|----------|----------|
| default | `docker-compose up` | nginx + scratch-www | Production with HTTPS |
| dev | `--profile dev up` | nginx-dev + scratch-www-dev | Development with hot reload |
| direct | `--profile direct up` | scratch-www-direct | Testing without nginx |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:setup-ssl` | Generate SSL certificates |
| `npm run docker:up:prod` | Start production with nginx |
| `npm run docker:up:dev` | Start development with nginx |
| `npm run docker:up:direct` | Start without nginx (testing) |
| `npm run docker:down` | Stop all services |
| `npm run docker:logs` | View logs |

## Configuration Files

### Nginx Configuration
- **Location**: `docker/nginx/nginx.conf`
- **Features**:
  - SSL termination
  - HTTP to HTTPS redirect
  - Security headers
  - WebSocket support
  - Static asset caching
  - API endpoint optimization

### SSL Certificates
- **Location**: `ssl/`
- **Files**: `server.key`, `server.crt`
- **Generation**: `./ssl/generate-certs.sh`

## Browser Security Warning

Since we use self-signed certificates, browsers will show a security warning. This is normal and expected. To proceed:

1. **Chrome/Edge**: Click "Advanced" → "Proceed to [site] (unsafe)"
2. **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
3. **Safari**: Click "Show Details" → "visit this website"

## Troubleshooting

### Microphone Still Not Working?

1. **Check HTTPS**: Ensure you're accessing via `https://` not `http://`
2. **Accept Certificate**: Make sure you've accepted the browser security warning
3. **Check Permissions**: Verify browser microphone permissions are granted
4. **Clear Browser Cache**: Try a hard refresh (Ctrl+F5)

### Nginx Won't Start?

1. **Check certificates exist:**
   ```bash
   ls -la ssl/
   ```

2. **Check nginx configuration:**
   ```bash
   docker-compose exec nginx nginx -t
   ```

3. **View nginx logs:**
   ```bash
   docker-compose logs nginx
   ```

### Port Conflicts?

1. **Check what's using ports 80/443:**
   ```bash
   netstat -an | grep :80
   netstat -an | grep :443
   ```

2. **Stop conflicting services:**
   ```bash
   # On macOS/Linux
   sudo lsof -ti:80 | xargs kill -9
   sudo lsof -ti:443 | xargs kill -9
   ```

### Certificate Issues?

1. **Regenerate certificates:**
   ```bash
   rm ssl/server.*
   ./ssl/generate-certs.sh
   docker-compose restart nginx
   ```

2. **Check certificate validity:**
   ```bash
   openssl x509 -in ssl/server.crt -text -noout
   ```

## Production Deployment

For production deployment, replace self-signed certificates with proper SSL certificates:

### Option 1: Let's Encrypt with Certbot
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/server.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/server.key
```

### Option 2: Commercial SSL Certificate
1. Purchase SSL certificate from a trusted CA
2. Replace `ssl/server.crt` and `ssl/server.key`
3. Restart nginx: `docker-compose restart nginx`

## Security Features

The nginx configuration includes:
- **TLS 1.2/1.3** support
- **Strong cipher suites**
- **Security headers**:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security` (HSTS)
- **Request size limits** (50MB for project uploads)
- **Gzip compression**
- **Static asset caching**

## Why Nginx Reverse Proxy?

This approach is superior to handling HTTPS in Node.js because:

1. **Separation of Concerns**: SSL termination is handled by nginx, Node.js focuses on application logic
2. **Performance**: nginx is optimized for serving static content and handling SSL
3. **Security**: nginx provides robust security features and headers
4. **Scalability**: Easy to add load balancing, caching, and multiple backend instances
5. **Production Ready**: Standard architecture used in production environments
6. **Flexibility**: Easy to add additional services or modify routing

## Network Configuration

The generated certificates include Subject Alternative Names (SAN) for:
- `localhost`
- Common private IP ranges (192.168.x.x, 10.x.x.x, 172.17.x.x)
- Docker internal IPs

If your network uses different IP ranges, edit `ssl/generate-certs.sh` and add your IP ranges to the `[alt_names]` section.