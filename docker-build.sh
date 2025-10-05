#!/bin/bash

# Docker build script for scratch-www with error handling
# This script provides multiple build strategies to handle canvas dependency issues

set -e

echo "🚀 Building Scratch WWW Docker image..."

# Function to build with specific Dockerfile
build_with_dockerfile() {
    local dockerfile=$1
    local tag=$2
    
    echo "📦 Attempting build with $dockerfile..."
    
    if docker build -f "$dockerfile" -t "$tag" .; then
        echo "✅ Successfully built with $dockerfile"
        return 0
    else
        echo "❌ Build failed with $dockerfile"
        return 1
    fi
}

# Function to test the built image
test_image() {
    local tag=$1
    echo "🧪 Testing image $tag..."
    
    # Start container in background
    local container_id=$(docker run -d -p 8333:8333 "$tag")
    
    # Wait a bit for startup
    sleep 10
    
    # Test if the service is responding
    if curl -f http://localhost:8333 >/dev/null 2>&1; then
        echo "✅ Image $tag is working correctly!"
        docker stop "$container_id" >/dev/null
        return 0
    else
        echo "❌ Image $tag failed health check"
        echo "📋 Container logs:"
        docker logs "$container_id"
        docker stop "$container_id" >/dev/null
        return 1
    fi
}

# Main build process
main() {
    echo "🏗️  Starting Docker build process for scratch-www"
    
    # Try optimized Dockerfile first
    if build_with_dockerfile "Dockerfile.optimized" "scratch-www:optimized"; then
        echo "🎉 Optimized build completed successfully!"
        if test_image "scratch-www:optimized"; then
            echo "📋 You can now run: docker run -p 8333:8333 scratch-www:optimized"
            exit 0
        fi
    fi
    
    echo "⚠️  Optimized build failed or didn't pass tests, trying main Dockerfile..."
    
    # Try main Dockerfile
    if build_with_dockerfile "Dockerfile" "scratch-www:latest"; then
        echo "🎉 Main build completed successfully!"
        if test_image "scratch-www:latest"; then
            echo "📋 You can now run: docker run -p 8333:8333 scratch-www:latest"
            exit 0
        fi
    fi
    
    echo "⚠️  Main build failed, trying alternative approach..."
    
    # Try alternative Dockerfile
    if build_with_dockerfile "Dockerfile.alternative" "scratch-www:alternative"; then
        echo "🎉 Alternative build completed successfully!"
        if test_image "scratch-www:alternative"; then
            echo "📋 You can now run: docker run -p 8333:8333 scratch-www:alternative"
            exit 0
        fi
    fi
    
    echo "❌ All build attempts failed."
    echo "💡 Possible solutions:"
    echo "   1. Check if all required files are present"
    echo "   2. Verify Node.js version compatibility"
    echo "   3. Check for missing dependencies"
    echo "   4. Try building on a different architecture"
    
    exit 1
}

# Run main function
main "$@"