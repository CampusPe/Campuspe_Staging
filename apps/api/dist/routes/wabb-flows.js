"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const whatsapp_1 = require("../services/whatsapp");
const resume_builder_1 = __importDefault(require("../services/resume-builder"));
const User_1 = require("../models/User");
const Student_1 = require("../models/Student");
const router = express_1.default.Router();
const flowStates = new Map();
router.post('/webhook', async (req, res) => {
    try {
        console.log('🔄 WABB Flow Webhook received:', JSON.stringify(req.body, null, 2));
        const { phone, message, name, type, flow_step, email, jobDescription, timestamp } = req.body;
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }
        const cleanPhone = phone.replace(/[^\d]/g, '');
        switch (type) {
            case 'resume_start':
                await handleResumeStart(cleanPhone, name, flow_step);
                break;
            case 'email_collected':
                await handleEmailCollected(cleanPhone, email, name);
                break;
            case 'job_description_collected':
                await handleJobDescriptionCollected(cleanPhone, jobDescription, name);
                break;
            case 'conversation_reset':
                await handleConversationReset(cleanPhone);
                break;
            case 'general_message':
                await handleGeneralMessage(cleanPhone, message, name);
                break;
            default:
                console.log('🔍 Unknown webhook type:', type);
                await handleGeneralMessage(cleanPhone, message, name);
        }
        res.json({
            success: true,
            message: 'Webhook processed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ WABB Flow webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
        });
    }
});
async function handleResumeStart(phone, name, flowStep) {
    console.log(`🚀 Resume flow started for ${phone} (${name})`);
    const state = {
        phone,
        step: 'initiated',
        name,
        attemptCount: 0,
        lastActivity: new Date()
    };
    flowStates.set(phone, state);
    console.log(`📊 Flow state created for ${phone}:`, state);
}
async function handleEmailCollected(phone, email, name) {
    console.log(`📧 Email collected for ${phone}: ${email}`);
    const state = flowStates.get(phone);
    if (state) {
        state.email = email;
        state.step = 'email_collected';
        state.lastActivity = new Date();
        flowStates.set(phone, state);
    }
    else {
        flowStates.set(phone, {
            phone,
            step: 'email_collected',
            email,
            name,
            attemptCount: 0,
            lastActivity: new Date()
        });
    }
    const userExists = await checkUserExists(email);
    console.log(`👤 User exists in CampusPe: ${userExists}`);
}
async function handleJobDescriptionCollected(phone, jobDescription, name) {
    console.log(`📋 Job description collected for ${phone} (${jobDescription.length} chars)`);
    const state = flowStates.get(phone);
    if (!state || !state.email) {
        console.error('❌ No email found for user, cannot generate resume');
        await (0, whatsapp_1.sendWhatsAppMessage)(phone, '❌ *Error: Missing Email*\n\nI don\'t have your email address. Please start over by typing "resume".');
        return;
    }
    state.jobDescription = jobDescription;
    state.step = 'processing';
    state.lastActivity = new Date();
    flowStates.set(phone, state);
    try {
        console.log(`🤖 Starting resume generation for ${state.email}`);
        const result = await resume_builder_1.default.createTailoredResume(state.email, phone, jobDescription);
        if (result.success) {
            state.step = 'completed';
            state.lastActivity = new Date();
            flowStates.set(phone, state);
            console.log(`✅ Resume generated successfully: ${result.fileName}`);
            await (0, whatsapp_1.sendWhatsAppMessage)(phone, `🎉 *Resume Generated Successfully!*\n\n📄 *Your tailored resume is ready!*\n\n📊 **Resume Details:**\n• File: ${result.fileName}\n• Size: ${Math.round(result.pdfBuffer.length / 1024)}KB\n• Generated: ${new Date().toLocaleString()}\n• Optimized for the job requirements\n\n🎯 **What I customized:**\n• Skills matching job requirements\n• Experience relevance\n• Professional summary\n• Keywords for ATS systems\n\n📥 **Download Link:**\n${result.downloadUrl || 'Check your CampusPe account'}\n\n🚀 **Next Steps:**\n• Review and fine-tune if needed\n• Submit your application\n• Track on CampusPe.com\n\n💼 Good luck with your application!\n\n🔄 Need another resume? Type "resume"`);
            setTimeout(() => {
                flowStates.delete(phone);
                console.log(`🧹 Cleaned up flow state for ${phone}`);
            }, 5 * 60 * 1000);
        }
        else {
            console.error(`❌ Resume generation failed: ${result.message}`);
            await (0, whatsapp_1.sendWhatsAppMessage)(phone, `❌ *Resume Generation Failed*\n\n**Error:** ${result.message}\n\n🔧 **Common solutions:**\n• Ensure you have a complete CampusPe profile\n• Verify your email is correct\n• Add skills and experience to your profile\n• Try again in a few minutes\n\n🌐 **Create/Update Profile:**\nhttps://campuspe.com/profile\n\n🔄 **Try Again:** Type "resume"\n💡 **Need Help:** Type "help"`);
            if (state) {
                state.step = 'initiated';
                state.attemptCount += 1;
                flowStates.set(phone, state);
            }
        }
    }
    catch (error) {
        console.error('❌ Resume generation error:', error);
        await (0, whatsapp_1.sendWhatsAppMessage)(phone, `❌ *Technical Error*\n\nSorry! I encountered a technical issue while generating your resume.\n\n🔧 **What happened:**\n• Server processing error\n• Our team has been notified\n• This will be fixed shortly\n\n🔄 **Try again in 5 minutes**\n💻 **Alternative:** Visit CampusPe.com\n💡 **Support:** Contact our team\n\n🙏 Apologies for the inconvenience!`);
        flowStates.delete(phone);
    }
}
async function handleConversationReset(phone) {
    console.log(`🔄 Conversation reset for ${phone}`);
    flowStates.delete(phone);
    console.log(`📊 Flow state cleared for ${phone}`);
}
async function handleGeneralMessage(phone, message, name) {
    console.log(`💬 General message from ${phone}: ${message}`);
    const messageText = message?.toLowerCase() || '';
    if (messageText.includes('resume') || messageText.includes('cv')) {
        await (0, whatsapp_1.sendWhatsAppMessage)(phone, `🎯 *Ready to create a resume?*\n\nHi ${name || 'there'}! To start the resume builder, simply type:\n\n📝 **"resume"**\n\nI'll guide you through the process step by step!\n\n💡 Make sure you have:\n• Your email address ready\n• The job description you're applying for\n\n🚀 Type "resume" to begin!`);
    }
    else {
        await (0, whatsapp_1.sendWhatsAppMessage)(phone, `👋 *Welcome to CampusPe!*\n\nHi ${name || 'there'}! I'm your AI Resume Assistant.\n\n🤖 **What I can do:**\n• Create job-tailored resumes\n• Analyze job requirements\n• Optimize for ATS systems\n• Generate professional PDFs\n\n🚀 **Get Started:**\n• Type "resume" - Start building\n• Type "help" - Get detailed guide\n\n🔗 Visit CampusPe.com for more features!`);
    }
}
async function checkUserExists(email) {
    try {
        const user = await User_1.User.findOne({ email }).lean();
        if (user) {
            const student = await Student_1.Student.findOne({ userId: user._id }).lean();
            return !!student;
        }
        return false;
    }
    catch (error) {
        console.error('Error checking user existence:', error);
        return false;
    }
}
router.get('/stats', async (req, res) => {
    try {
        const activeFlows = flowStates.size;
        const flowsByStep = {
            initiated: 0,
            email_collected: 0,
            processing: 0,
            completed: 0
        };
        for (const state of flowStates.values()) {
            if (state.step in flowsByStep) {
                flowsByStep[state.step]++;
            }
        }
        res.json({
            success: true,
            data: {
                activeFlows,
                flowsByStep,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error fetching flow stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});
function cleanupOldFlowStates() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    let cleanedCount = 0;
    for (const [phone, state] of flowStates.entries()) {
        if (state.lastActivity < oneHourAgo) {
            flowStates.delete(phone);
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} old flow states`);
    }
}
setInterval(cleanupOldFlowStates, 60 * 60 * 1000);
exports.default = router;
