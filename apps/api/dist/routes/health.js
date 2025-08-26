"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resume_builder_1 = __importDefault(require("../services/resume-builder"));
const router = express_1.default.Router();
router.get('/pdf', async (req, res) => {
    try {
        console.log('🏥 PDF Health Check: Starting...');
        const testResumeData = {
            personalInfo: {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                phone: '1234567890'
            },
            summary: 'Health check test resume',
            skills: [{ name: 'Testing', level: 'expert', category: 'technical' }],
            experience: [],
            education: [],
            projects: []
        };
        const htmlContent = resume_builder_1.default.generateResumeHTML(testResumeData);
        console.log('✅ HTML generation working');
        const pdfBuffer = await Promise.race([
            resume_builder_1.default.generatePDF(htmlContent),
            new Promise((_, reject) => setTimeout(() => reject(new Error('PDF generation timeout')), 15000))
        ]);
        console.log('✅ PDF generation working, size:', pdfBuffer.length, 'bytes');
        res.json({
            success: true,
            message: 'PDF generation system is healthy',
            timestamp: new Date().toISOString(),
            pdfSize: pdfBuffer.length,
            environment: process.env.NODE_ENV || 'development',
            isAzure: !!(process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production')
        });
    }
    catch (error) {
        console.error('❌ PDF Health Check Failed:', error);
        res.status(500).json({
            success: false,
            message: 'PDF generation system is unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            isAzure: !!(process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production')
        });
    }
});
router.get('/system', (req, res) => {
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        isAzure: !!(process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production'),
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
    });
});
exports.default = router;
