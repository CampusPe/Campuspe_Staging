"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const auth_1 = __importDefault(require("./routes/auth"));
const students_1 = __importDefault(require("./routes/students"));
const students_resume_1 = __importDefault(require("./routes/students-resume"));
const students_resume_ai_1 = __importDefault(require("./routes/students-resume-ai"));
const colleges_1 = __importDefault(require("./routes/colleges"));
const recruiters_1 = __importDefault(require("./routes/recruiters"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const applications_1 = __importDefault(require("./routes/applications"));
const webhook_1 = __importDefault(require("./routes/webhook"));
const admin_1 = __importDefault(require("./routes/admin"));
const student_career_1 = __importDefault(require("./routes/student-career"));
const career_admin_1 = __importDefault(require("./routes/career-admin"));
const resume_builder_1 = __importDefault(require("./routes/resume-builder"));
const ai_resume_builder_1 = __importDefault(require("./routes/ai-resume-builder"));
const generated_resume_1 = __importDefault(require("./routes/generated-resume"));
const wabb_resume_1 = __importDefault(require("./routes/wabb-resume"));
const wabb_complete_simple_1 = __importDefault(require("./routes/wabb-complete-simple"));
const wabb_helpers_1 = __importDefault(require("./routes/wabb-helpers"));
const invitations_1 = __importDefault(require("./routes/invitations"));
const connections_1 = __importDefault(require("./routes/connections"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const interviews_1 = __importDefault(require("./routes/interviews"));
const interview_slots_1 = __importDefault(require("./routes/interview-slots"));
const health_1 = __importDefault(require("./routes/health"));
const debug_1 = __importDefault(require("./routes/debug"));
const fileUpload_1 = __importDefault(require("./routes/fileUpload"));
const database_1 = require("./utils/database");
const simple_scheduler_1 = __importDefault(require("./services/simple-scheduler"));
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || (process.env.NODE_ENV === 'production' ? 8080 : 5001));
const HOST = process.env.HOST || '0.0.0.0';
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
const corsOriginEnv = process.env.CORS_ORIGIN || '';
console.log('🔍 CORS_ORIGIN env var:', corsOriginEnv);
const allowedOrigins = corsOriginEnv
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:3000', 'https://dev.campuspe.com', 'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net');
}
console.log('🌐 Allowed CORS origins:', allowedOrigins);
app.use((0, cors_1.default)({
    origin: function (origin, cb) {
        console.log('🔍 CORS check for origin:', origin);
        if (!origin) {
            console.log('✅ CORS: No origin (server-to-server)');
            return cb(null, true);
        }
        const ok = allowedOrigins.includes(origin);
        if (ok) {
            console.log('✅ CORS: Origin allowed:', origin);
            return cb(null, origin);
        }
        console.warn('❌ CORS blocked origin:', origin, 'Allowed:', allowedOrigins);
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200,
}));
app.options('*', (0, cors_1.default)());
app.use((req, res, next) => {
    const long = req.path.includes('analyze-resume') || req.path.includes('upload');
    req.setTimeout(long ? 120000 : 30000);
    res.setTimeout(long ? 120000 : 30000);
    next();
});
console.log('🚀 Registering root route...');
app.get('/', (_req, res) => {
    console.log('📍 Root route accessed!');
    res.json({
        status: 'OK',
        message: 'CampusPe API is running',
        health: '/health',
        version: '1.5.1',
        deployment: 'github-actions',
        timestamp: new Date().toISOString(),
    });
});
console.log('🏥 Registering health route...');
app.get('/health', (_req, res) => {
    console.log('📍 Health route accessed!');
    const dbStatus = mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'OK',
        message: 'CampusPe API with Job Matching is running',
        database: dbStatus,
        timestamp: new Date().toISOString(),
    });
});
console.log('📁 Setting up static file serving...');
const path = require('path');
app.use('/uploads', express_1.default.static(path.join(__dirname, '..', 'uploads')));
console.log('✅ Static files served from /uploads');
console.log('🛣️  Registering API routes...');
app.use('/api/webhook', webhook_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/students', students_resume_ai_1.default);
app.use('/api/students', students_resume_1.default);
app.use('/api/students', students_1.default);
app.use('/api/colleges', colleges_1.default);
app.use('/api/recruiters', recruiters_1.default);
app.use('/api/jobs', jobs_1.default);
app.use('/api/applications', applications_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/student-career', student_career_1.default);
app.use('/api/career-admin', career_admin_1.default);
app.use('/api/resume-builder', resume_builder_1.default);
app.use('/api/ai-resume-builder', ai_resume_builder_1.default);
app.use('/api/generated-resume', generated_resume_1.default);
app.use('/api/wabb', wabb_resume_1.default);
app.use('/api/wabb', wabb_helpers_1.default);
app.use('/api/wabb', wabb_complete_simple_1.default);
app.use('/api/wabb-flows', require('./routes/wabb-flows').default);
app.use('/api/whatsapp-admin', require('./routes/whatsapp-admin').default);
app.use('/api', invitations_1.default);
app.use('/api/connections', connections_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/interviews', interviews_1.default);
app.use('/api', interview_slots_1.default);
app.use('/api/interviews', interview_slots_1.default);
app.use('/api/health', health_1.default);
app.use('/api/debug', debug_1.default);
app.use('/api/files', fileUpload_1.default);
console.log('✅ All API routes registered successfully');
console.log('🚫 Registering 404 handler...');
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});
app.use((err, _req, res, _next) => {
    const isCors = err?.message === 'Not allowed by CORS';
    if (isCors) {
        return res.status(403).json({ error: 'CORS Rejected', detail: 'Origin not allowed' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
(async () => {
    let dbConnected = false;
    try {
        console.log('🔌 Connecting to database...');
        await (0, database_1.connectDB)();
        console.log('✅ Database connected successfully');
        dbConnected = true;
    }
    catch (e) {
        console.error('❌ Failed to connect to database:', e);
        console.log('⚠️  Starting server without database connection...');
    }
    if (require.main === module) {
        app.listen(PORT, HOST, () => {
            console.log(`🚀 CampusPe API listening on http://${HOST}:${PORT}`);
            console.log(`📊 Health: http://${HOST}:${PORT}/health`);
            console.log(`🏠 Root: http://${HOST}:${PORT}/`);
            console.log(`🗃️  Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
            console.log('🎯 Server startup completed successfully!');
            if (dbConnected) {
                simple_scheduler_1.default.init();
            }
            else {
                console.log('⚠️  Scheduler not started due to missing database connection');
            }
        });
    }
})();
exports.default = app;
