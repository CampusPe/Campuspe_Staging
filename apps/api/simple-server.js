console.log('=== SIMPLE SERVER STARTING ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('PWD:', process.cwd());

const express = require('express');
const app = express();

// Unique deployment ID
const DEPLOYMENT_ID = `DEPLOY_${Date.now()}`;
console.log('Deployment ID:', DEPLOYMENT_ID);

// CORS configuration for frontend access
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://dev.campuspe.com',
    'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Basic middleware
app.use(express.json());

// Routes with unique deployment marker
app.get('/', (req, res) => {
  console.log('Root route hit at:', new Date().toISOString());
  res.status(200).json({ 
    message: 'SIMPLE SERVER IS WORKING!',
    deployment: DEPLOYMENT_ID,
    timestamp: new Date().toISOString(),
    server: 'simple-express',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  console.log('Health check at:', new Date().toISOString());
  res.status(200).json({ 
    status: 'healthy',
    deployment: DEPLOYMENT_ID,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/test', (req, res) => {
  console.log('Test route hit at:', new Date().toISOString());
  res.status(200).json({ 
    test: 'passed',
    deployment: DEPLOYMENT_ID,
    headers: req.headers,
    query: req.query
  });
});

// API routes that frontend expects
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt at:', new Date().toISOString(), 'Body:', req.body);
  
  // Create a simple JWT-like token structure (header.payload.signature)
  // This is a valid JWT format that won't cause decoding errors
  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({ 
    id: 'test-user',
    email: req.body?.email || 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour from now
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64');
  const signature = 'simple-server-signature';
  const token = `${header}.${payload}.${signature}`;
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    deployment: DEPLOYMENT_ID,
    data: {
      user: { 
        id: 'test-user', 
        email: req.body?.email || 'test@example.com',
        name: 'Test User'
      },
      token: token
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  console.log('Get user info at:', new Date().toISOString());
  console.log('Authorization header:', req.headers.authorization);
  
  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided'
    });
  }
  
  // Extract and validate token
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (!token || token === 'undefined') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      user: { 
        id: 'test-user', 
        email: 'test@example.com', 
        name: 'Test User',
        role: 'user'
      }
    }
  });
});

app.get('/api/health', (req, res) => {
  console.log('API health check at:', new Date().toISOString());
  res.status(200).json({
    status: 'healthy',
    api: 'working',
    deployment: DEPLOYMENT_ID,
    timestamp: new Date().toISOString()
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  console.log('Unknown route:', req.originalUrl, 'at:', new Date().toISOString());
  res.status(404).json({ 
    error: 'Route not found',
    deployment: DEPLOYMENT_ID,
    path: req.originalUrl,
    method: req.method
  });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`=== SIMPLE SERVER RUNNING ON PORT ${port} ===`);
  console.log(`Deployment ID: ${DEPLOYMENT_ID}`);
  console.log('Server ready at:', new Date().toISOString());
});

// Handle process events
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
