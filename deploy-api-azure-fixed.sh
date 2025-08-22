#!/bin/bash

# CampusPe API Azure Deployment Script - Fixed for Large Package Issue
echo "🚀 Starting CampusPe API deployment to Azure (Size Optimized)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Azure App Service details
API_APP_NAME="campuspe-api-staging-hmfjgud5c6a7exe9"
RESOURCE_GROUP="campuspe-staging-rg"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Install instructions: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure. Please login first.${NC}"
    echo "Run: az login"
    exit 1
fi

# Navigate to API directory
cd apps/api || {
    echo -e "${RED}❌ Failed to navigate to apps/api directory${NC}"
    exit 1
}

echo -e "${GREEN}📁 Current directory: $(pwd)${NC}"

# Check current package size
echo -e "${YELLOW}📊 Checking current package size...${NC}"
CURRENT_SIZE=$(du -sh . | cut -f1)
echo -e "${YELLOW}📦 Current total size: $CURRENT_SIZE${NC}"

NODE_MODULES_SIZE=$(du -sh node_modules | cut -f1)
echo -e "${YELLOW}📦 Node modules size: $NODE_MODULES_SIZE${NC}"

# Build the application first
echo -e "${YELLOW}🔨 Building TypeScript application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Create a deployment package excluding large files
echo -e "${YELLOW}📦 Creating optimized deployment package...${NC}"

# Create a temporary directory for the deployment package
TEMP_DIR=$(mktemp -d)
echo "Temporary directory: $TEMP_DIR"

# Copy essential files for deployment
echo -e "${YELLOW}📋 Copying essential files...${NC}"
cp -r dist "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp server.js "$TEMP_DIR/"
cp web.config "$TEMP_DIR/"

# Copy only production node_modules (without chromium binaries)
echo -e "${YELLOW}🚮 Creating clean node_modules...${NC}"
mkdir -p "$TEMP_DIR/node_modules"

# Install only production dependencies in temp directory
cd "$TEMP_DIR"
npm install --only=production --ignore-scripts

# Remove chromium binaries and other large files
echo -e "${YELLOW}🧹 Removing large binaries...${NC}"
find node_modules -name ".local-chromium" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "*chrome*" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "*chromium*" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "Chromium.app" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove unnecessary dev files
rm -rf node_modules/@types/ 2>/dev/null || true
rm -rf node_modules/typescript/ 2>/dev/null || true
rm -rf node_modules/ts-node/ 2>/dev/null || true
rm -rf node_modules/nodemon/ 2>/dev/null || true
rm -rf node_modules/eslint/ 2>/dev/null || true
rm -rf node_modules/jest/ 2>/dev/null || true
rm -rf node_modules/@typescript-eslint/ 2>/dev/null || true

cd - > /dev/null

# Check optimized package size
OPTIMIZED_SIZE=$(du -sh "$TEMP_DIR" | cut -f1)
echo -e "${GREEN}📦 Optimized package size: $OPTIMIZED_SIZE${NC}"

# Create zip file
echo -e "${YELLOW}🗜️  Creating ZIP file...${NC}"
cd "$TEMP_DIR"
zip -r ../deployment.zip . -x "*.DS_Store*" "*.git*" "*.log*"
cd - > /dev/null

# Check zip file size
ZIP_SIZE=$(du -sh "$TEMP_DIR/../deployment.zip" | cut -f1)
echo -e "${GREEN}📦 ZIP file size: $ZIP_SIZE${NC}"

# Deploy to Azure
echo -e "${YELLOW}🚀 Deploying to Azure App Service...${NC}"
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$API_APP_NAME" \
    --src "$TEMP_DIR/../deployment.zip"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Your API should be available at: https://$API_APP_NAME.southindia-01.azurewebsites.net${NC}"
    
    # Wait a moment and test the endpoint
    echo -e "${YELLOW}⏳ Waiting for app to start...${NC}"
    sleep 15
    
    echo -e "${YELLOW}🔍 Testing deployment...${NC}"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$API_APP_NAME.southindia-01.azurewebsites.net/api/health")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ API is responding correctly!${NC}"
    else
        echo -e "${YELLOW}⚠️  API returned status code: $HTTP_STATUS${NC}"
        echo -e "${YELLOW}💡 Check Azure App Service logs for more details${NC}"
    fi
else
    echo -e "${RED}❌ Deployment failed${NC}"
    
    # Show Azure logs
    echo -e "${YELLOW}🔍 Fetching Azure deployment logs...${NC}"
    az webapp log tail --resource-group "$RESOURCE_GROUP" --name "$API_APP_NAME" --provider application
    
    exit 1
fi

# Clean up
echo -e "${YELLOW}🧹 Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"
rm -f "$TEMP_DIR/../deployment.zip"

echo -e "${GREEN}🎉 Deployment process completed!${NC}"
