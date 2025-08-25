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
const auth_1 = __importDefault(require("../middleware/auth"));
const Student_1 = require("../models/Student");
const GeneratedResume_1 = require("../models/GeneratedResume");
const ai_resume_matching_1 = __importDefault(require("../services/ai-resume-matching"));
const resume_builder_1 = __importDefault(require("../services/resume-builder"));
const generated_resume_service_1 = __importDefault(require("../services/generated-resume.service"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
router.post('/debug-save', async (req, res) => {
    try {
        console.log('=== DEBUG SAVE ENDPOINT ===');
        const student = await Student_1.Student.findOne({});
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'No student found in database'
            });
        }
        console.log('Found student:', student._id);
        const resumeHistoryItem = {
            id: new Date().getTime().toString(),
            jobDescription: 'Debug test job description',
            jobTitle: 'Debug Test Position',
            resumeData: {
                contact: {
                    email: student.email,
                    phone: student.phoneNumber || '9999999999',
                    name: `${student.firstName} ${student.lastName}`
                },
                skills: ['Debug', 'Testing'],
                experience: []
            },
            pdfUrl: 'https://example.com/debug-resume.pdf',
            generatedAt: new Date(),
            matchScore: 99
        };
        console.log('Saving resume to history for student:', student._id);
        if (!student.aiResumeHistory) {
            student.aiResumeHistory = [];
        }
        student.aiResumeHistory.push(resumeHistoryItem);
        if (student.aiResumeHistory.length > 3) {
            student.aiResumeHistory = student.aiResumeHistory.slice(-3);
        }
        await student.save();
        console.log('✅ Resume saved successfully. Current history length:', student.aiResumeHistory.length);
        res.json({
            success: true,
            message: 'Debug save completed',
            studentId: student._id,
            historyLength: student.aiResumeHistory.length,
            savedItem: resumeHistoryItem
        });
    }
    catch (error) {
        console.error('❌ Debug save error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug save failed',
            error: error.message
        });
    }
});
router.post('/generate-ai', auth_1.default, async (req, res) => {
    try {
        const { email, phone, jobDescription, includeProfileData = true } = req.body;
        const userId = req.user._id;
        if (!email || !phone || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Email, phone, and job description are required'
            });
        }
        let studentProfile = null;
        if (includeProfileData) {
            try {
                studentProfile = await Student_1.Student.findOne({ userId }).lean();
            }
            catch (error) {
                console.log('Could not fetch student profile:', error);
            }
        }
        const resumeData = await generateAIResume({
            email,
            phone,
            jobDescription,
            studentProfile
        });
        let historySaved = false;
        let historyError = null;
        let generatedResumeId = null;
        if (studentProfile) {
            try {
                console.log('=== SAVING RESUME TO DATABASE ===');
                console.log('Student ID:', studentProfile._id);
                generatedResumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const jobTitle = extractJobTitleFromDescription(jobDescription);
                try {
                    const transformedResumeData = transformResumeDataForSchema(resumeData);
                    const generatedResume = new GeneratedResume_1.GeneratedResume({
                        studentId: studentProfile._id,
                        resumeId: generatedResumeId,
                        jobTitle: jobTitle || 'AI Generated Resume',
                        jobDescription,
                        jobDescriptionHash: require('crypto').createHash('md5').update(jobDescription).digest('hex'),
                        resumeData: transformedResumeData,
                        fileName: `${generatedResumeId}.pdf`,
                        filePath: null,
                        cloudUrl: `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/ai-resume-builder/download-pdf-public/${generatedResumeId}`,
                        fileSize: 0,
                        mimeType: 'application/pdf',
                        matchScore: 85,
                        aiEnhancementUsed: true,
                        matchedSkills: resumeData.skills?.map((skill) => typeof skill === 'string' ? skill : skill.name) || [],
                        missingSkills: [],
                        suggestions: [],
                        status: 'completed',
                        generationType: 'ai',
                        downloadCount: 0,
                        whatsappSharedCount: 0,
                        generatedAt: new Date(),
                        whatsappSharedAt: [],
                        whatsappRecipients: []
                    });
                    await generatedResume.save();
                    console.log('✅ Resume saved to GeneratedResume collection with ID:', generatedResume._id);
                    console.log('📊 Resume details:', {
                        resumeId: generatedResume.resumeId,
                        studentId: generatedResume.studentId,
                        status: generatedResume.status,
                        fileName: generatedResume.fileName
                    });
                }
                catch (dbError) {
                    console.error('❌ Error saving to GeneratedResume collection:', dbError);
                    console.error('❌ Error details:', dbError instanceof Error ? dbError.message : 'Unknown error');
                    if (dbError instanceof Error && dbError.message.includes('validation')) {
                        console.error('❌ Validation error - check required fields');
                    }
                }
                const student = await Student_1.Student.findById(studentProfile._id);
                if (student) {
                    if (!student.aiResumeHistory) {
                        student.aiResumeHistory = [];
                    }
                    const historyItem = {
                        id: generatedResumeId,
                        jobDescription,
                        jobTitle: jobTitle || 'AI Generated Resume',
                        resumeData: resumeData,
                        pdfUrl: `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/ai-resume-builder/download-pdf-public/${generatedResumeId}`,
                        generatedAt: new Date(),
                        matchScore: 85
                    };
                    student.aiResumeHistory.unshift(historyItem);
                    if (student.aiResumeHistory.length > 10) {
                        student.aiResumeHistory = student.aiResumeHistory.slice(0, 10);
                    }
                    await student.save();
                    console.log('✅ Resume saved to Student.aiResumeHistory');
                    historySaved = true;
                }
            }
            catch (error) {
                console.error('❌ ERROR saving resume to student history:', error);
                console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
                historyError = error instanceof Error ? error.message : 'Unknown error';
            }
        }
        else {
            console.log('⚠️ No student profile found - resume history not saved');
            historyError = 'No student profile found';
        }
        res.json({
            success: true,
            message: 'Resume generated successfully using AI',
            data: {
                resume: resumeData,
                resumeId: generatedResumeId,
                downloadUrl: generatedResumeId ? `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${generatedResumeId}` : null
            },
            historySaved,
            historyError
        });
    }
    catch (error) {
        console.error('Error generating AI resume:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate AI resume',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/history', auth_1.default, async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('🔍 Fetching resume history for user:', userId);
        const student = await Student_1.Student.findOne({ userId }, 'aiResumeHistory').lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        console.log('👤 Student found:', student._id);
        const studentHistory = (student.aiResumeHistory || [])
            .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
            .slice(0, 10);
        console.log('📚 Student.aiResumeHistory count:', studentHistory.length);
        const generatedResumes = await GeneratedResume_1.GeneratedResume.find({
            studentId: student._id
        })
            .sort({ generatedAt: -1 })
            .limit(10)
            .lean();
        console.log('📄 GeneratedResume collection count:', generatedResumes.length);
        if (generatedResumes.length > 0) {
            console.log('📊 Generated resumes details:');
            generatedResumes.forEach((resume, index) => {
                console.log(`  ${index + 1}. ID: ${resume.resumeId}, Status: ${resume.status}, Job: ${resume.jobTitle}`);
            });
        }
        if (studentHistory.length > 0) {
            console.log('📋 Student history details:');
            studentHistory.forEach((resume, index) => {
                console.log(`  ${index + 1}. ID: ${resume.id}, Job: ${resume.jobTitle}`);
            });
        }
        res.json({
            success: true,
            data: {
                resumeHistory: studentHistory,
                generatedResumes: generatedResumes,
                sources: {
                    studentCollection: studentHistory.length,
                    generatedResumeCollection: generatedResumes.length
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching resume history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resume history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/debug/database', auth_1.default, async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('🔍 DEBUG: Testing database collections...');
        const student = await Student_1.Student.findOne({ userId }).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        console.log('👤 Student found:', student._id);
        const totalResumes = await GeneratedResume_1.GeneratedResume.countDocuments({ studentId: student._id });
        const allResumes = await GeneratedResume_1.GeneratedResume.find({ studentId: student._id }).lean();
        console.log('📊 Total resumes in GeneratedResume collection:', totalResumes);
        const testResume = new GeneratedResume_1.GeneratedResume({
            studentId: student._id,
            resumeId: `test_${Date.now()}`,
            jobDescription: 'Test job description for database connectivity',
            jobDescriptionHash: 'test_hash_123',
            resumeData: {
                personalInfo: {
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    phone: '1234567890'
                },
                summary: 'Test summary',
                skills: [],
                experience: [],
                education: [],
                projects: [],
                certifications: []
            },
            fileName: 'test_resume.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            status: 'completed',
            generationType: 'ai',
            downloadCount: 0,
            whatsappSharedCount: 0,
            matchedSkills: [],
            missingSkills: [],
            suggestions: [],
            aiEnhancementUsed: true
        });
        const savedTestResume = await testResume.save();
        console.log('✅ Test resume created successfully:', savedTestResume._id);
        await GeneratedResume_1.GeneratedResume.deleteOne({ _id: savedTestResume._id });
        console.log('🗑️ Test resume cleaned up');
        res.json({
            success: true,
            data: {
                studentId: student._id,
                totalResumesInCollection: totalResumes,
                collectionWorking: true,
                resumeDetails: allResumes.map(r => ({
                    id: r.resumeId,
                    status: r.status,
                    jobTitle: r.jobTitle,
                    createdAt: r.createdAt
                }))
            }
        });
    }
    catch (error) {
        console.error('❌ Database debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Database debug failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
router.post('/share-whatsapp', auth_1.default, async (req, res) => {
    try {
        const { resumeId, phoneNumber } = req.body;
        const userId = req.user._id;
        if (!resumeId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Resume ID and phone number are required'
            });
        }
        const student = await Student_1.Student.findOne({ userId }).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        const resume = student.aiResumeHistory?.find(r => r.id === resumeId);
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }
        const pdfUrl = await generateResumePdfUrl(resume.resumeData, resumeId);
        if (!pdfUrl) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate PDF URL'
            });
        }
        const whatsappResponse = await sendResumeToWhatsApp(phoneNumber, pdfUrl, resume.jobTitle || 'Resume');
        if (whatsappResponse.success && pdfUrl) {
            await Student_1.Student.findOneAndUpdate({ userId, 'aiResumeHistory.id': resumeId }, { $set: { 'aiResumeHistory.$.pdfUrl': pdfUrl } });
        }
        res.json({
            success: true,
            message: 'Resume shared successfully on WhatsApp',
            data: {
                pdfUrl,
                whatsappResponse
            }
        });
    }
    catch (error) {
        console.error('Error sharing resume on WhatsApp:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share resume on WhatsApp',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.post('/send-to-my-whatsapp', auth_1.default, async (req, res) => {
    try {
        const { resumeId } = req.body;
        const userId = req.user._id;
        if (!resumeId) {
            return res.status(400).json({
                success: false,
                message: 'Resume ID is required'
            });
        }
        const student = await Student_1.Student.findOne({ userId }).lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        let phoneNumber = student.phoneNumber;
        if (!phoneNumber) {
            const user = await Promise.resolve().then(() => __importStar(require('../models/User'))).then(mod => mod.User.findById(userId).lean());
            phoneNumber = user?.phone;
        }
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number not found in your profile. Please update your profile with a valid phone number.'
            });
        }
        const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
        if (cleanPhone.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Please update your profile with a valid 10-digit phone number.'
            });
        }
        const tenDigitPhone = cleanPhone.slice(-10);
        const resume = student.aiResumeHistory?.find(r => r.id === resumeId);
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }
        const { sendWhatsAppMessage } = require('../services/whatsapp');
        try {
            const pdfUrl = await generateResumePdfUrl(resume.resumeData, resumeId);
            if (pdfUrl) {
                const whatsappResponse = await sendResumeToWhatsApp(tenDigitPhone, pdfUrl, resume.jobTitle || 'Resume');
                if (whatsappResponse.success) {
                    await Student_1.Student.findOneAndUpdate({ userId, 'aiResumeHistory.id': resumeId }, { $set: { 'aiResumeHistory.$.pdfUrl': pdfUrl } });
                    return res.json({
                        success: true,
                        message: 'Resume sent to your WhatsApp successfully!',
                        data: {
                            phoneNumber: tenDigitPhone,
                            pdfUrl,
                            fileName: `${student.firstName}_${student.lastName}_Resume_${Date.now()}.pdf`,
                            whatsappResponse
                        }
                    });
                }
                else {
                    const message = `🎉 *Your AI-Generated Resume is Ready!*\n\n📄 *Job Title:* ${resume.jobTitle || 'Professional Resume'}\n📅 *Generated:* ${new Date().toLocaleDateString()}\n\n📥 *Download Link:* ${pdfUrl}\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
                    await sendWhatsAppMessage(tenDigitPhone, message);
                    return res.json({
                        success: true,
                        message: 'Resume download link sent to your WhatsApp!',
                        data: {
                            phoneNumber: tenDigitPhone,
                            pdfUrl,
                            sentAsLink: true
                        }
                    });
                }
            }
            else {
                const message = `🎉 *Your AI-Generated Resume is Ready!*\n\n📄 *Job Title:* ${resume.jobTitle || 'Professional Resume'}\n📅 *Generated:* ${new Date().toLocaleDateString()}\n\n📥 *Download:* Please visit your CampusPe dashboard to download your resume.\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
                await sendWhatsAppMessage(tenDigitPhone, message);
                return res.json({
                    success: true,
                    message: 'Resume notification sent to your WhatsApp!',
                    data: {
                        phoneNumber: tenDigitPhone,
                        sentAsNotification: true
                    }
                });
            }
        }
        catch (whatsappError) {
            console.error('WhatsApp sending failed:', whatsappError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send resume to WhatsApp. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? whatsappError?.message : undefined
            });
        }
    }
    catch (error) {
        console.error('Error sending resume to WhatsApp:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send resume to WhatsApp',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.post('/download-pdf', auth_1.default, async (req, res) => {
    try {
        const { resume, format = 'professional' } = req.body;
        if (!resume) {
            return res.status(400).json({
                success: false,
                message: 'Resume data is required'
            });
        }
        console.log('📄 Processing PDF download request...');
        console.log('📊 Resume data keys:', Object.keys(resume));
        const pdfCompatibleResume = {
            personalInfo: {
                firstName: resume.personalInfo?.firstName || resume.personalInfo?.name?.split(' ')[0] || 'Unknown',
                lastName: resume.personalInfo?.lastName || resume.personalInfo?.name?.split(' ').slice(1).join(' ') || 'User',
                email: resume.personalInfo?.email || 'user@example.com',
                phone: resume.personalInfo?.phone || 'N/A',
                location: resume.personalInfo?.location || '',
                linkedin: resume.personalInfo?.linkedin || '',
                github: resume.personalInfo?.github || ''
            },
            summary: resume.summary || 'Professional summary not available.',
            skills: (resume.skills || []).map((skill) => ({
                name: typeof skill === 'string' ? skill : (skill.name || 'Skill'),
                level: 'intermediate',
                category: 'technical'
            })),
            experience: (resume.experience || []).map((exp) => {
                const duration = exp.duration || '';
                const isCurrentJob = duration.includes('Present') || duration.includes('Current');
                const currentYear = new Date().getFullYear();
                const yearMatches = duration.match(/\d{4}/g);
                const startYear = yearMatches && yearMatches[0] ? parseInt(yearMatches[0]) : currentYear - 1;
                const endYear = isCurrentJob ? currentYear : (yearMatches && yearMatches[1] ? parseInt(yearMatches[1]) : currentYear);
                return {
                    title: exp.title || 'Position',
                    company: exp.company || 'Company',
                    location: exp.location || '',
                    startDate: new Date(startYear, 0, 1),
                    endDate: isCurrentJob ? undefined : new Date(endYear, 11, 31),
                    description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || 'Description not available.'),
                    isCurrentJob: isCurrentJob
                };
            }),
            education: (resume.education || []).map((edu) => {
                const degreeText = edu.degree || 'Degree';
                const degreeParts = degreeText.includes(' in ') ? degreeText.split(' in ') : [degreeText, 'Field'];
                const degree = degreeParts[0] || 'Degree';
                const field = degreeParts[1] || edu.field || 'Field of Study';
                const year = edu.year || 'Unknown';
                const isCompleted = year !== 'In Progress' && year !== 'Current' && year !== 'Ongoing';
                const currentYear = new Date().getFullYear();
                const gradYear = year.match(/\d{4}/) ? parseInt(year.match(/\d{4}/)[0]) : currentYear;
                return {
                    degree: degree,
                    field: field,
                    institution: edu.institution || 'Institution',
                    startDate: new Date(gradYear - 4, 8, 1),
                    endDate: isCompleted ? new Date(gradYear, 4, 31) : undefined,
                    isCompleted: isCompleted
                };
            }),
            projects: (resume.projects || []).map((project) => ({
                name: project.name || 'Project',
                description: project.description || 'Project description not available.',
                technologies: Array.isArray(project.technologies) ? project.technologies : []
            }))
        };
        console.log('✅ Resume data formatted for PDF generation');
        const resumeBuilder = resume_builder_1.default;
        console.log('🔄 Starting DIRECT PDF generation with structured data...');
        const pdfBuffer = await resumeBuilder.generateStructuredPDF(pdfCompatibleResume);
        console.log('✅ PDF generated successfully with actual user data');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="AI_Resume_${Date.now()}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('❌ Error generating PDF:', error);
        const errorDetails = {
            message: error.message || 'Unknown error occurred',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        };
        console.error('📊 Error details:', errorDetails);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF. Please try again or contact support if the issue persists.',
            error: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        });
    }
});
router.get('/download-pdf-public/:resumeId', async (req, res) => {
    try {
        const { resumeId } = req.params;
        const student = await Student_1.Student.findOne({
            'aiResumeHistory.id': resumeId
        }, 'aiResumeHistory').lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }
        const resume = student.aiResumeHistory?.find(r => r.id === resumeId);
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }
        const pdfCompatibleResume = {
            personalInfo: resume.resumeData.personalInfo,
            summary: resume.resumeData.summary,
            skills: (resume.resumeData.skills || []).map((skill) => ({
                name: typeof skill === 'string' ? skill : skill.name,
                level: 'intermediate',
                category: 'technical'
            })),
            experience: (resume.resumeData.experience || []).map((exp) => ({
                title: exp.title,
                company: exp.company,
                location: exp.location,
                startDate: new Date(),
                endDate: exp.duration?.includes('Present') ? undefined : new Date(),
                description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
                isCurrentJob: exp.duration?.includes('Present') || false
            })),
            education: (resume.resumeData.education || []).map((edu) => ({
                degree: edu.degree || 'Degree',
                field: 'Field',
                institution: edu.institution || 'Institution',
                startDate: new Date(),
                endDate: edu.year === 'In Progress' ? undefined : new Date(),
                isCompleted: edu.year !== 'In Progress'
            })),
            projects: resume.resumeData.projects || []
        };
        const resumeBuilder = resume_builder_1.default;
        const pdfBuffer = await resumeBuilder.generateStructuredPDF(pdfCompatibleResume);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${resume.jobTitle || 'Resume'}_${resumeId}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Error generating public PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
async function generateAIResume({ email, phone, jobDescription, studentProfile }) {
    const fullName = studentProfile ?
        `${studentProfile.firstName} ${studentProfile.lastName}`.trim() :
        'Your Name';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Your';
    const lastName = nameParts.slice(1).join(' ') || 'Name';
    const personalInfo = {
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        email,
        phone,
        location: studentProfile?.address || undefined,
        linkedin: studentProfile?.linkedinUrl || undefined,
        github: studentProfile?.githubUrl || undefined
    };
    try {
        const aiService = ai_resume_matching_1.default;
        const userProfileText = `
Name: ${personalInfo.name}
Contact: ${email}, ${phone}
${studentProfile?.address ? `Location: ${studentProfile.address}` : ''}

EXPERIENCE:
${(studentProfile?.experience || []).map((exp) => `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${Array.isArray(exp.description) ? exp.description.join(', ') : (exp.description || 'No description')}`).join('\n')}

EDUCATION:
${(studentProfile?.education || []).map((edu) => `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.endDate || 'In Progress'})`).join('\n')}

SKILLS:
${[
            ...(studentProfile?.skills?.map((skill) => skill.name) || []),
            ...(studentProfile?.resumeAnalysis?.skills || [])
        ].join(', ')}

PROJECTS:
${(studentProfile?.projects || []).map((project) => `- ${project.name}: ${project.description || 'Project description'}`).join('\n')}
    `.trim();
        const aiPrompt = `
You are an expert resume writer. Create a highly targeted resume that is 70% focused on the job description and 30% on the user's background. 

JOB DESCRIPTION:
${jobDescription}

USER PROFILE:
${userProfileText}

INSTRUCTIONS:
1. Analyze the job description to identify key requirements, skills, and responsibilities
2. Create a professional summary that heavily emphasizes job-relevant skills and experience
3. Rewrite experience descriptions to highlight achievements relevant to the target job
4. Prioritize skills that match the job requirements
5. Ensure 70% of content directly relates to job requirements, 30% to user's actual background
6. Use action verbs and quantifiable achievements where possible
7. Keep the tone professional and confident

Generate a JSON response with this exact structure:
{
  "summary": "Professional summary tailored to the job (2-3 sentences)",
  "skills": ["array", "of", "relevant", "skills", "max", "12"],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name", 
      "duration": "Date range",
      "description": ["bullet point 1", "bullet point 2", "bullet point 3"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Tailored project description highlighting job-relevant aspects",
      "technologies": ["relevant", "tech", "stack"]
    }
  ],
  "education": [
    {
      "degree": "Degree title",
      "institution": "Institution name",
      "year": "Year or status"
    }
  ]
}`;
        const aiResponse = await aiService.callClaudeAPI(aiPrompt);
        if (aiResponse && aiResponse.content) {
            try {
                const aiContent = JSON.parse(aiResponse.content);
                const frontendData = {
                    personalInfo,
                    summary: aiContent.summary || 'Professional seeking to contribute technical expertise and drive organizational success.',
                    skills: aiContent.skills || [],
                    experience: (aiContent.experience || []).map((exp) => ({
                        title: exp.title,
                        company: exp.company,
                        duration: exp.duration || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
                        description: Array.isArray(exp.description) ? exp.description : [exp.description || '']
                    })),
                    education: (aiContent.education || []).map((edu) => ({
                        degree: edu.degree || 'Degree',
                        institution: edu.institution || 'Institution',
                        year: edu.year || 'Year'
                    })),
                    projects: aiContent.projects || []
                };
                return frontendData;
            }
            catch (parseError) {
                console.log('Failed to parse AI response, using fallback');
            }
        }
    }
    catch (aiError) {
        console.log('AI generation failed, using enhanced fallback:', aiError?.message || 'Unknown error');
    }
    return generateEnhancedFallbackResume({
        personalInfo,
        jobDescription,
        studentProfile
    });
}
function generateEnhancedFallbackResume({ personalInfo, jobDescription, studentProfile }) {
    const jobKeywords = extractKeywordsFromJob(jobDescription);
    const summary = generateJobFocusedSummary(jobDescription, studentProfile, jobKeywords);
    const skills = prioritizeSkillsForJob(studentProfile, jobKeywords);
    const experience = enhanceExperienceForJob(studentProfile?.experience || [], jobKeywords);
    const education = (studentProfile?.education || []).map((edu) => ({
        degree: edu.degree || 'Degree',
        field: edu.field || 'Field',
        institution: edu.institution || 'Institution',
        startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
        endDate: edu.endDate && edu.isCompleted ? new Date(edu.endDate) : undefined,
        gpa: edu.gpa,
        isCompleted: edu.isCompleted !== false
    }));
    const projects = enhanceProjectsForJob(studentProfile?.projects || [], jobKeywords);
    return {
        personalInfo,
        summary,
        skills: skills.map((skill) => skill.name),
        experience: experience.map((exp) => ({
            title: exp.title,
            company: exp.company,
            duration: exp.isCurrentJob ?
                `${exp.startDate?.getFullYear() || ''} - Present` :
                `${exp.startDate?.getFullYear() || ''} - ${exp.endDate?.getFullYear() || 'Present'}`,
            description: [exp.description]
        })),
        education: education.map((edu) => ({
            degree: `${edu.degree} in ${edu.field}`,
            institution: edu.institution,
            year: edu.endDate ? edu.endDate.getFullYear().toString() :
                (edu.isCompleted ? 'Completed' : 'In Progress')
        })),
        projects
    };
}
function extractKeywordsFromJob(jobDescription) {
    const commonTechTerms = [
        'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
        'Git', 'API', 'REST', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Angular', 'Vue',
        'Express', 'Django', 'Flask', 'Spring', 'Kubernetes', 'CI/CD', 'Agile', 'Scrum'
    ];
    const keywords = commonTechTerms.filter(term => jobDescription.toLowerCase().includes(term.toLowerCase()));
    const words = jobDescription.toLowerCase().split(/\W+/);
    const additionalKeywords = words.filter(word => word.length > 4 &&
        !['with', 'experience', 'required', 'preferred', 'knowledge'].includes(word)).slice(0, 10);
    return [...keywords, ...additionalKeywords];
}
function generateJobFocusedSummary(jobDescription, studentProfile, keywords) {
    const roleMatch = jobDescription.match(/(?:position|role|job):\s*([^.]+)/i);
    const role = roleMatch ? roleMatch[1].trim() : 'technical professional';
    const topSkills = keywords.slice(0, 3).join(', ');
    if (studentProfile?.experience?.length > 0) {
        return `Results-driven professional with experience in ${topSkills} seeking to leverage expertise in a ${role} role. Proven track record of delivering technical solutions and contributing to team success with strong problem-solving abilities and commitment to excellence.`;
    }
    else {
        return `Motivated ${role} with strong foundation in ${topSkills}. Eager to apply technical skills and fresh perspective to drive innovation and contribute to organizational goals through dedicated effort and continuous learning.`;
    }
}
function prioritizeSkillsForJob(studentProfile, jobKeywords) {
    const allSkills = [
        ...(studentProfile?.skills?.map((skill) => skill.name) || []),
        ...(studentProfile?.resumeAnalysis?.skills || [])
    ];
    const uniqueSkills = [...new Set(allSkills)];
    const jobRelevantSkills = uniqueSkills.filter(skill => jobKeywords.some(keyword => skill.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(skill.toLowerCase())));
    const otherSkills = uniqueSkills.filter(skill => !jobRelevantSkills.includes(skill));
    return [...jobRelevantSkills, ...otherSkills].slice(0, 12).map((skill) => ({
        name: skill,
        level: 'intermediate',
        category: 'technical'
    }));
}
function enhanceExperienceForJob(experience, jobKeywords) {
    return experience.map((exp) => {
        let description = exp.description || [`Contributed to ${exp.company} operations and team objectives`];
        if (typeof description === 'string') {
            description = [description];
        }
        else if (!Array.isArray(description)) {
            description = [`Contributed to ${exp.company} operations and team objectives`];
        }
        const enhancedDescription = description.map((desc) => {
            if (jobKeywords.length > 0) {
                const relevantKeywords = jobKeywords.slice(0, 2);
                return `${desc} Utilized ${relevantKeywords.join(' and ')} to drive technical excellence and project success.`;
            }
            return desc;
        });
        return {
            title: exp.title,
            company: exp.company,
            location: exp.location,
            startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
            endDate: exp.endDate && !exp.isCurrentJob ? new Date(exp.endDate) : undefined,
            description: enhancedDescription.join('. '),
            isCurrentJob: exp.isCurrentJob || false
        };
    });
}
function enhanceProjectsForJob(projects, jobKeywords) {
    return projects.slice(0, 3).map((project) => {
        const baseDescription = project.description || `${project.name} project showcasing technical skills and problem-solving abilities`;
        const relevantTech = jobKeywords.filter(keyword => project.technologies?.some((tech) => tech.toLowerCase().includes(keyword.toLowerCase())));
        const enhancedDescription = relevantTech.length > 0 ?
            `${baseDescription} Leveraged ${relevantTech.join(', ')} to deliver scalable solutions and meet project objectives.` :
            baseDescription;
        return {
            name: project.name,
            description: enhancedDescription,
            technologies: project.technologies || []
        };
    });
}
function extractJobTitleFromDescription(jobDescription) {
    const lines = jobDescription.split('\n');
    const firstLine = lines[0].trim();
    const titlePatterns = [
        /^(.*?)\s*-\s*job/i,
        /^position:\s*(.*?)$/i,
        /^role:\s*(.*?)$/i,
        /^title:\s*(.*?)$/i,
        /^job title:\s*(.*?)$/i,
        /^(.*?)\s*position/i
    ];
    for (const pattern of titlePatterns) {
        const match = firstLine.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    if (firstLine.length < 100 && !firstLine.toLowerCase().includes('company') && !firstLine.toLowerCase().includes('location')) {
        return firstLine;
    }
    return 'Job Position';
}
async function generateResumePdfUrl(resumeData, resumeId) {
    try {
        const pdfCompatibleResume = {
            personalInfo: resumeData.personalInfo,
            summary: resumeData.summary,
            skills: (resumeData.skills || []).map((skill) => ({
                name: typeof skill === 'string' ? skill : skill.name,
                level: 'intermediate',
                category: 'technical'
            })),
            experience: (resumeData.experience || []).map((exp) => ({
                title: exp.title,
                company: exp.company,
                location: exp.location,
                startDate: new Date(),
                endDate: exp.duration?.includes('Present') ? undefined : new Date(),
                description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
                isCurrentJob: exp.duration?.includes('Present') || false
            })),
            education: (resumeData.education || []).map((edu) => ({
                degree: edu.degree || 'Degree',
                field: 'Field',
                institution: edu.institution || 'Institution',
                startDate: new Date(),
                endDate: edu.year === 'In Progress' ? undefined : new Date(),
                isCompleted: edu.year !== 'In Progress'
            })),
            projects: resumeData.projects || []
        };
        const resumeBuilder = resume_builder_1.default;
        const htmlContent = resumeBuilder.generateResumeHTML(pdfCompatibleResume);
        const pdfBuffer = await resumeBuilder.generatePDF(htmlContent);
        const base64Pdf = pdfBuffer.toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
        return `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/ai-resume/download-pdf-public/${resumeId}`;
    }
    catch (error) {
        console.error('Error generating PDF URL:', error);
        return null;
    }
}
async function sendResumeToWhatsApp(phoneNumber, pdfUrl, jobTitle) {
    try {
        const wabbWebhookUrl = process.env.WABB_WEBHOOK_URL_RESUME || process.env.WABB_WEBHOOK_URL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
        const payload = {
            number: phoneNumber,
            document: pdfUrl
        };
        console.log('Sending resume to Wabb:', payload);
        console.log('Using webhook URL:', wabbWebhookUrl);
        const response = await axios_1.default.post(wabbWebhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return {
            success: true,
            data: response.data,
            status: response.status
        };
    }
    catch (error) {
        console.error('Error sending resume to WhatsApp:', error);
        return {
            success: false,
            error: error?.message || 'Unknown error'
        };
    }
}
router.post('/debug-no-auth', async (req, res) => {
    try {
        console.log('=== DEBUG NO-AUTH AI RESUME GENERATION ===');
        const { email, jobDescription } = req.body;
        if (!email || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Email and job description are required'
            });
        }
        console.log('Email:', email);
        console.log('Job Description length:', jobDescription.length);
        let studentProfile = null;
        try {
            const { User } = require('../models/User');
            const user = await User.findOne({ email });
            if (user) {
                studentProfile = await Student_1.Student.findOne({ userId: user._id }).lean();
            }
        }
        catch (error) {
            console.log('Could not fetch student profile:', error);
        }
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found. Please complete your CampusPe profile first.'
            });
        }
        console.log('Found student:', studentProfile._id);
        const resumeData = await generateAIResume({
            email,
            phone: studentProfile.phoneNumber || '0000000000',
            jobDescription,
            studentProfile
        });
        console.log('✅ AI resume generated successfully');
        res.json({
            success: true,
            message: 'AI resume generated successfully',
            data: resumeData
        });
    }
    catch (error) {
        console.error('❌ Debug no-auth AI resume generation failed:', error);
        res.status(500).json({
            success: false,
            message: 'AI resume generation failed',
            error: error.message
        });
    }
});
router.post('/save-resume', async (req, res) => {
    try {
        const { resumeData, jobDescription, email } = req.body;
        if (!resumeData || !jobDescription || !email) {
            return res.status(400).json({
                success: false,
                message: 'Resume data, job description, and email are required'
            });
        }
        let studentProfile = null;
        try {
            const { User } = require('../models/User');
            const user = await User.findOne({ email });
            if (user) {
                studentProfile = await Student_1.Student.findOne({ userId: user._id }).lean();
            }
        }
        catch (error) {
            console.log('Could not fetch student profile:', error);
        }
        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        const pdfCompatibleResume = {
            personalInfo: resumeData.personalInfo,
            summary: resumeData.summary,
            skills: (resumeData.skills || []).map((skill) => ({
                name: typeof skill === 'string' ? skill : skill.name || skill,
                level: 'intermediate',
                category: 'technical'
            })),
            experience: (resumeData.experience || []).map((exp) => {
                const currentYear = new Date().getFullYear();
                const startYear = currentYear - 1;
                const endYear = exp.duration && exp.duration.includes('Present') ? null : currentYear;
                return {
                    title: exp.title || 'Position',
                    company: exp.company || 'Company',
                    location: '',
                    startDate: new Date(startYear, 0, 1),
                    endDate: endYear ? new Date(endYear, 11, 31) : null,
                    description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
                    responsibilities: Array.isArray(exp.description) ? exp.description : [exp.description || ''],
                    current: !endYear
                };
            }),
            education: (resumeData.education || []).map((edu) => {
                const year = parseInt(edu.year) || new Date().getFullYear();
                return {
                    degree: edu.degree || 'Degree',
                    institution: edu.institution || 'Institution',
                    year: edu.year || 'Year',
                    startDate: new Date(year - 4, 0, 1),
                    endDate: new Date(year, 11, 31)
                };
            }),
            projects: (resumeData.projects || []).map((project) => ({
                name: project.name || 'Project',
                description: project.description || 'Project description not available.',
                technologies: Array.isArray(project.technologies) ? project.technologies : [],
                startDate: new Date(2023, 0, 1),
                endDate: new Date(2023, 11, 31)
            }))
        };
        const htmlContent = resume_builder_1.default.generateResumeHTML(pdfCompatibleResume);
        const pdfBuffer = await resume_builder_1.default.generatePDF(htmlContent);
        const jobTitle = 'AI Generated Resume';
        const fileName = `${resumeData.personalInfo.name || 'Resume'}_${jobTitle}_${Date.now()}.pdf`;
        const generatedResume = await generated_resume_service_1.default.createGeneratedResume({
            studentId: studentProfile._id.toString(),
            jobTitle,
            jobDescription,
            resumeData: pdfCompatibleResume,
            fileName,
            pdfBuffer,
            matchScore: 85,
            aiEnhancementUsed: true,
            matchedSkills: [],
            missingSkills: [],
            suggestions: [],
            generationType: 'ai'
        });
        console.log('✅ Resume saved with ID:', generatedResume.resumeId);
        res.json({
            success: true,
            message: 'Resume saved successfully',
            resumeId: generatedResume.resumeId,
            fileName: fileName
        });
    }
    catch (error) {
        console.error('❌ Save resume failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save resume',
            error: error.message
        });
    }
});
router.post('/send-to-whatsapp', async (req, res) => {
    try {
        const { resumeId, phoneNumber, jobTitle } = req.body;
        if (!resumeId || !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Resume ID and phone number are required'
            });
        }
        const pdfUrl = await generateResumePdfUrl({}, resumeId);
        if (!pdfUrl) {
            return res.status(404).json({
                success: false,
                message: 'Failed to generate PDF URL'
            });
        }
        const whatsappResponse = await sendResumeToWhatsApp(phoneNumber, pdfUrl, jobTitle || 'Resume');
        res.json({
            success: whatsappResponse.success,
            message: whatsappResponse.message,
            pdfUrl: pdfUrl
        });
    }
    catch (error) {
        console.error('❌ Send to WhatsApp failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send to WhatsApp',
            error: error.message
        });
    }
});
router.post('/test-generate', async (req, res) => {
    try {
        console.log('🧪 Test resume generation endpoint');
        const { email, phone, jobDescription } = req.body;
        if (!email || !phone || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Email, phone, and job description are required',
                required: ['email', 'phone', 'jobDescription']
            });
        }
        console.log(`🧪 Test generation for ${email} (${phone})`);
        const result = await resume_builder_1.default.createTailoredResume(email, phone, jobDescription);
        if (result.success) {
            res.json({
                success: true,
                message: 'Test resume generated successfully',
                data: {
                    resumeId: result.resumeId,
                    fileName: result.fileName,
                    downloadUrl: result.downloadUrl,
                    pdfSize: result.pdfBuffer?.length
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
        console.error('❌ Test generation failed:', error);
        res.status(500).json({
            success: false,
            message: 'Test generation failed',
            error: error.message
        });
    }
});
function transformResumeDataForSchema(resumeData) {
    try {
        console.log('🔄 Transforming resume data for schema compatibility...');
        const sourceData = resumeData.resumeData || resumeData;
        const transformed = {
            personalInfo: {
                firstName: sourceData.personalInfo?.firstName || sourceData.firstName || 'Unknown',
                lastName: sourceData.personalInfo?.lastName || sourceData.lastName || 'User',
                email: sourceData.personalInfo?.email || sourceData.email || '',
                phone: sourceData.personalInfo?.phone || sourceData.phone || '',
                address: sourceData.personalInfo?.address || sourceData.address || '',
                linkedin: sourceData.personalInfo?.linkedin || sourceData.linkedin || '',
                website: sourceData.personalInfo?.website || sourceData.website || ''
            },
            summary: sourceData.summary || sourceData.professionalSummary || '',
            skills: [],
            experience: [],
            education: [],
            projects: [],
            certifications: [],
            languages: []
        };
        if (sourceData.skills && Array.isArray(sourceData.skills)) {
            transformed.skills = sourceData.skills.map((skill) => {
                if (typeof skill === 'string') {
                    return {
                        name: skill,
                        level: 'Intermediate',
                        category: 'Technical'
                    };
                }
                return {
                    name: skill.name || skill.skill || skill,
                    level: skill.level || 'Intermediate',
                    category: skill.category || 'Technical'
                };
            });
        }
        if (sourceData.experience && Array.isArray(sourceData.experience)) {
            transformed.experience = sourceData.experience.map((exp) => ({
                company: exp.company || '',
                position: exp.position || exp.title || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                description: exp.description || '',
                responsibilities: exp.responsibilities || []
            }));
        }
        if (sourceData.education && Array.isArray(sourceData.education)) {
            transformed.education = sourceData.education.map((edu) => ({
                institution: edu.institution || edu.school || '',
                degree: edu.degree || '',
                fieldOfStudy: edu.fieldOfStudy || edu.field || '',
                graduationYear: edu.graduationYear || edu.year || '',
                gpa: edu.gpa || ''
            }));
        }
        if (sourceData.projects && Array.isArray(sourceData.projects)) {
            transformed.projects = sourceData.projects.map((proj) => ({
                name: proj.name || proj.title || '',
                description: proj.description || '',
                technologies: proj.technologies || [],
                link: proj.link || proj.url || ''
            }));
        }
        if (sourceData.certifications && Array.isArray(sourceData.certifications)) {
            transformed.certifications = sourceData.certifications.map((cert) => ({
                name: cert.name || cert.title || '',
                issuer: cert.issuer || cert.organization || '',
                date: cert.date || cert.issueDate || '',
                link: cert.link || cert.url || ''
            }));
        }
        if (sourceData.languages && Array.isArray(sourceData.languages)) {
            transformed.languages = sourceData.languages.map((lang) => {
                if (typeof lang === 'string') {
                    return {
                        name: lang,
                        proficiency: 'Fluent'
                    };
                }
                return {
                    name: lang.name || lang.language || lang,
                    proficiency: lang.proficiency || lang.level || 'Fluent'
                };
            });
        }
        console.log('✅ Resume data transformation completed');
        console.log('📊 Transformed data structure:', {
            personalInfo: !!transformed.personalInfo.firstName,
            skillsCount: transformed.skills.length,
            experienceCount: transformed.experience.length,
            educationCount: transformed.education.length
        });
        return transformed;
    }
    catch (error) {
        console.error('❌ Error transforming resume data:', error);
        return {
            personalInfo: {
                firstName: 'Unknown',
                lastName: 'User',
                email: '',
                phone: '',
                address: '',
                linkedin: '',
                website: ''
            },
            summary: '',
            skills: [],
            experience: [],
            education: [],
            projects: [],
            certifications: [],
            languages: []
        };
    }
}
exports.default = router;
