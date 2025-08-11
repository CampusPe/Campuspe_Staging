#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CampusPe Web Service Enhanced Startup');
console.log('=====================================');

// Environment setup
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'production';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

console.log(`🔧 Environment Configuration:`);
console.log(`   PORT: ${PORT}`);
console.log(`   HOST: ${HOST}`);
console.log(`   NODE_ENV: ${NODE_ENV}`);
console.log(`   API_URL: ${API_URL || 'NOT SET'}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log(`   Process: PID=${process.pid}, Node=${process.version}`);
console.log(`   Platform: ${process.platform}, Arch: ${process.arch}`);

// Enhanced file checking
console.log('\n📁 Checking deployment structure...');
const requiredItems = [
    { path: '.next', type: 'directory', critical: true },
    { path: 'pages', type: 'directory', critical: true },
    { path: 'package.json', type: 'file', critical: true },
    { path: 'node_modules', type: 'directory', critical: true },
    { path: 'public', type: 'directory', critical: false },
    { path: 'server-azure-debug.js', type: 'file', critical: false },
    { path: 'server-azure.js', type: 'file', critical: false },
    { path: 'server.js', type: 'file', critical: false }
];

let missingCritical = [];
let serverFile = null;

for (const item of requiredItems) {
    const exists = fs.existsSync(item.path);
    const isCorrectType = exists && (
        (item.type === 'directory' && fs.statSync(item.path).isDirectory()) ||
        (item.type === 'file' && fs.statSync(item.path).isFile())
    );
    
    const status = exists && isCorrectType ? '✅ EXISTS' : '❌ MISSING';
    const importance = item.critical ? 'CRITICAL' : 'OPTIONAL';
    
    console.log(`   ${item.path} (${item.type}): ${status} [${importance}]`);
    
    if (item.critical && (!exists || !isCorrectType)) {
        missingCritical.push(item.path);
    }
    
    // Find available server file
    if (exists && item.path.includes('server') && item.path.endsWith('.js')) {
        if (!serverFile || item.path.includes('azure')) {
            serverFile = item.path;
        }
    }
}

// Check critical files
if (missingCritical.length > 0) {
    console.error('\n❌ CRITICAL FILES MISSING:');
    missingCritical.forEach(file => console.error(`   - ${file}`));
    console.error('\n💡 This usually means the deployment package was created incorrectly.');
    console.error('   Check GitHub Actions logs for build/deployment issues.');
    process.exit(1);
}

// Check for pages directory content
if (fs.existsSync('pages')) {
    const pagesContent = fs.readdirSync('pages');
    console.log(`\n📄 Pages directory contains ${pagesContent.length} items:`);
    console.log(`   ${pagesContent.slice(0, 5).join(', ')}${pagesContent.length > 5 ? '...' : ''}`);
} else {
    console.error('\n❌ FATAL: pages directory not found!');
    console.error('   This is required for Next.js to work.');
    process.exit(1);
}

// Check Next.js build
if (fs.existsSync('.next')) {
    const nextContent = fs.readdirSync('.next');
    console.log(`\n🏗️  .next directory contains ${nextContent.length} items:`);
    console.log(`   ${nextContent.slice(0, 5).join(', ')}${nextContent.length > 5 ? '...' : ''}`);
    
    if (!nextContent.includes('BUILD_ID')) {
        console.error('⚠️  Warning: BUILD_ID not found in .next directory');
        console.error('   The Next.js build may be incomplete');
    }
} else {
    console.error('\n❌ FATAL: .next directory not found!');
    console.error('   Next.js build artifacts are missing.');
    process.exit(1);
}

// Environment variable validation
console.log('\n🔍 Environment Variable Validation:');
const requiredEnvVars = [
    'PORT',
    'NODE_ENV',
    'NEXT_PUBLIC_API_URL'
];

let missingEnvVars = [];
for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    const status = value ? '✅ SET' : '❌ MISSING';
    console.log(`   ${envVar}: ${status}${value ? ` (${value.substring(0, 50)}${value.length > 50 ? '...' : ''})` : ''}`);
    
    if (!value) {
        missingEnvVars.push(envVar);
    }
}

if (missingEnvVars.length > 0) {
    console.error('\n⚠️  WARNING: Missing environment variables:');
    missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\n💡 Set these in Azure Portal → App Services → Configuration → Application settings');
}

// Set environment variables
process.env.PORT = PORT;
process.env.HOST = HOST;
process.env.NODE_ENV = NODE_ENV;

console.log('\n✅ Pre-flight checks completed');

// Determine server file to use
if (!serverFile) {
    console.error('\n❌ FATAL: No server file found!');
    console.error('   Expected one of: server-azure-debug.js, server-azure.js, server.js');
    process.exit(1);
}

console.log(`\n🚀 Starting application with: ${serverFile}`);
console.log('=====================================\n');

// Start the main application with enhanced error handling
try {
    // Set up process error handlers
    process.on('uncaughtException', (error) => {
        console.error('💥 UNCAUGHT EXCEPTION:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 UNHANDLED REJECTION at:', promise);
        console.error('Reason:', reason);
        process.exit(1);
    });

    // Load and start the server
    require(`./${serverFile}`);
    
} catch (error) {
    console.error('\n💥 STARTUP FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('\n💡 Check the server file for syntax errors or missing dependencies');
    process.exit(1);
}
