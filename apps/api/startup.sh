#!/bin/bash

# Azure App Service startup script for CampusPe API
echo "Starting CampusPe API..."

# Install any missing dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# Start the application
echo "Starting Node.js application..."
node dist/app.js
