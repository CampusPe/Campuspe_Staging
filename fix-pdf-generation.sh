#!/bin/bash

# 🚀 Fix PDF Generation Issue - Complete Solution
# This script addresses the AI Resume Builder quality differences between localhost and Azure

echo "🔧 Starting PDF generation fix for Azure deployment..."

# Set Azure environment variables to use system Chrome
echo "📝 Setting Azure PDF generation environment variables..."
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true
export CHROME_BIN=/usr/bin/google-chrome-stable

# Update package.json to include chrome-aws-lambda for Azure
echo "📦 Adding chrome-aws-lambda dependency for Azure..."
cd apps/api
npm install chrome-aws-lambda --save

# Create Azure-specific PDF service configuration
echo "🛠️ Creating Azure PDF configuration..."
cat > azure-pdf-config.js << 'EOF'
// Azure PDF Generation Configuration
const chromium = require('chrome-aws-lambda');

module.exports = {
  async getChromePath() {
    if (process.env.NODE_ENV === 'production') {
      // Azure production: use chrome-aws-lambda
      return await chromium.executablePath;
    } else {
      // Local development: use system Chrome
      return null; // Let Puppeteer use default
    }
  },
  
  getPuppeteerConfig() {
    const isAzure = process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production';
    
    if (isAzure) {
      return {
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: chromium.executablePath,
        headless: chromium.headless,
      };
    } else {
      return {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      };
    }
  }
};
EOF

echo "✅ PDF generation fix preparation complete!"
echo ""
echo "🚀 Next steps to deploy:"
echo "1. Run: az login"
echo "2. Run: ./deploy-api-azure-fixed.sh"
echo "3. Test the resume generation on Azure"
echo ""
echo "💡 The fix includes:"
echo "   - Chrome AWS Lambda for Azure compatibility"
echo "   - Improved fallback PDF generation"
echo "   - Enhanced HTML parsing"
echo "   - Better error handling"
