const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Azure App Service startup configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT) || parseInt(process.env.WEBSITES_PORT) || 8080;

console.log('=== CampusPe Web Application Startup ===');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${port}`);
console.log(`Hostname: ${hostname}`);
console.log(`Development mode: ${dev}`);
console.log(`Process PID: ${process.pid}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// Check for required files
const fs = require('fs');
console.log('Checking required files...');
console.log(`package.json exists: ${fs.existsSync('./package.json')}`);
console.log(`next.config.js exists: ${fs.existsSync('./next.config.js')}`);
console.log(`.next directory exists: ${fs.existsSync('./.next')}`);

if (fs.existsSync('./package.json')) {
  const pkg = require('./package.json');
  console.log(`Package name: ${pkg.name}`);
  console.log(`Package version: ${pkg.version}`);
}

// Initialize Next.js app with minimal configuration
const app = next({ 
  dev: false, // Force production mode for Azure
  quiet: false // Enable logging
});
const handle = app.getRequestHandler();

console.log('Preparing Next.js application...');

app.prepare()
  .then(() => {
    console.log('Next.js application prepared successfully');
    
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Request handling error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
      }
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      } else if (err.code === 'EACCES') {
        console.error(`Permission denied for port ${port}`);
        process.exit(1);
      } else {
        console.error('Unknown server error:', err);
        process.exit(1);
      }
    });

    server.listen(port, hostname, (err) => {
      if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
      
      console.log('=== SERVER STARTED SUCCESSFULLY ===');
      console.log(`✅ Server listening on http://${hostname}:${port}`);
      console.log(`✅ Ready to accept requests`);
      console.log(`✅ Environment: ${process.env.NODE_ENV}`);
      console.log('=====================================');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  })
  .catch((err) => {
    console.error('Failed to prepare Next.js application:', err);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
