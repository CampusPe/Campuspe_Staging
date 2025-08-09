#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CampusPe API Service Startup Wrapper');
console.log('======================================');

// Environment setup
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`Environment: PORT=${PORT}, HOST=${HOST}, NODE_ENV=${NODE_ENV}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`Process: PID=${process.pid}, Node=${process.version}`);

// Check for required files
console.log('Checking required files...');
const requiredFiles = [
    'dist',
    'dist/app.js',
    'package.json'
];

let missingFiles = [];
for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    console.log(`${file}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!exists) {
        missingFiles.push(file);
    }
}

if (missingFiles.length > 0) {
    console.error('❌ Critical files missing:', missingFiles);
    console.error('Cannot start application without these files');
    process.exit(1);
}

// Set environment variables
process.env.PORT = PORT;
process.env.HOST = HOST;
process.env.NODE_ENV = NODE_ENV;

console.log('✅ All required files present');
console.log('🚀 Starting CampusPe API Application...');

// Start the main application
try {
    require('./dist/app.js');
} catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
}
