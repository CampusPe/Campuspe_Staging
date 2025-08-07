#!/bin/bash

# Azure App Service startup script for CampusPe Web
echo "Starting CampusPe Web..."

# Install any missing dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# Start the Next.js application
echo "Starting Next.js application..."
npm start
