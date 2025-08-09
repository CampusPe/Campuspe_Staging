const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');

const { execSync } = require('child_process');


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


// Check for required files and artifacts
// Check for required files


const fs = require('fs');
const { execSync } = require('child_process');

]
console.log('Checking required files...');
console.log(`package.json exists: ${fs.existsSync('./package.json')}`);
console.log(`next.config.js exists: ${fs.existsSync('./next.config.js')}`);
const hasNextModule = fs.existsSync('./node_modules/next');
console.log(`node_modules/next exists: ${hasNextModule}`);
const hasNextBuild = fs.existsSync('./.next');
console.log(`.next directory exists: ${hasNextBuild}`);

if (!hasNextModule) {
  console.error('Missing dependency: next. Ensure node_modules is included in the deployment package.');
  process.exit(1);
}

if (!hasNextBuild) {
  console.error('Missing build artifacts: .next. Run `npm run build` before deploying.');
  process.exit(1);
}

// Load Next.js now that dependencies are confirmed
let next;
try {
  next = require('next');
} catch (err) {
  console.error('Failed to load Next.js:', err);
  process.exit(1);
}

// Ensure dependencies are installed. Azure's build pipeline may
// skip node_modules, so install them (including dev deps for build)
// on startup if "next" is missing.
console.log(`node_modules/next exists: ${fs.existsSync('./node_modules/next')}`);
if (!fs.existsSync('./node_modules/next')) {
  console.log('node_modules missing – running `npm ci --include=dev`...');
  try {
    execSync('npm ci --include=dev', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to install dependencies:', err);
    process.exit(1);
  }
}


// Now that dependencies are ensured, load Next.js
let next;
try {
  next = require('next');
} catch (err) {
  console.error('Failed to load Next.js:', err);
  process.exit(1);
}

// Ensure Next.js build artifacts exist. If the .next directory is missing
// (common on Azure when the build step was skipped), attempt a production
// build on startup so the server can boot successfully.
if (!fs.existsSync('./.next')) {
  console.log('.next directory missing – running `npm run build`...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to build Next.js application:', err);
    process.exit(1);
  }

  if (!fs.existsSync('./.next')) {
    console.error('Build completed but .next directory still missing.');
    process.exit(1);
  }
  console.log('.next directory generated successfully.');
}

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
