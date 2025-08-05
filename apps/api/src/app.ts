import 'dotenv/config';
import express from 'express';
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
import debugRoutes from './routes/debug';
import testClaudeRoutes from './routes/test-claude';
import debugDuplicatesRoutes from './routes/debug-duplicates';
import testCentralizedRoutes from './routes/test-centralized';
import { connectDB } from './utils/database';
import SimpleScheduler from './services/simple-scheduler';

const app = express();
const PORT = process.env.PORT || 5001; // Use port 5001 to match frontend expectations
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add timeout middleware for long-running requests
app.use((req, res, next) => {
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

// Health check endpoint
app.get('/health', (req, res) => {
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
app.use('/api/debug', debugRoutes); // Debug routes
app.use('/api/test', testClaudeRoutes); // Test Claude parsing
app.use('/api/debug', debugDuplicatesRoutes); // Debug duplicate students
app.use('/api/test', testCentralizedRoutes); // Test centralized matching

app.use('/api/webhook', webhookRoutes); // WhatsApp webhook enabled for testing

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 CampusPe API is running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);
    console.log(`🤖 Career Opportunity Alert System initialized`);
    
    // Initialize scheduled jobs
    SimpleScheduler.init();
});
