#!/bin/bash

echo "🚀 Manual Azure Deployment for Web App"
echo "====================================="

# Build the web app
echo "Building web app..."
cd /Users/premthakare/Desktop/Campuspe_Staging/apps/web
npm run build

# Create deployment package
echo "Creating deployment package..."
cd /Users/premthakare/Desktop/Campuspe_Staging
mkdir -p manual-deploy
cp -r apps/web/.next manual-deploy/
cp -r apps/web/public manual-deploy/
cp apps/web/package*.json manual-deploy/
cp apps/web/startup.js manual-deploy/
cp apps/web/web.config manual-deploy/

echo "Package ready in manual-deploy/"
echo "Upload this to Azure manually or use Azure CLI:"
echo "az webapp deploy --resource-group <your-rg> --name campuspe-web-staging --src-path manual-deploy/"
