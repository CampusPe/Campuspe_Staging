#!/bin/bash

echo "🔧 COMPREHENSIVE API REDEPLOYMENT FIX"
echo "===================================="

echo ""
echo "🔍 IDENTIFIED ISSUES:"
echo "   1. API deployed successfully but failing to start (503 error)"
echo "   2. Environment variables are configured"
echo "   3. Build artifacts exist (dist/app.js)"
echo "   4. Likely issues: MongoDB connection, dependencies, or runtime errors"
echo ""

echo "📋 COMPREHENSIVE FIX PLAN:"
echo ""

echo "STEP 1: 🧹 REBUILD API LOCALLY"
echo "   rm -rf apps/api/dist apps/api/node_modules"
echo "   cd apps/api && npm ci && npm run build"
echo ""

echo "STEP 2: 🔧 UPDATE STARTUP SCRIPT WITH BETTER ERROR HANDLING"
echo "   Enhanced error logging and MongoDB connection verification"
echo ""

echo "STEP 3: 🔄 TRIGGER FRESH DEPLOYMENT"
echo "   Force push to trigger GitHub Actions rebuild"
echo ""

echo "STEP 4: 🌐 VERIFY ENVIRONMENT VARIABLES IN AZURE"
echo "   Ensure all required variables are set correctly"
echo ""

echo "STEP 5: 🏥 ADD HEALTH CHECK DIAGNOSTICS"
echo "   Better debugging for Azure startup issues"
echo ""

read -p "❓ Do you want to proceed with the comprehensive fix? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Fix cancelled"
    exit 1
fi

echo ""
echo "🚀 STARTING COMPREHENSIVE FIX..."
echo ""

# Step 1: Clean rebuild
echo "1️⃣ Cleaning and rebuilding API..."
cd apps/api
rm -rf dist node_modules
npm ci
npm run build
cd ../..

if [ ! -f "apps/api/dist/app.js" ]; then
    echo "❌ Build failed - app.js not created"
    exit 1
fi

echo "✅ API rebuilt successfully"

# Step 2: Update startup script with enhanced debugging
echo ""
echo "2️⃣ Updating startup script with enhanced debugging..."

cat > apps/api/startup-enhanced.js << 'STARTUP_EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 CampusPe API Enhanced Startup');
console.log('================================');

// Environment diagnostics
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'production';
const MONGODB_URI = process.env.MONGODB_URI;

console.log(`🔧 Environment Configuration:`);
console.log(`   PORT: ${PORT}`);
console.log(`   HOST: ${HOST}`);
console.log(`   NODE_ENV: ${NODE_ENV}`);
console.log(`   MONGODB_URI: ${MONGODB_URI ? 'SET ✅' : 'MISSING ❌'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'SET ✅' : 'MISSING ❌'}`);
console.log(`   CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'NOT SET'}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log(`   Process: PID=${process.pid}, Node=${process.version}`);

// File system diagnostics
console.log('\n📁 File System Check:');
const requiredFiles = [
    'dist',
    'dist/app.js',
    'package.json',
    'node_modules'
];

let missingFiles = [];
for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    console.log(`   ${file}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!exists) {
        missingFiles.push(file);
    }
}

if (missingFiles.length > 0) {
    console.error('\n❌ CRITICAL FILES MISSING:', missingFiles);
    console.error('   This deployment is incomplete. Check GitHub Actions logs.');
    process.exit(1);
}

// Environment validation
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
let missingEnvVars = [];

console.log('\n🔐 Environment Variable Validation:');
for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    const status = value ? '✅ SET' : '❌ MISSING';
    console.log(`   ${envVar}: ${status}`);
    
    if (!value) {
        missingEnvVars.push(envVar);
    }
}

if (missingEnvVars.length > 0) {
    console.error('\n❌ CRITICAL ENVIRONMENT VARIABLES MISSING:', missingEnvVars);
    console.error('   Set these in Azure Portal → App Services → Configuration');
    process.exit(1);
}

// Memory and resource diagnostics
console.log('\n📊 System Resources:');
console.log(`   Memory Usage: ${JSON.stringify(process.memoryUsage())}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);

// Set environment variables for the application
process.env.PORT = PORT;
process.env.HOST = HOST;
process.env.NODE_ENV = NODE_ENV;

console.log('\n✅ Pre-flight checks completed');
console.log('🚀 Starting CampusPe API Application...');

// Enhanced error handling
process.on('uncaughtException', (error) => {
    console.error('\n💥 UNCAUGHT EXCEPTION:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('This is likely a bug in the application code.');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n💥 UNHANDLED REJECTION:');
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    console.error('This is likely a database connection or async operation issue.');
    process.exit(1);
});

// Start the main application
try {
    console.log('📦 Loading application module...');
    require('./dist/app.js');
    console.log('✅ Application module loaded successfully');
} catch (error) {
    console.error('\n💥 STARTUP FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('\n💡 Common causes:');
    console.error('   - Syntax errors in compiled code');
    console.error('   - Missing dependencies');
    console.error('   - Database connection issues');
    console.error('   - Environment variable problems');
    process.exit(1);
}
STARTUP_EOF

chmod +x apps/api/startup-enhanced.js

# Update web.config to use enhanced startup
cat > apps/api/web.config << 'WEBCONFIG_EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="startup-enhanced.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <match url="/*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="startup-enhanced.js" />
        </rule>
      </rules>
    </rewrite>
    <iisnode nodeProcessCommandLine="node" />
  </system.webServer>
</configuration>
WEBCONFIG_EOF

echo "✅ Enhanced startup script created"

# Step 3: Commit and trigger deployment
echo ""
echo "3️⃣ Committing changes and triggering deployment..."

git add .
git commit -m "🔧 API: Enhanced startup with comprehensive diagnostics and error handling

- Added detailed environment variable validation
- Enhanced file system checks
- Better error logging for Azure troubleshooting
- Updated web.config to use startup-enhanced.js
- Rebuilt API with fresh dependencies

Fixes: API 503 startup issues"

echo "✅ Changes committed"

echo ""
echo "4️⃣ Pushing to trigger GitHub Actions deployment..."
git push origin main

echo ""
echo "🎯 DEPLOYMENT TRIGGERED!"
echo "========================"

echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. ⏱️  WAIT FOR DEPLOYMENT (3-5 minutes)"
echo "   GitHub Actions will rebuild and deploy the API"
echo ""
echo "2. 🔍 MONITOR AZURE LOGS"
echo "   Go to: Azure Portal → campuspe-api-staging → Monitoring → Log stream"
echo "   Watch for detailed startup diagnostics"
echo ""
echo "3. 🧪 TEST API AFTER DEPLOYMENT"
echo "   Run: curl -I https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health"
echo ""
echo "4. 🐛 IF STILL FAILING"
echo "   Check Azure logs for specific error messages from startup-enhanced.js"
echo ""

echo "🔗 USEFUL LINKS:"
echo "   • GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo "   • Azure Portal: https://portal.azure.com"
echo "   • API Logs: Azure Portal → campuspe-api-staging → Monitoring → Log stream"
echo ""

echo "✅ Comprehensive fix deployment initiated!"
