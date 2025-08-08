#!/bin/bash

# Azure App Service startup script for CampusPe API
echo "Starting CampusPe API..."

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the TypeScript source if dist directory is missing
if [ ! -d "dist" ]; then
    echo "Building application..."
    npm run build
fi

# Start the application
echo "Starting Node.js application..."
node dist/app.js
