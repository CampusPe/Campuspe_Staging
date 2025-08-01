#!/bin/bash

echo "🚀 Starting CampusPe Azure Deployment..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install API dependencies
echo "📦 Installing API dependencies..."
cd apps/api
npm install

# Build API
echo "🔨 Building API..."
npm run build

# Install Web dependencies
echo "📦 Installing Web dependencies..."
cd ../web
npm install

# Build Web app
echo "🔨 Building Web app..."
npm run build

# Go back to root
cd ../..

echo "✅ Build completed successfully!"
echo "🎯 Ready for Azure deployment"
