#!/bin/bash

echo "🚨 EMERGENCY API FIX - Simplified Startup Approach"
echo "=================================================="

echo ""
echo "🔍 PROBLEM: API showing Application Error (503)"
echo "   This usually means the startup script is failing"
echo ""

echo "📋 EMERGENCY FIX STRATEGY:"
echo "   1. Simplify startup to minimal working version"
echo "   2. Use direct Node.js execution instead of wrapper"
echo "   3. Add basic error logging"
echo "   4. Test with minimal dependencies"
echo ""

read -p "❓ Apply emergency fix? This will create a minimal startup (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Emergency fix cancelled"
    exit 1
fi

echo ""
echo "🚀 APPLYING EMERGENCY FIX..."

# Create a minimal startup script that directly runs the compiled app
cat > apps/api/startup-minimal.js << 'MINIMAL_EOF'
#!/usr/bin/env node

// Minimal startup script for Azure App Service
console.log('🔥 CampusPe API Emergency Startup');
console.log('=================================');

// Basic environment setup
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

console.log(`Environment: PORT=${PORT}, HOST=${HOST}`);
console.log(`Working Directory: ${process.cwd()}`);
console.log(`Node Version: ${process.version}`);

// Set required environment variables
process.env.PORT = PORT;
process.env.HOST = HOST;
process.env.NODE_ENV = 'production';

// Basic file check
const fs = require('fs');
if (!fs.existsSync('./dist/app.js')) {
    console.error('❌ FATAL: dist/app.js not found');
    process.exit(1);
}

console.log('✅ dist/app.js found');
console.log('🚀 Starting application...');

// Enhanced error handling
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION:', reason);
    process.exit(1);
});

// Start the application
try {
    require('./dist/app.js');
} catch (error) {
    console.error('💥 STARTUP ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
MINIMAL_EOF

chmod +x apps/api/startup-minimal.js

# Update web.config to use minimal startup
cat > apps/api/web.config << 'WEBCONFIG_EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="startup-minimal.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <match url="/*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="startup-minimal.js" />
        </rule>
      </rules>
    </rewrite>
    <iisnode nodeProcessCommandLine="node" />
  </system.webServer>
</configuration>
WEBCONFIG_EOF

echo "✅ Emergency fix files created"

# Check if the main app.js has any obvious issues
echo ""
echo "🔍 Checking main app.js for obvious issues..."

# Check for common problematic patterns in the compiled app
if grep -q "process.exit" apps/api/dist/app.js; then
    echo "⚠️  WARNING: Found process.exit() in app.js - this could cause immediate shutdown"
fi

if grep -q "require.*\.env" apps/api/dist/app.js; then
    echo "✅ Found dotenv loading in app.js"
fi

if grep -q "app.listen" apps/api/dist/app.js; then
    echo "✅ Found app.listen in app.js"
else
    echo "⚠️  WARNING: No app.listen found in app.js"
fi

echo ""
echo "📊 App.js file size: $(wc -c < apps/api/dist/app.js) bytes"

# Commit and deploy
echo ""
echo "💾 Committing emergency fix..."

git add .
git commit -m "🚨 EMERGENCY: Minimal API startup script

- Created startup-minimal.js with basic error handling
- Removed complex diagnostics that might be causing issues
- Direct execution of dist/app.js
- Simplified web.config configuration

Emergency fix for Application Error 503"

echo "✅ Emergency fix committed"

echo ""
echo "🚀 Pushing emergency fix..."
git push origin main

echo ""
echo "⏰ EMERGENCY FIX DEPLOYED!"
echo "========================="

echo ""
echo "📋 WHAT WAS CHANGED:"
echo "   ✅ Created startup-minimal.js (simplified startup)"
echo "   ✅ Updated web.config to use minimal startup"
echo "   ✅ Removed complex diagnostics that might interfere"
echo "   ✅ Direct Node.js execution of compiled app"

echo ""
echo "⏱️  NEXT STEPS:"
echo "   1. Wait 3-5 minutes for GitHub Actions deployment"
echo "   2. Test API: curl -I $API_URL/health"
echo "   3. If still failing, check Azure logs for simpler error messages"

echo ""
echo "🔗 Monitor deployment:"
echo "   • GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo "   • API URL: https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net"

echo ""
echo "💡 This minimal approach should work if the core app.js is functional."
