#!/bin/bash

# 🚀 Quick Fix Script for PDF Generation Issue
echo "🔧 Applying PDF generation fix for Azure compatibility..."

# Step 1: Install chrome-aws-lambda
echo "📦 Installing chrome-aws-lambda..."
cd apps/api
npm install chrome-aws-lambda --save

# Step 2: Create environment variables file for Azure
echo "📝 Creating Azure environment variables..."
cat > azure-env-vars.txt << 'EOF'
# Add these to Azure Portal → Configuration → Application Settings

PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
CHROME_BIN=/usr/bin/google-chrome-stable
NODE_ENV=production

# Optional: For debugging
PUPPETEER_DEBUG=true
PDF_GENERATION_DEBUG=true
EOF

echo "✅ Fix preparation complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Set environment variables in Azure Portal (see azure-env-vars.txt)"
echo "2. Deploy: git add . && git commit -m 'Fix PDF generation' && git push"
echo "3. Test resume generation on Azure"
echo ""
echo "📋 Environment variables to set in Azure Portal:"
cat azure-env-vars.txt
echo ""
echo "🔗 Azure Portal: https://portal.azure.com"
