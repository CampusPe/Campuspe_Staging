"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://dev.campuspe.com'],
    credentials: true
}));
app.use(body_parser_1.default.json({ limit: '50mb' }));
app.use(body_parser_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'CampusPe API (Test Mode)',
        mongodb: 'DISABLED for testing'
    });
});
Promise.resolve().then(() => __importStar(require('./routes/wabb-resume.js'))).then((wabbRoutes) => {
    app.use('/api/wabb', wabbRoutes.default || wabbRoutes);
}).catch(err => {
    console.log('⚠️ WABB routes not available, creating mock endpoints');
    app.post('/api/wabb/send-resume', async (req, res) => {
        const { phone, jobTitle } = req.body;
        console.log('📱 Mock WABB Resume Request:', { phone, jobTitle });
        const mockResponse = {
            success: true,
            message: 'Resume sent successfully via WhatsApp (MOCK)',
            data: {
                phone,
                jobTitle,
                resumeGenerated: true,
                whatsappSent: true,
                mock: true,
                timestamp: new Date().toISOString()
            }
        };
        res.json(mockResponse);
    });
});
app.get('/api/user/:identifier', (req, res) => {
    const { identifier } = req.params;
    if (identifier === '919876543210' || identifier === 'prem@campuspe.com') {
        res.json({
            success: true,
            data: {
                _id: 'mock_user_id_123',
                name: 'Prem Thakare',
                email: 'prem@campuspe.com',
                phone: '919876543210',
                profile: {
                    skills: [
                        { name: 'Search Engine Optimization (SEO)', level: 'advanced', category: 'technical' },
                        { name: 'Search Engine Marketing (SEM)', level: 'advanced', category: 'technical' },
                        { name: 'Social Media Marketing', level: 'intermediate', category: 'technical' },
                        { name: 'Content Marketing', level: 'intermediate', category: 'technical' },
                        { name: 'Google Analytics', level: 'intermediate', category: 'technical' },
                        { name: 'Google Ads', level: 'intermediate', category: 'technical' }
                    ],
                    education: [{
                            degree: 'B.Tech',
                            field: 'Computer Science and Engineering',
                            institution: 'University',
                            year: '2024'
                        }],
                    experience: [{
                            title: 'Software Development & Engineering Intern',
                            company: 'Tech Company',
                            duration: '2023-2024',
                            description: 'Worked on web application development and engineering projects.'
                        }],
                    projects: [{
                            title: 'Web Application Development',
                            description: 'Built and deployed web applications with user authentication, data management, and responsive design using modern frameworks and technologies.',
                            technologies: ['React', 'Node.js', 'MongoDB', 'Express']
                        }]
                }
            }
        });
    }
    else {
        res.status(404).json({
            success: false,
            error: 'User not found',
            message: `No user found with identifier: ${identifier}`
        });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 CampusPe API Test Server running on port ${PORT}`);
    console.log(`📋 Test Mode: MongoDB disabled for WABB testing`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
    console.log(`📱 WABB Test: http://localhost:${PORT}/api/wabb/send-resume`);
    console.log(`👤 User Test: http://localhost:${PORT}/api/user/919876543210`);
    console.log('✅ Ready for WABB integration testing!');
});
exports.default = app;
