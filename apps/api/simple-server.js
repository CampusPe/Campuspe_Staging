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
  console.log('Login request received:', req.body);
  
  // Create a more realistic JWT token structure for testing
  const payload = {
    id: 'test-user',
    userId: 'test-user-id',
    email: req.body.email || 'test@example.com',
    role: 'student', // Default role for testing
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Create a mock JWT token (header.payload.signature)
  const header = Buffer.from(JSON.stringify({typ: 'JWT', alg: 'HS256'})).toString('base64');
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'simple-server-signature';
  const token = `${header}.${payloadBase64}.${signature}`;
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    deployment: DEPLOYMENT_ID,
    token: token, // Frontend expects token directly in response.data
    user: {
      id: payload.id,
      userId: payload.userId,
      email: payload.email,
      name: 'Test User',
      role: payload.role
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  console.log('Auth me request:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
      deployment: DEPLOYMENT_ID
    });
  }
  
  // Mock user data for testing
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    user: {
      id: 'test-user',
      userId: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'student'
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

// Student profile endpoint
app.get('/api/students/user/:userId', (req, res) => {
  console.log('Student profile request for userId:', req.params.userId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      id: 'test-student-id',
      userId: req.params.userId,
      name: 'Test Student',
      email: 'test@example.com',
      college: 'Test College',
      branch: 'Computer Science',
      year: 3
    }
  });
});

// Recruiter profile endpoint
app.get('/api/recruiters/user/:userId', (req, res) => {
  console.log('Recruiter profile request for userId:', req.params.userId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      id: 'test-recruiter-id',
      userId: req.params.userId,
      name: 'Test Recruiter',
      email: 'test@example.com',
      company: 'Test Company',
      position: 'HR Manager'
    }
  });
});

// College profile endpoint
app.get('/api/colleges/user/:userId', (req, res) => {
  console.log('College profile request for userId:', req.params.userId);
  res.status(200).json({
    success: true,
    deployment: DEPLOYMENT_ID,
    data: {
      id: 'test-college-id',
      userId: req.params.userId,
      name: 'Test College',
      email: 'test@example.com',
      location: 'Test City',
      type: 'Engineering'
    }
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
