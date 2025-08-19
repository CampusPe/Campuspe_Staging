#!/usr/bin/env node

/**
 * Deployment Verification Script for Azure
 * This script helps verify that all WABB routes are properly deployed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying WABB Integration Deployment...\n');

// Check 1: Verify dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist/ folder not found. Run "npm run build" first.');
  process.exit(1);
}
console.log('✅ dist/ folder exists');

// Check 2: Verify app.js exists
const appPath = path.join(distPath, 'app.js');
if (!fs.existsSync(appPath)) {
  console.error('❌ dist/app.js not found. Build may have failed.');
  process.exit(1);
}
console.log('✅ dist/app.js exists');

// Check 3: Verify WABB routes exist
const wabbRoutesPath = path.join(distPath, 'routes', 'wabb-resume.js');
if (!fs.existsSync(wabbRoutesPath)) {
  console.error('❌ WABB routes not compiled. Check TypeScript compilation.');
  process.exit(1);
}
console.log('✅ WABB routes compiled');

// Check 4: Verify routes are mounted in app.js
const appContent = fs.readFileSync(appPath, 'utf8');
if (!appContent.includes("app.use('/api/wabb'")) {
  console.error('❌ WABB routes not mounted in app.js');
  process.exit(1);
}
console.log('✅ WABB routes mounted in app.js');

// Check 5: List all available endpoints
console.log('\n📋 Available WABB Endpoints:');
console.log('  POST /api/wabb/create-resume');
console.log('  POST /api/wabb/generate-and-share');

// Check 6: Verify deployment files
const requiredFiles = [
  'package.json',
  'server.js',
  'web.config'
];

console.log('\n📦 Deployment Files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${file}: ${exists ? '✅' : '❌'}`);
});

console.log('\n🚀 Deployment Verification Complete!');
console.log('\n📝 Next Steps for Azure:');
console.log('1. Upload all files to Azure App Service');
console.log('2. Set environment variables in Azure Configuration');
console.log('3. Restart the Azure App Service');
console.log('4. Test the endpoint: https://your-app.azurewebsites.net/api/wabb/generate-and-share');

console.log('\n🧪 Test Command:');
console.log(`curl -X POST https://your-app.azurewebsites.net/api/wabb/generate-and-share \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"email":"test@example.com","phone":"+919156621088","jobDescription":"Software engineer"}'`);
