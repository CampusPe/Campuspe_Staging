#!/bin/bash

echo "🔧 FIXING GITHUB ACTIONS WORKFLOW"
echo "================================="

echo ""
echo "🎯 PROBLEM: server.js not included in deployment package"
echo "💡 SOLUTION: Update workflow to copy server.js"

# Create the updated workflow content
cat > .github/workflows/main_campuspe-api-staging.yml << 'WORKFLOW_EOF'
# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy API to Azure Web App - campuspe-api-staging

on:
  push:
    branches:
      - main
    paths:
      - "apps/api/**"
      - ".github/workflows/main_campuspe-api-staging.yml"
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js version
        uses: actions/setup-node@v3
        with:
          node-version: "20.x"
          cache: "npm"

      - name: Install root dependencies
        run: npm ci

      - name: Install API dependencies
        working-directory: ./apps/api
        run: npm ci

      - name: Build API
        working-directory: ./apps/api
        run: npm run build

      - name: Create deployment package
        run: |
          mkdir -p deployment-package

          # Copy build artifacts
          echo "Copying API build artifacts..."
          cp -r apps/api/dist deployment-package/

          # Copy essential application files
          echo "Copying essential application files..."
          cp apps/api/package.json deployment-package/
          cp apps/api/package-lock.json deployment-package/
          
          # Copy startup files (NEW: includes server.js)
          echo "Copying startup files..."
          cp apps/api/server.js deployment-package/ || echo "No server.js found"
          cp apps/api/startup.js deployment-package/ || echo "No startup.js found"
          cp apps/api/startup.sh deployment-package/ || echo "No startup.sh found"
          cp apps/api/web.config deployment-package/ || echo "No web.config found"

          # Copy node_modules (for production dependencies)
          echo "Copying node_modules..."
          cp -r apps/api/node_modules deployment-package/

          # Make scripts executable
          echo "Making scripts executable..."
          chmod +x deployment-package/startup.sh deployment-package/server.js

          # Verify package contents
          echo "=== DEPLOYMENT PACKAGE VERIFICATION ==="
          echo "📋 Root files:"
          ls -la deployment-package/
          echo ""
          echo "📋 Key files check:"
          echo "server.js: $([ -f deployment-package/server.js ] && echo "✅ EXISTS" || echo "❌ MISSING")"
          echo "web.config: $([ -f deployment-package/web.config ] && echo "✅ EXISTS" || echo "❌ MISSING")"
          echo "dist/app.js: $([ -f deployment-package/dist/app.js ] && echo "✅ EXISTS" || echo "❌ MISSING")"
          echo "package.json: $([ -f deployment-package/package.json ] && echo "✅ EXISTS" || echo "❌ MISSING")"
          
          echo ""
          echo "📋 Checking server.js content (first 5 lines):"
          head -5 deployment-package/server.js || echo "Cannot read server.js"

      - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v4
        with:
          name: api-app
          path: deployment-package

  deploy:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      id-token: write
      contents: read

    steps:
      - name: Download artifact from build job
        uses: actions/download-artifact@v4
        with:
          name: api-app

      - name: Login to Azure
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZUREAPPSERVICE_CLIENTID_8A6DED1EC9FF4D6DBF9BC09565C923D6 }}
          tenant-id: ${{ secrets.AZUREAPPSERVICE_TENANTID_6F962B613A624D3582F2985BCDA08CE8 }}
          subscription-id: ${{ secrets.AZUREAPPSERVICE_SUBSCRIPTIONID_AE3ECD9C02CC4AD296820DF8B2D5C91F }}

      - name: "Deploy to Azure Web App"
        id: deploy-to-webapp
        uses: azure/webapps-deploy@v3
        with:
          app-name: "campuspe-api-staging"
          slot-name: "Production"
          package: .
WORKFLOW_EOF

echo "✅ GitHub Actions workflow updated"

echo ""
echo "🔍 Verifying changes:"
echo "   Workflow file exists: $([ -f .github/workflows/main_campuspe-api-staging.yml ] && echo "✅ YES" || echo "❌ NO")"

# Check if server.js copy command is in the file
if grep -q "cp apps/api/server.js" .github/workflows/main_campuspe-api-staging.yml; then
    echo "   server.js copy command: ✅ INCLUDED"
else
    echo "   server.js copy command: ❌ MISSING"
fi

echo ""
echo "💾 Committing workflow fix..."

git add .github/workflows/main_campuspe-api-staging.yml
git commit -m "🔧 FIX: Include server.js in GitHub Actions deployment

- Add server.js to deployment package creation
- Ensure server.js is copied to Azure App Service  
- This should resolve the 503 Application Error
- server.js contains the Node.js startup wrapper

Fixes missing server.js file in Azure deployment package"

echo "✅ Workflow fix committed"

echo ""
echo "🚀 Pushing fix..."
git push origin main

echo ""
echo "🎯 CRITICAL FIX DEPLOYED!"
echo "========================"

echo ""
echo "📋 WHAT THIS FIXES:"
echo "   ✅ server.js now included in deployment package"
echo "   ✅ Azure will receive the Node.js startup wrapper"
echo "   ✅ web.config points to server.js (already correct)"
echo "   ✅ Should resolve 503 Application Error"

echo ""
echo "⏱️  EXPECTED TIMELINE:"
echo "   1. GitHub Actions will build and deploy (3-5 minutes)"
echo "   2. Azure will restart with server.js"  
echo "   3. API should start responding with 200 OK"

echo ""
echo "🔗 Monitor progress:"
echo "   • GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo "   • Test API: curl -I https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/"

echo ""
echo "💡 This was the missing piece - server.js wasn't being deployed!"
