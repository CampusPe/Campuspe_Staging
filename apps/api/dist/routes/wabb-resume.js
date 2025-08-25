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
const axios_1 = __importDefault(require("axios"));
const resume_builder_1 = __importDefault(require("../services/resume-builder"));
const whatsapp_1 = require("../services/whatsapp");
const mock_whatsapp_1 = __importDefault(require("../services/mock-whatsapp"));
const Student_1 = require("../models/Student");
const User_1 = require("../models/User");
const ai_resume_matching_1 = __importDefault(require("../services/ai-resume-matching"));
const generated_resume_service_1 = __importDefault(require("../services/generated-resume.service"));
async function sendWhatsAppWithFallback(phone, message, serviceType = 'general') {
    const hasWabbConfig = process.env.WABB_API_KEY || process.env.WABB_WEBHOOK_URL;
    if (!hasWabbConfig) {
        console.log('⚠️ WABB not configured, using mock WhatsApp service');
        return await mock_whatsapp_1.default.sendMessage(phone, message, serviceType);
    }
    try {
        return await (0, whatsapp_1.sendWhatsAppMessage)(phone, message, serviceType);
    }
    catch (error) {
        console.log('⚠️ WABB service failed, falling back to mock service:', error);
        return await mock_whatsapp_1.default.sendMessage(phone, message, serviceType);
    }
}
const router = express_1.default.Router();
router.get('/debug-user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { Student } = require('../models/Student');
        const { User } = require('../models/User');
        console.log(`🔍 Debugging user lookup for: ${email}`);
        const student = await Student.findOne({ email: email }).populate('userId');
        console.log('Student found:', !!student);
        const user = await User.findOne({ email: email });
        console.log('User found:', !!user);
        res.json({
            email,
            studentExists: !!student,
            userExists: !!user,
            studentData: student ? {
                id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                skills: student.skills?.length || 0,
                experience: student.experience?.length || 0
            } : null,
            userData: user ? {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.firstName + ' ' + user.lastName
            } : null
        });
    }
    catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error?.message || 'Unknown error' });
    }
});
router.post('/create-resume', async (req, res) => {
    try {
        console.log('🚀 WABB Resume Creation Request:', req.body);
        const { email, phone, jobDescription, name } = req.body;
        if (!email || !phone || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Email, phone, and job description are required',
                required: ['email', 'phone', 'jobDescription']
            });
        }
        const cleanPhone = phone.replace(/[^\d]/g, '');
        console.log(`📱 Processing resume request for ${email} (${cleanPhone})`);
        await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `🎯 *Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a tailored resume for you based on the job description you provided.\n\n⏳ This will take 30-60 seconds...\n\n🔍 *What I'm doing:*\n• Analyzing the job requirements\n• Fetching your profile from CampusPe\n• Tailoring your resume to match\n• Generating PDF document\n\nI'll send you the resume shortly! 📄✨`, 'resume');
        const result = await resume_builder_1.default.createTailoredResume(email, cleanPhone, jobDescription);
        if (!result.success) {
            console.error('❌ Resume generation failed:', result.message);
            await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `❌ *Resume Generation Failed*\n\n${result.message}\n\n💡 *Possible reasons:*\n• Profile not found on CampusPe\n• Incomplete profile information\n• Technical error\n\n🔗 Please visit CampusPe.com to:\n• Create/update your profile\n• Upload your resume\n• Add your skills and experience\n\nThen try again! 😊`);
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
        console.log('✅ Resume generated successfully');
        const pdfBase64 = result.pdfBuffer.toString('base64');
        await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `🎉 *Resume Generated Successfully!*\n\nYour tailored resume is ready! 📄✨\n\n🎯 *Customized for:*\n• Job requirements analysis\n• Your skills & experience\n• Professional formatting\n\n📩 *Resume details:*\n• File: ${result.fileName}\n• Tailored: ${new Date().toLocaleDateString()}\n• Size: ${Math.round(result.pdfBuffer.length / 1024)}KB\n\n� *Download Link:*\n${result.downloadUrl || 'Available on CampusPe.com'}\n\n�💼 Good luck with your application!\n\n🔗 Update your profile: CampusPe.com`);
        res.json({
            success: true,
            message: 'Resume generated and sent via WhatsApp',
            fileName: result.fileName,
            fileSize: result.pdfBuffer.length,
            resumeId: result.resumeId,
            downloadUrl: result.downloadUrl,
            metadata: {
                generatedAt: new Date().toISOString(),
                email,
                phone: cleanPhone,
                jobDescriptionLength: jobDescription.length
            }
        });
    }
    catch (error) {
        console.error('❌ WABB Resume Creation Error:', error);
        if (req.body.phone) {
            const cleanPhone = req.body.phone.replace(/[^\d]/g, '');
            await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `❌ *Technical Error*\n\nSorry, I encountered an error while generating your resume.\n\n🔧 Our team has been notified and will fix this shortly.\n\n💡 You can try again in a few minutes or visit CampusPe.com to generate your resume manually.\n\nApologies for the inconvenience! 🙏`);
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error during resume generation',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/generate-and-share', async (req, res) => {
    try {
        console.log('🚀 WABB Auto-Generate & Share Request:', req.body);
        const { email, phone, name, jobDescription } = req.body;
        if (!email || !phone || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Email, phone, and job description are required',
                required: ['email', 'phone', 'jobDescription']
            });
        }
        const cleanPhone = phone.replace(/[^\d]/g, '');
        console.log(`📱 Auto-processing resume request for ${email} (${cleanPhone})`);
        await sendWhatsAppWithFallback(cleanPhone, `🎯 *AI Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a personalized resume for you.\n\n⏳ This will take 30-60 seconds...\n\n🔍 *Processing:*\n• Analyzing job requirements\n• Fetching your CampusPe profile\n• AI-powered resume tailoring\n• Generating professional PDF\n\nYour resume will be ready shortly! 📄✨`, 'resume');
        console.log('📊 Looking up student profile...');
        let studentProfile = null;
        let result = {
            success: false,
            message: '',
            resumeId: '',
            fileName: '',
            pdfBuffer: null,
            downloadUrl: ''
        };
        try {
            const user = await User_1.User.findOne({ email });
            if (user) {
                studentProfile = await Student_1.Student.findOne({ userId: user._id }).lean();
            }
        }
        catch (error) {
            console.log('Could not fetch student profile:', error);
        }
        if (!studentProfile) {
            result.message = 'Student profile not found. Please complete your CampusPe profile first.';
        }
        else {
            try {
                const personalInfo = {
                    name: `${studentProfile.firstName} ${studentProfile.lastName}`.trim(),
                    firstName: studentProfile.firstName,
                    lastName: studentProfile.lastName,
                    email,
                    phone: cleanPhone,
                    linkedin: studentProfile?.linkedinUrl || undefined,
                    github: studentProfile?.githubUrl || undefined
                };
                const userProfileText = `
PERSONAL INFO:
Name: ${personalInfo.name}
Email: ${email}
Phone: ${cleanPhone}

SKILLS:
${(studentProfile?.skills || []).map((skill) => `- ${skill.name || skill}`).join('\n')}

EXPERIENCE:
${(studentProfile?.experience || []).map((exp) => `- ${exp.title} at ${exp.company} (${exp.startDate || 'Date'} - ${exp.endDate || 'Present'})`).join('\n')}

EDUCATION:
${(studentProfile?.education || []).map((edu) => `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.endDate || 'In Progress'})`).join('\n')}
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
                const aiResponse = await ai_resume_matching_1.default.callClaudeAPI(aiPrompt);
                console.log('🤖 AI Response received:', JSON.stringify(aiResponse, null, 2));
                if (aiResponse && aiResponse.content) {
                    try {
                        console.log('📝 Raw AI content:', aiResponse.content);
                        const aiContent = JSON.parse(aiResponse.content);
                        const resumeData = {
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
                                degree: edu.degree,
                                institution: edu.institution,
                                year: edu.year
                            })),
                            projects: aiContent.projects || []
                        };
                        console.log('✅ AI resume content parsed successfully');
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
                        console.log('✅ AI resume content generated, creating PDF...');
                        const htmlContent = resume_builder_1.default.generateResumeHTML(pdfCompatibleResume);
                        const pdfBuffer = await resume_builder_1.default.generatePDF(htmlContent);
                        if (!pdfBuffer) {
                            throw new Error('PDF generation returned null buffer');
                        }
                        console.log('✅ PDF generated successfully, size:', pdfBuffer.length);
                        const jobTitle = 'AI Generated Resume';
                        const fileName = `${personalInfo.name || 'Resume'}_${jobTitle}_${Date.now()}.pdf`;
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
                        result = {
                            success: true,
                            message: 'Resume generated successfully',
                            resumeId: generatedResume.resumeId,
                            fileName: fileName,
                            pdfBuffer: pdfBuffer,
                            downloadUrl: `https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net/api/generated-resume/download/${generatedResume.resumeId}`
                        };
                    }
                    catch (parseError) {
                        console.error('❌ Failed to parse AI response:', parseError);
                        console.error('❌ Raw AI content that failed to parse:', aiResponse.content);
                        result.message = `AI response parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`;
                    }
                }
                else {
                    result.message = 'AI service returned no content';
                }
            }
            catch (aiError) {
                console.error('AI resume generation failed:', aiError);
                result.message = `AI generation failed: ${aiError.message}`;
            }
        }
        if (!result.success) {
            console.error('❌ Auto resume generation failed:', result.message);
            if (result.message.includes('Student profile not found')) {
                console.log('� User not found in database - sending detailed notification webhook');
                try {
                    const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
                    const webhookPayload = {
                        number: cleanPhone,
                        message: `👋 Hi ${email},\n\nWe noticed you tried creating an AI resume but you’re not registered yet.\n\n✨ To continue, please register at 👉 dev.campuspe.com\n\nOnce you sign up, you’ll be able to generate and download your professional resume in minutes 🚀`
                    };
                    console.log('📡 Sending webhook notification for unregistered user:', {
                        webhookUrl,
                        targetNumber: cleanPhone,
                        userEmail: email,
                        userPhone: phone
                    });
                    const webhookResponse = await axios_1.default.post(webhookUrl, webhookPayload, {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });
                    console.log('✅ Webhook notification sent successfully:', webhookResponse.status);
                }
                catch (webhookError) {
                    console.error('❌ Failed to send webhook notification:', webhookError?.message || 'Unknown error');
                }
            }
            else {
                console.log('📱 Sending WhatsApp failure notification to:', cleanPhone);
                try {
                    await sendWhatsAppWithFallback(cleanPhone, `❌ *Resume Generation Failed*\n\n${result.message}\n\n💡 *Possible solutions:*\n• Complete your profile information\n• Upload your current resume\n• Try again in a few minutes\n\n🔗 Visit: CampusPe.com\n\nNeed help? Reply to this message! 😊`, 'resume');
                    console.log('✅ WhatsApp failure notification sent successfully');
                }
                catch (whatsappError) {
                    console.error('❌ Failed to send WhatsApp failure notification:', whatsappError?.message);
                }
            }
            return res.status(400).json({
                success: false,
                message: 'User not found in database. Please register first to generate your AI resume.',
                code: 'USER_NOT_FOUND',
                action: 'REGISTRATION_REQUIRED',
                details: {
                    email,
                    phone,
                    webhookTriggered: true,
                    adminNotified: true
                }
            });
        }
        console.log('✅ Auto resume generated successfully, sharing via WhatsApp...');
        try {
            const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5001';
            const shareResponse = await axios_1.default.post(`${apiBaseUrl}/api/generated-resume/wabb-send-document`, {
                resumeId: result.resumeId,
                number: cleanPhone
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 15000
            });
            const shareResult = shareResponse.data;
            if (shareResult.success) {
                console.log('✅ Resume automatically shared via WhatsApp');
                await sendWhatsAppWithFallback(cleanPhone, `🎉 *Resume Generated & Shared!*\n\nYour AI-tailored resume is ready! 📄✨\n\n🎯 *Optimized for:*\n• Job-specific requirements\n• Your skills & experience\n• ATS compatibility\n• Professional formatting\n\n📊 *Resume Details:*\n• File: ${result.fileName}\n• Generated: ${new Date().toLocaleDateString()}\n• Size: ${Math.round(result.pdfBuffer.length / 1024)}KB\n\n💼 Best of luck with your application!\n\n🔗 Update profile: CampusPe.com`, 'resume');
                return res.json({
                    success: true,
                    message: 'Resume generated and automatically shared via WhatsApp',
                    data: {
                        resumeId: result.resumeId,
                        fileName: result.fileName,
                        fileSize: result.pdfBuffer.length,
                        downloadUrl: result.downloadUrl,
                        sharedViaWhatsApp: true,
                        metadata: {
                            generatedAt: new Date().toISOString(),
                            email,
                            phone: cleanPhone,
                            name,
                            jobDescriptionLength: jobDescription.length,
                            autoShared: true
                        }
                    }
                });
            }
            else {
                console.error('❌ WhatsApp sharing failed:', shareResult.message);
                await sendWhatsAppWithFallback(cleanPhone, `✅ *Resume Generated Successfully!*\n\nYour resume is ready, but I couldn't send the file automatically.\n\n📥 *Download Link:*\n${result.downloadUrl || 'Available on CampusPe.com'}\n\n📄 File: ${result.fileName}\n\n💼 Good luck with your application!`);
                return res.json({
                    success: true,
                    message: 'Resume generated successfully, but automatic WhatsApp sharing failed',
                    data: {
                        resumeId: result.resumeId,
                        fileName: result.fileName,
                        fileSize: result.pdfBuffer.length,
                        downloadUrl: result.downloadUrl,
                        sharedViaWhatsApp: false,
                        shareError: shareResult.message,
                        metadata: {
                            generatedAt: new Date().toISOString(),
                            email,
                            phone: cleanPhone,
                            name,
                            jobDescriptionLength: jobDescription.length,
                            autoShared: false
                        }
                    }
                });
            }
        }
        catch (shareError) {
            console.error('❌ WhatsApp sharing error:', shareError);
            await sendWhatsAppWithFallback(cleanPhone, `✅ *Resume Generated!*\n\nYour resume is ready!\n\n📥 *Download:*\n${result.downloadUrl || 'Visit CampusPe.com'}\n\n📄 ${result.fileName}\n\n💼 Good luck!`);
            return res.json({
                success: true,
                message: 'Resume generated successfully, but WhatsApp sharing encountered an error',
                data: {
                    resumeId: result.resumeId,
                    fileName: result.fileName,
                    fileSize: result.pdfBuffer.length,
                    downloadUrl: result.downloadUrl,
                    sharedViaWhatsApp: false,
                    shareError: shareError instanceof Error ? shareError.message : 'Unknown sharing error',
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        email,
                        phone: cleanPhone,
                        name,
                        jobDescriptionLength: jobDescription.length,
                        autoShared: false
                    }
                }
            });
        }
    }
    catch (error) {
        console.error('❌ WABB Auto-Generate & Share Error:', error);
        if (req.body.phone) {
            const cleanPhone = req.body.phone.replace(/[^\d]/g, '');
            await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `❌ *Technical Error*\n\nSorry, I encountered an error while generating your resume.\n\n🔧 Our team has been notified.\n\n💡 Please try again in a few minutes or visit CampusPe.com\n\nApologies for the inconvenience! 🙏`);
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error during auto resume generation',
            error: error instanceof Error ? error.message : 'Unknown error',
            code: 'INTERNAL_ERROR'
        });
    }
});
router.post('/analyze-job', async (req, res) => {
    try {
        const { jobDescription, phone } = req.body;
        if (!jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Job description is required'
            });
        }
        console.log('🔍 Analyzing job description for WhatsApp user...');
        const analysis = await resume_builder_1.default.analyzeJobDescription(jobDescription);
        if (phone) {
            const cleanPhone = phone.replace(/[^\d]/g, '');
            const analysisMessage = `🔍 *Job Analysis Complete*\n\n📋 *Requirements Found:*\n${analysis.requiredSkills.slice(0, 6).map(skill => `• ${skill}`).join('\n')}\n\n📈 *Level:* ${analysis.jobLevel.toUpperCase()}\n🏢 *Industry:* ${analysis.industry}\n\n💡 *Ready to create your tailored resume?*\nSend me your email and I'll generate a customized resume for this job!`;
            await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, analysisMessage);
        }
        res.json({
            success: true,
            analysis,
            message: 'Job description analyzed successfully'
        });
    }
    catch (error) {
        console.error('❌ Job analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze job description'
        });
    }
});
router.get('/test', async (req, res) => {
    try {
        const { phone } = req.query;
        if (phone) {
            const cleanPhone = phone.replace(/[^\d]/g, '');
            await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `🧪 *WABB Integration Test*\n\nHello! This is a test message from CampusPe's resume builder service.\n\n✅ WhatsApp integration is working!\n\n🎯 *Available Commands:*\n• Send job description + email for tailored resume\n• Get job requirement analysis\n• Professional resume generation\n\nTest completed successfully! 🚀`);
        }
        res.json({
            success: true,
            message: 'WABB integration test completed',
            timestamp: new Date().toISOString(),
            phone: phone ? phone.replace(/[^\d]/g, '') : null
        });
    }
    catch (error) {
        console.error('❌ WABB test error:', error);
        res.status(500).json({
            success: false,
            message: 'WABB test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/webhook', async (req, res) => {
    try {
        console.log('📨 WABB Webhook received:', req.body);
        const { phone, message, name, type, timestamp } = req.body;
        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone and message are required'
            });
        }
        const cleanPhone = phone.replace(/[^\d]/g, '');
        const { WhatsAppResumeFlow } = await Promise.resolve().then(() => __importStar(require('../services/whatsapp-resume-flow')));
        await WhatsAppResumeFlow.handleIncomingMessage(cleanPhone, message, name);
        res.json({
            success: true,
            message: 'Webhook processed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ WABB webhook error:', error);
        if (req.body.phone) {
            const cleanPhone = req.body.phone.replace(/[^\d]/g, '');
            await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `❌ *Technical Error*\n\nSorry! I encountered an error processing your message.\n\n� Please try again in a moment or contact support.\n\n💡 Type "help" for assistance.`);
        }
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
        });
    }
});
router.post('/test-whatsapp', async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }
        const testMessage = message || '🧪 Test WhatsApp notification from CampusPe API';
        console.log('🧪 Testing WhatsApp notification:', { phone, message: testMessage });
        const result = await (0, whatsapp_1.sendWhatsAppMessage)(phone, testMessage, 'resume');
        res.json({
            success: true,
            message: 'WhatsApp test completed',
            result
        });
    }
    catch (error) {
        console.error('❌ WhatsApp test failed:', error);
        res.status(500).json({
            success: false,
            message: error?.message || 'WhatsApp test failed'
        });
    }
});
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'WABB Resume Service is running',
        timestamp: new Date().toISOString(),
        endpoints: [
            'POST /api/wabb/create-resume',
            'POST /api/wabb/generate-and-share',
            'GET /api/wabb/debug-user/:email',
            'POST /api/wabb/debug-generate-and-share',
            'POST /api/wabb/webhook',
            'GET /api/wabb/health'
        ]
    });
});
router.post('/debug-generate-and-share', async (req, res) => {
    try {
        console.log('🚀 DEBUG: WABB Auto-Generate & Share Request:', req.body);
        const { email, phone, name, jobDescription } = req.body;
        if (!email || !phone || !jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Email, phone, and job description are required',
                required: ['email', 'phone', 'jobDescription']
            });
        }
        const cleanPhone = phone.replace(/[^\d]/g, '');
        console.log(`📱 DEBUG: Auto-processing resume request for ${email} (${cleanPhone})`);
        const { Student } = require('../models/Student');
        const student = await Student.findOne({ email: email }).populate('userId');
        if (!student) {
            console.log('❌ DEBUG: Student not found');
            return res.status(400).json({
                success: false,
                message: 'Student profile not found',
                code: 'USER_NOT_FOUND'
            });
        }
        console.log('✅ DEBUG: Student found:', student.firstName, student.lastName);
        try {
            console.log('🔍 DEBUG: Starting job analysis...');
            const ResumeBuilderService = require('../services/resume-builder').default;
            const jobAnalysis = await ResumeBuilderService.analyzeJobDescription(jobDescription);
            console.log('✅ DEBUG: Job analysis completed:', {
                requiredSkills: jobAnalysis.requiredSkills?.length || 0,
                preferredSkills: jobAnalysis.preferredSkills?.length || 0,
                jobLevel: jobAnalysis.jobLevel
            });
        }
        catch (analysisError) {
            console.error('❌ DEBUG: Job analysis failed:', analysisError?.message);
            return res.status(500).json({
                success: false,
                message: 'Job analysis failed: ' + analysisError?.message,
                code: 'ANALYSIS_FAILED'
            });
        }
        try {
            console.log('📋 DEBUG: Getting student data...');
            const ResumeBuilderService = require('../services/resume-builder').default;
            const studentData = await ResumeBuilderService.getStudentData(email, cleanPhone);
            if (!studentData) {
                console.log('❌ DEBUG: Student data retrieval failed');
                return res.status(400).json({
                    success: false,
                    message: 'Failed to retrieve student data',
                    code: 'DATA_RETRIEVAL_FAILED'
                });
            }
            console.log('✅ DEBUG: Student data retrieved:', {
                name: `${studentData.personalInfo.firstName} ${studentData.personalInfo.lastName}`,
                skillsCount: studentData.skills?.length || 0,
                experienceCount: studentData.experience?.length || 0
            });
        }
        catch (dataError) {
            console.error('❌ DEBUG: Student data retrieval failed:', dataError?.message);
            return res.status(500).json({
                success: false,
                message: 'Student data retrieval failed: ' + dataError?.message,
                code: 'DATA_FAILED'
            });
        }
        try {
            console.log('🎯 DEBUG: Starting full resume generation...');
            const ResumeBuilderService = require('../services/resume-builder').default;
            const result = await ResumeBuilderService.createTailoredResume(email, cleanPhone, jobDescription);
            console.log('📊 DEBUG: Resume generation result:', {
                success: result.success,
                message: result.message,
                hasBuffer: !!result.pdfBuffer,
                fileName: result.fileName
            });
            return res.json({
                success: true,
                message: 'Debug completed successfully',
                debugResult: {
                    userExists: true,
                    jobAnalysisWorking: true,
                    studentDataWorking: true,
                    resumeGeneration: result
                }
            });
        }
        catch (resumeError) {
            console.error('❌ DEBUG: Resume generation failed:', resumeError?.message);
            return res.status(500).json({
                success: false,
                message: 'Resume generation failed: ' + resumeError?.message,
                code: 'RESUME_FAILED'
            });
        }
    }
    catch (error) {
        console.error('❌ DEBUG: Overall error:', error?.message);
        res.status(500).json({
            success: false,
            message: 'Debug failed: ' + error?.message,
            code: 'DEBUG_FAILED'
        });
    }
});
exports.default = router;
