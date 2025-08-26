"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const whatsapp_resume_flow_1 = __importDefault(require("../services/whatsapp-resume-flow"));
const whatsapp_1 = require("../services/whatsapp");
const resume_builder_1 = __importDefault(require("../services/resume-builder"));
const GeneratedResume_1 = require("../models/GeneratedResume");
const Student_1 = require("../models/Student");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.get('/stats', auth_1.default, async (req, res) => {
    try {
        const stats = whatsapp_resume_flow_1.default.getStats();
        const [totalResumesGenerated, resumesToday, successfulDeliveries, failedDeliveries] = await Promise.all([
            GeneratedResume_1.GeneratedResume.countDocuments({ generationType: 'whatsapp' }),
            GeneratedResume_1.GeneratedResume.countDocuments({
                generationType: 'whatsapp',
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }),
            GeneratedResume_1.GeneratedResume.countDocuments({
                'whatsappRecipients.status': 'sent'
            }),
            GeneratedResume_1.GeneratedResume.countDocuments({
                'whatsappRecipients.status': 'failed'
            })
        ]);
        res.json({
            success: true,
            data: {
                conversations: {
                    active: stats.activeConversations,
                    completedToday: stats.completedToday
                },
                resumes: {
                    totalGenerated: totalResumesGenerated,
                    generatedToday: resumesToday,
                    successfulDeliveries,
                    failedDeliveries
                },
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error fetching WhatsApp stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});
router.post('/test-message', auth_1.default, async (req, res) => {
    try {
        const { phoneNumber, message, serviceType = 'general' } = req.body;
        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }
        const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
        const result = await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, message, serviceType);
        res.json({
            success: result.success,
            message: result.success ? 'Test message sent successfully' : 'Failed to send test message',
            details: result
        });
    }
    catch (error) {
        console.error('Error sending test message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test message'
        });
    }
});
router.post('/test-resume-flow', auth_1.default, async (req, res) => {
    try {
        const { phoneNumber, email, jobDescription } = req.body;
        if (!phoneNumber || !email || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, email, and job description are required'
            });
        }
        const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
        await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `🧪 *Test Resume Generation*\n\nStarting test resume generation for:\n• Email: ${email}\n• Job Description: ${jobDescription.substring(0, 100)}...\n\n⏳ Processing...`);
        const result = await resume_builder_1.default.createTailoredResume(email, cleanPhone, jobDescription);
        if (result.success) {
            await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `✅ *Test Resume Generated*\n\n📄 File: ${result.fileName}\n📥 Download: ${result.downloadUrl || 'Available on platform'}\n\n🧪 This was a test generation`);
        }
        else {
            await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `❌ *Test Failed*\n\nError: ${result.message}\n\n🧪 This was a test generation`);
        }
        res.json({
            success: true,
            message: 'Test resume flow initiated',
            result: {
                resumeGenerated: result.success,
                fileName: result.fileName,
                error: result.success ? null : result.message
            }
        });
    }
    catch (error) {
        console.error('Error in test resume flow:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test resume flow'
        });
    }
});
router.post('/reset-conversation', auth_1.default, async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }
        const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
        await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `🔄 *Conversation Reset*\n\nYour conversation has been reset by an admin.\n\n🚀 Ready to start fresh? Type "resume" to begin!`);
        res.json({
            success: true,
            message: 'Conversation reset message sent'
        });
    }
    catch (error) {
        console.error('Error resetting conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset conversation'
        });
    }
});
router.get('/recent-activities', auth_1.default, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const recentResumes = await GeneratedResume_1.GeneratedResume.find({
            generationType: 'whatsapp'
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('studentId', 'firstName lastName email')
            .lean();
        const activities = recentResumes.map(resume => ({
            id: resume._id,
            studentName: resume.studentId && typeof resume.studentId === 'object' ?
                `${resume.studentId.firstName || ''} ${resume.studentId.lastName || ''}`.trim() :
                'Unknown',
            studentEmail: resume.studentId && typeof resume.studentId === 'object' ?
                resume.studentId.email :
                'Unknown',
            fileName: resume.fileName,
            jobTitle: resume.jobTitle,
            createdAt: resume.createdAt,
            whatsappSharedCount: resume.whatsappSharedCount || 0,
            lastSharedAt: resume.lastSharedAt,
            status: resume.whatsappRecipients?.length > 0 ?
                resume.whatsappRecipients[resume.whatsappRecipients.length - 1].status :
                'pending'
        }));
        res.json({
            success: true,
            data: activities,
            total: activities.length
        });
    }
    catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent activities'
        });
    }
});
router.post('/broadcast', auth_1.default, async (req, res) => {
    try {
        const { message, userType = 'all' } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }
        let users = [];
        if (userType === 'students' || userType === 'all') {
            const students = await Student_1.Student.find({
                phoneNumber: { $exists: true, $ne: null }
            }).select('phoneNumber firstName').lean();
            users.push(...students);
        }
        const broadcastMessage = `📢 *CampusPe Announcement*\n\n${message}\n\n🤖 This is an automated message from CampusPe`;
        let successCount = 0;
        let failedCount = 0;
        const batchSize = 10;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            const promises = batch.map(async (user) => {
                try {
                    if (user.phoneNumber) {
                        const cleanPhone = user.phoneNumber.replace(/[^\d]/g, '');
                        await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, broadcastMessage);
                        successCount++;
                    }
                }
                catch (error) {
                    console.error(`Failed to send to ${user.phoneNumber}:`, error);
                    failedCount++;
                }
            });
            await Promise.all(promises);
            if (i + batchSize < users.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        res.json({
            success: true,
            message: 'Broadcast completed',
            stats: {
                totalUsers: users.length,
                successCount,
                failedCount
            }
        });
    }
    catch (error) {
        console.error('Error in broadcast:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send broadcast'
        });
    }
});
exports.default = router;
