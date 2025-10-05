#!/bin/bash

echo "🧪 Testing Scratch WWW Docker Setup with Nginx Reverse Proxy"
echo "============================================================="

# Check if SSL certificates exist
if [ ! -f "ssl/server.crt" ] || [ ! -f "ssl/server.key" ]; then
    echo "❌ SSL certificates not found. Generating them now..."
    ./ssl/generate-certs.sh
    echo "✅ SSL certificates generated"
else
    echo "✅ SSL certificates found"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Validate Docker Compose configuration
echo "🔍 Validating Docker Compose configuration..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors"
    docker-compose config
    exit 1
fi

# Check if ports are available
echo "🔍 Checking if ports 80 and 443 are available..."
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 80 is already in use. You may need to stop other services."
    lsof -Pi :80 -sTCP:LISTEN
fi

if lsof -Pi :443 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 443 is already in use. You may need to stop other services."
    lsof -Pi :443 -sTCP:LISTEN
fi

echo ""
echo "🚀 Setup is ready! You can now start the services with:"
echo ""
echo "   Production (with nginx):  npm run docker:up:prod"
echo "   Development (with nginx): npm run docker:up:dev"
echo "   Direct access (no nginx): npm run docker:up:direct"
echo ""
echo "📱 Access URLs:"
echo "   HTTPS (microphone enabled): https://localhost"
echo "   HTTP (redirects to HTTPS):  http://localhost"
echo ""
echo "🎤 Microphone access will work via HTTPS on any IP address!"
echo "   Example: https://192.168.1.100 (replace with your actual IP)"