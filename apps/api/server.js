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
