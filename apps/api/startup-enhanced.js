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
