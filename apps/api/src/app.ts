import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import studentResumeRoutes from './routes/students-resume';
import studentResumeAIRoutes from './routes/students-resume-ai';
import collegeRoutes from './routes/colleges';
import recruiterRoutes from './routes/recruiters';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import webhookRoutes from './routes/webhook';
import adminRoutes from './routes/admin';
import studentCareerRoutes from './routes/student-career';
import careerAdminRoutes from './routes/career-admin';
import resumeBuilderRoutes from './routes/resume-builder';
import aiResumeBuilderRoutes from './routes/ai-resume-builder';
import generatedResumeRoutes from './routes/generated-resume';
import wabbResumeRoutes from './routes/wabb-resume';
import invitationRoutes from './routes/invitations';
import connectionRoutes from './routes/connections';
import notificationRoutes from './routes/notifications';
import interviewRoutes from './routes/interviews';
import interviewSlotRoutes from './routes/interview-slots';
import healthRoutes from './routes/health';
import debugRoutes from './routes/debug';

import { connectDB } from './utils/database';
import SimpleScheduler from './services/simple-scheduler';

const app = express();

// Azure: bind to 0.0.0.0 and use provided PORT (falls back to 8080 in prod)
const PORT = Number(process.env.PORT || (process.env.NODE_ENV === 'production' ? 8080 : 5001));
const HOST = process.env.HOST || '0.0.0.0';

// Trust proxy so secure cookies & req.protocol work behind Azure’s ELB
app.set('trust proxy', 1);

// ---- Core middlewares (order matters) ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images/fonts if needed
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsers (size limits for resume uploads etc.)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ---- CORS ----
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// If not provided, sensible defaults (local + your two web apps)
if (allowedOrigins.length === 0) {
  allowedOrigins.push(
    'http://localhost:3000',
    'https://dev.campuspe.com',
    'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net'
  );
}

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman/mobile/native
    const ok = allowedOrigins.includes(origin);
    if (ok) return cb(null, true);
    console.warn('CORS blocked origin:', origin, 'Allowed:', allowedOrigins);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin'],
  optionsSuccessStatus: 200,
}));

// Always answer preflights quickly
app.options('*', cors());

// ---- Per-request timeouts ----
app.use((req: Request, res: Response, next: NextFunction) => {
  const long = req.path.includes('analyze-resume') || req.path.includes('upload');
  req.setTimeout(long ? 120000 : 30000);
  res.setTimeout(long ? 120000 : 30000);
  next();
});

// ---- Health / root (fast paths) ----
app.get('/', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'CampusPe API is running',
    health: '/health',
    version: '1.5.1',
    deployment: 'github-actions',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'CampusPe API with Job Matching is running',
    timestamp: new Date().toISOString(),
  });
});

// ---- Routes ----
// Put webhook first if it needs raw body; (if yes, use bodyParser.raw on that route)
app.use('/api/webhook', webhookRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/students', studentResumeAIRoutes);
app.use('/api/students', studentResumeRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student-career', studentCareerRoutes);
app.use('/api/career-admin', careerAdminRoutes);
app.use('/api/resume-builder', resumeBuilderRoutes);
app.use('/api/ai-resume', aiResumeBuilderRoutes);
app.use('/api/generated-resume', generatedResumeRoutes);
app.use('/api/wabb', wabbResumeRoutes);
app.use('/api', invitationRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api', interviewSlotRoutes);
app.use('/api/interviews', interviewSlotRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/debug', debugRoutes);

// ---- 404 ----
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// ---- Error handler (CORS + generic) ----
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const isCors = err?.message === 'Not allowed by CORS';
  if (isCors) {
    // Return a CORS-friendly response so the browser logs the right thing
    return res.status(403).json({ error: 'CORS Rejected', detail: 'Origin not allowed' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---- Start server only after DB connects ----
(async () => {
  try {
    await connectDB();
    app.listen(PORT, HOST, () => {
      console.log(`🚀 CampusPe API listening on http://${HOST}:${PORT}`);
      console.log(`📊 Health: http://${HOST}:${PORT}/health`);
      SimpleScheduler.init();
    });
  } catch (e) {
    console.error('❌ Failed to connect DB, not starting server:', e);
    process.exit(1);
  }
})();
