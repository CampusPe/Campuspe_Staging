import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import studentResumeRoutes from './routes/students-resume';
import studentResumeAIRoutes from './routes/students-resume-ai';
import collegeRoutes from './routes/colleges';
import recruiterRoutes from './routes/recruiters';
import jobRoutes from './routes/jobs';
import webhookRoutes from './routes/webhook';
import adminRoutes from './routes/admin';
import studentCareerRoutes from './routes/student-career';
import careerAdminRoutes from './routes/career-admin';
import resumeBuilderRoutes from './routes/resume-builder';
import aiResumeBuilderRoutes from './routes/ai-resume-builder';
import generatedResumeRoutes from './routes/generated-resume';
import wabbResumeRoutes from './routes/wabb-resume';
import invitationRoutes from './routes/invitations';
import interviewSlotRoutes from './routes/interview-slots';
import { connectDB } from './utils/database';
import SimpleScheduler from './services/simple-scheduler';

const app = express();
// Azure App Service expects Node apps to bind to port 8080 and 0.0.0.0. If
// these env vars are missing, default accordingly to avoid 503 errors.
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
        [
          'http://localhost:3000',
          'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net',
          'https://campuspe-web-staging-new.azurewebsites.net'
        ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin, 'Allowed:', allowedOrigins);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Remove the explicit OPTIONS handler since cors middleware handles it better

// Add timeout middleware for long-running requests
app.use((req: Request, res: Response, next: NextFunction) => {
  // Set longer timeout for resume upload endpoints
  if (req.path.includes('analyze-resume') || req.path.includes('upload')) {
    req.setTimeout(120000); // 2 minutes for resume processing
    res.setTimeout(120000);
  } else {
    req.setTimeout(30000); // 30 seconds for other requests
    res.setTimeout(30000);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint for basic connectivity checks
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'CampusPe API is running',
    health: '/health',
    version: '1.5.0',  // Updated CORS for new web app
    deployment: 'github-actions'
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'CampusPe API with Job Matching is running',
    timestamp: new Date().toISOString() 
  });
});

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentResumeAIRoutes); // AI-powered resume analysis - mount first
app.use('/api/students', studentResumeRoutes); // Resume upload endpoints - mount second
app.use('/api/students', studentRoutes); // General student routes - mount last for fallback
app.use('/api/colleges', collegeRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student-career', studentCareerRoutes);
app.use('/api/career-admin', careerAdminRoutes);
app.use('/api/resume-builder', resumeBuilderRoutes); // New resume builder routes
app.use('/api/ai-resume', aiResumeBuilderRoutes); // AI-powered resume builder routes
app.use('/api/generated-resume', generatedResumeRoutes); // Generated resume management routes
app.use('/api/wabb', wabbResumeRoutes); // WABB WhatsApp integration routes
app.use('/api', invitationRoutes);
app.use('/api', interviewSlotRoutes);

app.use('/api/webhook', webhookRoutes); // WhatsApp webhook enabled for testing

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 CampusPe API is running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);
    console.log(`🤖 Career Opportunity Alert System initialized`);
    
    // Initialize scheduled jobs
    SimpleScheduler.init();
});
