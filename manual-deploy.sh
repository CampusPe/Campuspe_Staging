#!/bin/bash

# Manual Azure Deployment Script
# This script builds both applications locally and deploys them manually to Azure

set -e

echo "🚀 Starting manual Azure deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Install: brew install azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure. Please log in...${NC}"
    az login
fi

echo -e "${GREEN}✅ Azure CLI ready${NC}"

# Build API
echo -e "${YELLOW}📦 Building API...${NC}"
cd apps/api
npm ci
npm run build

# Create API deployment package
echo -e "${YELLOW}📦 Creating API deployment package...${NC}"
rm -rf deploy-api
mkdir -p deploy-api

# Copy built files
cp -r dist deploy-api/
cp -r node_modules deploy-api/ || echo "node_modules not found, will install fresh"

# Create minimal package.json for Azure
cat > deploy-api/package.json << 'EOF'
{
  "name": "campuspe-api",
  "version": "1.0.0",
  "main": "dist/app.js",
  "scripts": {
    "start": "node dist/app.js"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.3",
    "aws-sdk": "^2.1691.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "crypto": "^1.0.1",
    "express": "^4.19.2",
    "express-rate-limit": "^7.4.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.5.4",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.14",
    "pdf-parse": "^1.1.1",
    "stripe": "^16.8.0"
  }
}
EOF

# Install production dependencies if needed
if [ ! -d "deploy-api/node_modules" ]; then
    cd deploy-api
    npm install --production
    cd ..
fi

# Create ZIP file for API
echo -e "${YELLOW}📦 Creating API ZIP package...${NC}"
cd deploy-api
zip -r ../api-deployment.zip . -q
cd ..

# Deploy API
echo -e "${YELLOW}🚀 Deploying API to Azure...${NC}"
az webapp deployment source config-zip \
    --resource-group appsvc_linux_southindia_basic \
    --name campuspe-api-staging \
    --src api-deployment.zip

echo -e "${GREEN}✅ API deployed successfully${NC}"

# Build Web App
echo -e "${YELLOW}📦 Building Web App...${NC}"
cd ../web
npm ci
npm run build

# Create Web deployment package
echo -e "${YELLOW}📦 Creating Web deployment package...${NC}"
rm -rf deploy-web
mkdir -p deploy-web

# Copy Next.js build output
cp -r .next deploy-web/
cp -r public deploy-web/ || mkdir -p deploy-web/public
cp next.config.js deploy-web/ || echo "module.exports = {}" > deploy-web/next.config.js

# Create minimal package.json for Azure
cat > deploy-web/package.json << 'EOF'
{
  "name": "campuspe-web",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF

# Install production dependencies
cd deploy-web
npm install --production

# Create server.js for Azure
cat > server.js << 'EOF'
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = false
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

console.log('🚀 Starting CampusPe Web...')
console.log('📦 Node.js version:', process.version)
console.log('🌐 Port:', port)

const app = next({ 
  dev: false,
  hostname, 
  port,
  dir: __dirname
})

const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('✅ Next.js prepared')
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('❌ Error:', err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  }).listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Server error:', err)
      process.exit(1)
    }
    console.log(`🎉 Server ready on http://${hostname}:${port}`)
  })
}).catch((err) => {
  console.error('❌ App error:', err)
  process.exit(1)
})
EOF

cd ..

# Create ZIP file for Web
echo -e "${YELLOW}📦 Creating Web ZIP package...${NC}"
cd deploy-web
zip -r ../web-deployment.zip . -q
cd ..

# Deploy Web App
echo -e "${YELLOW}🚀 Deploying Web App to Azure...${NC}"
az webapp deployment source config-zip \
    --resource-group appsvc_linux_southindia_basic \
    --name campuspe-web-staging \
    --src web-deployment.zip

echo -e "${GREEN}✅ Web App deployed successfully${NC}"

# Clean up
cd ../../
rm -f apps/api/api-deployment.zip
rm -f apps/web/web-deployment.zip
rm -rf apps/api/deploy-api
rm -rf apps/web/deploy-web

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📍 Your applications are now available at:"
echo "🔧 API: http://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"
echo "🌐 Web: http://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net"
echo ""
echo "⏱️  Note: It may take 2-3 minutes for the applications to start up."
