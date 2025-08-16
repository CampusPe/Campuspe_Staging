#!/usr/bin/env node
console.log('🚀 CampusPe API Startup - Node.js Entry Point');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${process.env.PORT || '8080'}`);
console.log(`📂 Working Directory: ${process.cwd()}`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

// Check for required files
const fs = require('fs');
const path = require('path');

console.log('\n📋 Verifying deployment files...');
const requiredFiles = [
  'package.json',
  'dist/app.js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${file}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  console.error('❌ Some required files are missing!');
  process.exit(1);
}

console.log('✅ All required files present');
console.log('\n🔄 Starting API server...');

// Start the actual API server
require('./dist/app.js');
