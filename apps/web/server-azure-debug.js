const { createServer } = require('http');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Enhanced logging for Azure diagnostics
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] AZURE-WEB-SERVER: ${message}`);
}

log('=== AZURE WEB SERVER STARTUP ===');

// Environment diagnostics
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'production';

log(`Environment: PORT=${PORT}, HOST=${HOST}, NODE_ENV=${NODE_ENV}`);
log(`Process: PID=${process.pid}, Platform=${process.platform}, Node=${process.version}`);
log(`Working Directory: ${process.cwd()}`);

// File system diagnostics
const requiredFiles = [
  'package.json',
  'next.config.js',
  '.next/BUILD_ID'
];

log('Checking required files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  log(`${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Directory diagnostics
log('Checking directories...');
const dirs = ['.next', 'node_modules', 'pages', 'public'];
dirs.forEach(dir => {
  const exists = fs.existsSync(path.join(process.cwd(), dir));
  log(`${dir}/: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Memory and resource info
log(`Memory Usage: ${JSON.stringify(process.memoryUsage())}`);

// Initialize Next.js
log('Initializing Next.js application...');
const dev = NODE_ENV !== 'production';
const app = next({ dev, dir: process.cwd() });
const handle = app.getRequestHandler();

// Error handling
process.on('uncaughtException', (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.message}`);
  log(`Stack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`UNHANDLED REJECTION at ${promise}: ${reason}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

async function startServer() {
  try {
    log('Preparing Next.js application...');
    await app.prepare();
    log('Next.js application prepared successfully');

    log('Creating HTTP server...');
    const server = createServer((req, res) => {
      // Log all requests for debugging
      log(`${req.method} ${req.url} - ${req.headers['user-agent']?.substring(0, 50) || 'unknown'}`);
      
      // Handle all requests with Next.js
      handle(req, res);
    });

    log(`Starting server on ${HOST}:${PORT}...`);
    server.listen(PORT, HOST, (err) => {
      if (err) {
        log(`Failed to start server: ${err.message}`);
        throw err;
      }
      log(`🚀 Server successfully started on http://${HOST}:${PORT}`);
      log(`Environment: ${NODE_ENV}`);
      log(`Ready to handle requests!`);
    });

    // Server error handling
    server.on('error', (err) => {
      log(`Server error: ${err.message}`);
      if (err.code === 'EADDRINUSE') {
        log(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    log(`Startup error: ${error.message}`);
    log(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Start the server
log('Starting server initialization...');
startServer().catch(err => {
  log(`Failed to start server: ${err.message}`);
  log(`Stack: ${err.stack}`);
  process.exit(1);
});
