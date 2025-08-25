"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const generated_resume_service_1 = __importDefault(require("../services/generated-resume.service"));
const GeneratedResume_1 = require("../models/GeneratedResume");
const router = express_1.default.Router();
router.get('/history', auth_1.default, async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const userId = req.user._id;
        console.log('📋 Fetching resume history for user:', userId);
        const { Student } = require('../models');
        const student = await Student.findOne({ userId }).lean();
        if (!student) {
            console.log('❌ Student profile not found for user:', userId);
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        console.log('✅ Student found:', student._id);
        try {
            const resumeHistory = await generated_resume_service_1.default.getStudentResumeHistory(student._id.toString(), parseInt(limit));
            console.log(`📊 Found ${resumeHistory.length} resumes in GeneratedResume collection`);
            const stats = await generated_resume_service_1.default.getStudentStats(student._id.toString());
            console.log('📈 Student stats from GeneratedResume:', stats);
            let fallbackData = [];
            if (resumeHistory.length === 0) {
                console.log('🔄 GeneratedResume collection empty, checking Student.aiResumeHistory...');
                const studentWithHistory = await Student.findById(student._id, 'aiResumeHistory').lean();
                if (studentWithHistory?.aiResumeHistory?.length > 0) {
                    console.log(`📚 Found ${studentWithHistory.aiResumeHistory.length} resumes in Student.aiResumeHistory`);
                    fallbackData = studentWithHistory.aiResumeHistory
                        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
                        .slice(0, 10)
                        .map((item) => ({
                        resumeId: item.id,
                        jobTitle: item.jobTitle,
                        jobDescription: item.jobDescription,
                        resumeData: item.resumeData,
                        cloudUrl: item.pdfUrl,
                        matchScore: item.matchScore,
                        generatedAt: item.generatedAt,
                        status: 'completed',
                        downloadCount: 0,
                        whatsappSharedCount: 0,
                        fileName: `${item.id}.pdf`,
                        fileSize: 0,
                        mimeType: 'application/pdf'
                    }));
                }
            }
            const finalResumeData = resumeHistory.length > 0 ? resumeHistory : fallbackData;
            res.json({
                success: true,
                data: {
                    resumes: finalResumeData,
                    stats: stats || {
                        totalResumes: finalResumeData.length,
                        totalDownloads: 0,
                        totalWhatsAppShares: 0,
                        avgMatchScore: fallbackData.length > 0 ?
                            fallbackData.reduce((sum, r) => sum + (r.matchScore || 0), 0) / fallbackData.length : 0,
                        lastGenerated: finalResumeData.length > 0 ? finalResumeData[0].generatedAt : null
                    },
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: finalResumeData.length
                    },
                    source: resumeHistory.length > 0 ? 'GeneratedResume' : 'Student.aiResumeHistory'
                }
            });
        }
        catch (serviceError) {
            console.error('❌ GeneratedResumeService error:', serviceError);
            console.log('🔄 Falling back to Student.aiResumeHistory due to service error...');
            const studentWithHistory = await Student.findById(student._id, 'aiResumeHistory').lean();
            const aiResumeHistory = studentWithHistory?.aiResumeHistory || [];
            const fallbackData = aiResumeHistory
                .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
                .slice(0, parseInt(limit))
                .map((item) => ({
                resumeId: item.id,
                jobTitle: item.jobTitle,
                jobDescription: item.jobDescription,
                resumeData: item.resumeData,
                cloudUrl: item.pdfUrl,
                matchScore: item.matchScore,
                generatedAt: item.generatedAt,
                status: 'completed',
                downloadCount: 0,
                whatsappSharedCount: 0,
                fileName: `${item.id}.pdf`,
                fileSize: 0,
                mimeType: 'application/pdf'
            }));
            res.json({
                success: true,
                data: {
                    resumes: fallbackData,
                    stats: {
                        totalResumes: fallbackData.length,
                        totalDownloads: 0,
                        totalWhatsAppShares: 0,
                        avgMatchScore: fallbackData.length > 0 ?
                            fallbackData.reduce((sum, r) => sum + (r.matchScore || 0), 0) / fallbackData.length : 0,
                        lastGenerated: fallbackData.length > 0 ? fallbackData[0].generatedAt : null
                    },
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: fallbackData.length
                    },
                    source: 'Student.aiResumeHistory (fallback)'
                }
            });
        }
    }
    catch (error) {
        console.error('❌ Error fetching resume history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resume history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/:resumeId/download', auth_1.default, async (req, res) => {
    try {
        const { resumeId } = req.params;
        const userId = req.user._id;
        console.log('📥 Download request for resume:', resumeId, 'by user:', userId);
        const { Student } = require('../models');
        const student = await Student.findOne({ userId }).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        const resume = await GeneratedResume_1.GeneratedResume.findOne({
            resumeId,
            studentId: student._id,
            status: 'completed'
        }).lean();
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }
        const result = await generated_resume_service_1.default.downloadResume(resumeId);
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.error
            });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
        res.send(result.pdfBuffer);
    }
    catch (error) {
        console.error('❌ Error downloading resume:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download resume',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/download-public/:resumeId', async (req, res) => {
    try {
        const { resumeId } = req.params;
        console.log('🔗 Public download request for resume:', resumeId);
        const result = await generated_resume_service_1.default.downloadResume(resumeId);
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.error
            });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${result.fileName}"`);
        res.send(result.pdfBuffer);
    }
    catch (error) {
        console.error('❌ Error downloading resume publicly:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download resume',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.post('/:resumeId/share-whatsapp', auth_1.default, async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { phoneNumber } = req.body;
        const userId = req.user._id;
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }
        console.log('📱 WhatsApp share request for resume:', resumeId, 'to:', phoneNumber);
        const { Student } = require('../models');
        const student = await Student.findOne({ userId }).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        const resume = await GeneratedResume_1.GeneratedResume.findOne({
            resumeId,
            studentId: student._id,
            status: 'completed'
        }).lean();
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }
        const result = await generated_resume_service_1.default.shareResumeOnWhatsApp(resumeId, phoneNumber);
        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                data: {
                    resumeId: result.resumeId,
                    downloadUrl: result.downloadUrl
                }
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('❌ Error sharing resume on WhatsApp:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share resume on WhatsApp',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.post('/wabb-send-document', async (req, res) => {
    try {
        console.log('📱 WABB Send Document Request:', req.body);
        const { resumeId, number } = req.body;
        if (!resumeId || !number) {
            return res.status(400).json({
                success: false,
                message: 'Resume ID and phone number are required',
                required: ['resumeId', 'number']
            });
        }
        console.log('🔍 Looking for resume:', resumeId);
        let resume = await GeneratedResume_1.GeneratedResume.findOne({
            resumeId,
            status: 'completed'
        }).populate('studentId', 'name email').lean();
        console.log('📄 Resume found by resumeId field:', resume ? 'YES' : 'NO');
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found or not completed'
            });
        }
        const downloadUrl = `${process.env.API_BASE_URL || 'https://campuspe-api-staging.azurewebsites.net'}/api/generated-resume/download-public/${resumeId}`;
        const { sendWhatsAppMessage } = require('../services/whatsapp');
        const message = `🎉 *Your Resume is Ready!*\n\n📄 *File:* ${resume.fileName}\n📅 *Generated:* ${new Date(resume.generatedAt).toLocaleDateString()}\n🎯 *Job Match Score:* ${resume.matchScore || 'N/A'}%\n\n📥 *Download:* ${downloadUrl}\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
        const whatsappResult = await sendWhatsAppMessage(number, message);
        if (whatsappResult.success) {
            await resume.markAsSharedOnWhatsApp(number);
            res.json({
                success: true,
                message: 'Resume shared successfully on WhatsApp',
                data: {
                    resumeId,
                    downloadUrl,
                    whatsappResult
                }
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: `Failed to send WhatsApp message: ${whatsappResult.message}`
            });
        }
    }
    catch (error) {
        console.error('❌ Error in WABB send document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send document via WhatsApp',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/debug-db', async (req, res) => {
    try {
        console.log('🔍 Debug: Checking database contents');
        const totalCount = await GeneratedResume_1.GeneratedResume.countDocuments();
        console.log('📊 Total GeneratedResume documents:', totalCount);
        const allResumes = await GeneratedResume_1.GeneratedResume.find({}, {
            _id: 1,
            resumeId: 1,
            status: 1,
            fileName: 1,
            createdAt: 1
        }).limit(10).lean();
        console.log('📄 Sample resumes:', allResumes);
        const statusCounts = await GeneratedResume_1.GeneratedResume.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('📊 Status distribution:', statusCounts);
        res.json({
            success: true,
            data: {
                totalCount,
                sampleResumes: allResumes,
                statusDistribution: statusCounts
            }
        });
    }
    catch (error) {
        console.error('❌ Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug query failed',
            error: error.message
        });
    }
});
exports.default = router;
