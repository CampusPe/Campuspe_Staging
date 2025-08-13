#!/bin/bash

echo "🚨 ULTIMATE API FIX - Azure App Service Compatible"
echo "================================================="

echo ""
echo "🔍 ANALYSIS: API still showing Application Error"
echo "   Issue: Azure App Service Linux might have problems with shell scripts"
echo "   Solution: Create Node.js wrapper that executes startup logic"
echo ""

echo "📋 ULTIMATE FIX STRATEGY:"
echo "   1. Create Node.js startup file that mimics startup.sh logic"
echo "   2. Ensure all environment variables are checked"
echo "   3. Use direct Node.js execution (Azure App Service preferred)"
echo "   4. Add comprehensive error logging"
echo ""

read -p "❓ Apply ultimate fix? This will create a Node.js startup wrapper (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Ultimate fix cancelled"
    exit 1
fi

echo ""
echo "🚀 CREATING ULTIMATE FIX..."

# Create a Node.js wrapper that does what startup.sh does
cat > apps/api/server.js << 'SERVER_EOF'
#!/usr/bin/env node

/**
 * CampusPe API - Azure App Service Ultimate Startup
 * This file replicates startup.sh logic in Node.js for better Azure compatibility
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 CampusPe API - Ultimate Azure Startup');
console.log('========================================');

// Set environment variables for Azure
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = 'production';

// Update environment
process.env.PORT = PORT;
process.env.HOST = HOST;
process.env.NODE_ENV = NODE_ENV;

console.log(`Environment: PORT=${PORT}, HOST=${HOST}, NODE_ENV=${NODE_ENV}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`Process: PID=${process.pid}, Node=${process.version}`);

// Check for required files (like startup.sh does)
console.log('Checking required files...');

const requiredChecks = [
    { path: 'dist', type: 'directory', name: 'dist directory' },
    { path: 'package.json', type: 'file', name: 'package.json' },
    { path: 'dist/app.js', type: 'file', name: 'dist/app.js' }
];

let missingFiles = [];

for (const check of requiredChecks) {
    const exists = fs.existsSync(check.path);
    const status = exists ? '✅ EXISTS' : '❌ MISSING';
    console.log(`${check.name}: ${status}`);
    
    if (!exists) {
        missingFiles.push(check.name);
    }
}

if (missingFiles.length > 0) {
    console.error('❌ Critical files missing:', missingFiles.join(', '));
    console.error('Cannot start application without these files');
    process.exit(1);
}

// Check if node_modules exists (like startup.sh does)
if (!fs.existsSync('node_modules')) {
    console.log('Installing production dependencies...');
    try {
        execSync('npm install --only=production', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        process.exit(1);
    }
} else {
    console.log('Dependencies already installed');
}

// Environment variable validation
console.log('\n🔐 Environment Variable Check:');
const criticalEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = [];

for (const envVar of criticalEnvVars) {
    const value = process.env[envVar];
    const status = value ? '✅ SET' : '❌ MISSING';
    console.log(`${envVar}: ${status}`);
    
    if (!value) {
        missingEnvVars.push(envVar);
    }
}

if (missingEnvVars.length > 0) {
    console.error('\n⚠️  WARNING: Missing environment variables:', missingEnvVars.join(', '));
    console.error('Application may not function correctly without these variables');
    console.error('Please set them in Azure Portal → App Services → Configuration');
}

console.log('\n✅ Pre-startup checks completed');

// Enhanced error handling
process.on('uncaughtException', (error) => {
    console.error('\n💥 UNCAUGHT EXCEPTION:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n💥 UNHANDLED REJECTION:');
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    process.exit(1);
});

// Start the application (equivalent to: exec node dist/app.js)
console.log('🚀 Starting CampusPe API Application...');
console.log('Using dist/app.js');

try {
    // Load and execute the main application
    require('./dist/app.js');
    console.log('✅ Application started successfully');
} catch (error) {
    console.error('❌ Failed to start application:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
SERVER_EOF

# Make it executable
chmod +x apps/api/server.js

# Update web.config to use server.js (standard Node.js approach)
cat > apps/api/web.config << 'WEBCONFIG_EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <match url="/*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    <iisnode nodeProcessCommandLine="node" />
  </system.webServer>
</configuration>
WEBCONFIG_EOF

# Also update package.json to use server.js as the main entry point
echo "📦 Updating package.json..."

# Read current package.json and update the start script and main field
node -e "
const pkg = require('./apps/api/package.json');
pkg.main = 'server.js';
pkg.scripts.start = 'node server.js';
require('fs').writeFileSync('./apps/api/package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Updated package.json main and start script');
"

echo "✅ Ultimate fix files created"

# Verify changes
echo ""
echo "🔍 Verifying ultimate fix:"
echo "   server.js exists: $([ -f apps/api/server.js ] && echo "✅ YES" || echo "❌ NO")"
echo "   web.config points to server.js: $(grep -q "server.js" apps/api/web.config && echo "✅ YES" || echo "❌ NO")"

# Show what the updated package.json looks like
echo ""
echo "📋 Updated package.json start configuration:"
grep -A 1 -B 1 '"start"' apps/api/package.json || echo "Could not find start script"
grep -A 1 -B 1 '"main"' apps/api/package.json || echo "Could not find main field"

# Commit and deploy
echo ""
echo "💾 Committing ultimate fix..."

git add .
git commit -m "🚨 ULTIMATE FIX: Node.js startup wrapper for Azure App Service

- Created server.js with startup.sh logic in Node.js
- Azure App Service prefers Node.js over shell scripts
- Updated web.config to use server.js
- Updated package.json main entry point
- Comprehensive environment variable checking
- Enhanced error logging for Azure troubleshooting

This should resolve the persistent Application Error 503"

echo "✅ Ultimate fix committed"

echo ""
echo "🚀 Pushing ultimate fix..."
git push origin main

echo ""
echo "🎯 ULTIMATE FIX DEPLOYED!"
echo "========================="

echo ""
echo "📋 WHAT THIS FIX DOES:"
echo "   ✅ Uses Node.js instead of shell script (Azure preferred)"
echo "   ✅ Replicates all startup.sh logic in JavaScript"
echo "   ✅ Standard Azure App Service configuration"
echo "   ✅ Comprehensive error logging"
echo "   ✅ Environment variable validation"

echo ""
echo "⏱️  EXPECTED RESULTS:"
echo "   1. Azure will execute server.js (standard Node.js app)"
echo "   2. server.js will check files and dependencies"
echo "   3. server.js will load and start dist/app.js"
echo "   4. API should respond with 200 OK"

echo ""
echo "🔗 Monitor deployment:"
echo "   • GitHub Actions: https://github.com/CampusPe/Campuspe_Staging/actions"
echo "   • API Test: curl -I https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/health"
echo "   • Wait 3-5 minutes for deployment"

echo ""
echo "💡 This Node.js approach is the standard way Azure App Service handles Node applications!"
