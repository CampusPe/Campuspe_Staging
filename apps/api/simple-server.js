#!/usr/bin/env node
// Simple server for Azure deployment troubleshooting
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 SIMPLE SERVER STARTING...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Port: ${PORT}, Host: ${HOST}`);

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: [
    'https://dev.campuspe.com',
    'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Simple routes
app.get('/', (req, res) => {
  console.log('📍 Root route accessed!');
  res.json({
    status: 'OK',
    message: 'CampusPe API is running - SIMPLE VERSION',
    timestamp: new Date().toISOString(),
    version: '1.0.0-simple'
  });
});

app.get('/health', (req, res) => {
  console.log('📍 Health route accessed!');
  res.json({
    status: 'OK',
    message: 'Simple health check',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Not Found', 
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Simple server listening on http://${HOST}:${PORT}`);
  console.log(`📊 Health: http://${HOST}:${PORT}/health`);
  console.log(`🏠 Root: http://${HOST}:${PORT}/`);
  console.log(`🧪 Test: http://${HOST}:${PORT}/test`);
  console.log('✅ Simple server started successfully!');
});
