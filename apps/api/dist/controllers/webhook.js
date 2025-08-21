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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.verifyWebhook = exports.handleWABBWebhook = void 0;
const whatsapp_1 = require("../services/whatsapp");
const User_1 = require("../models/User");
const Student_1 = require("../models/Student");
const College_1 = require("../models/College");
const Recruiter_1 = require("../models/Recruiter");
const Job_1 = require("../models/Job");
const Application_1 = require("../models/Application");
const OTPVerification_1 = require("../models/OTPVerification");
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const WABB_WEBHOOK_TOKEN = process.env.WABB_WEBHOOK_TOKEN;
const handleWABBWebhook = async (req, res) => {
    try {
        const { Phone, Name, OTP, UserType, Purpose, Timestamp, Action } = req.body;
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (WABB_WEBHOOK_TOKEN && token !== WABB_WEBHOOK_TOKEN) {
            return res.status(401).json({ error: 'Unauthorized webhook request' });
        }
        console.log('WABB Webhook received:', req.body);
        const normalizedPhone = normalizePhoneNumber(Phone);
        console.log(`Phone normalized: ${Phone} -> ${normalizedPhone}`);
        switch (Purpose) {
            case 'verification':
                console.log(`OTP ${OTP} sent to ${normalizedPhone} via WABB automation`);
                break;
            case 'otp_response':
                if (Action === 'verify_otp' && OTP) {
                    await handleOTPVerificationResponse(normalizedPhone, OTP);
                }
                break;
            case 'user_message':
                await handleIncomingUserMessage(normalizedPhone, req.body.Message || '', Name);
                break;
            default:
                console.log('Unknown webhook purpose:', Purpose);
        }
        res.status(200).json({ status: 'success', message: 'Webhook processed' });
    }
    catch (error) {
        console.error('WABB Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.handleWABBWebhook = handleWABBWebhook;
function normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber)
        return '';
    const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
    if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
        return digitsOnly.slice(2);
    }
    if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
        return digitsOnly.slice(1);
    }
    if (digitsOnly.length > 10) {
        return digitsOnly.slice(-10);
    }
    return digitsOnly;
}
async function handleOTPVerificationResponse(phoneNumber, otpCode) {
    try {
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        const otpRecord = await OTPVerification_1.OTPVerification.findOne({
            $or: [
                { phoneNumber: normalizedPhone },
                { whatsappNumber: normalizedPhone },
                { phoneNumber: phoneNumber },
                { whatsappNumber: phoneNumber }
            ],
            isVerified: false,
            otpExpiry: { $gt: new Date() }
        }).sort({ createdAt: -1 });
        if (!otpRecord) {
            await (0, whatsapp_1.sendWhatsAppMessage)(normalizedPhone, "❌ No valid OTP found or OTP has expired.\n\nPlease request a new OTP from the registration page.\n\n- CampusPe Team");
            return;
        }
        const verificationResult = await (0, whatsapp_1.verifyWhatsAppOTP)(otpRecord._id.toString(), otpCode);
        if (verificationResult.success) {
            const successMessage = `✅ Phone number verified successfully!\n\nYou can now complete your registration at:\nhttps://campuspe.com/register/student\n\nUse verification ID: ${otpRecord._id}\n\n- CampusPe Team`;
            await (0, whatsapp_1.sendWhatsAppMessage)(normalizedPhone, successMessage);
        }
        else {
            await (0, whatsapp_1.sendWhatsAppMessage)(normalizedPhone, `❌ ${verificationResult.message}\n\n- CampusPe Team`);
        }
    }
    catch (error) {
        console.error('OTP verification response error:', error);
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        await (0, whatsapp_1.sendWhatsAppMessage)(normalizedPhone, "❌ Verification error. Please try again or contact support.\n\n- CampusPe Team");
    }
}
async function handleIncomingUserMessage(phoneNumber, message, userName) {
    try {
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        const messageBody = message.toLowerCase();
        const otpMatch = messageBody.match(/\b\d{6}\b/);
        if (otpMatch) {
            await handleOTPVerificationResponse(normalizedPhone, otpMatch[0]);
            return;
        }
        if (messageBody.includes('resume') || messageBody.includes('cv') ||
            messageBody.includes('job') || messageBody.includes('@') ||
            messageBody.includes('start')) {
            const { WhatsAppResumeFlow } = await Promise.resolve().then(() => __importStar(require('../services/whatsapp-resume-flow')));
            await WhatsAppResumeFlow.handleIncomingMessage(normalizedPhone, message, userName);
            return;
        }
        const user = await User_1.User.findOne({
            $or: [
                { phone: normalizedPhone },
                { whatsappNumber: normalizedPhone },
                { phone: phoneNumber },
                { whatsappNumber: phoneNumber }
            ]
        }).populate('role');
        if (!user) {
            await (0, whatsapp_1.sendWhatsAppMessage)(normalizedPhone, `👋 Welcome to CampusPe!\n\nI'm your AI assistant. I can help you with:\n\n📄 **Resume Building** - Type "resume" to create tailored resumes\n💼 **Job Search** - Type "jobs" to find opportunities\n🎓 **Profile Help** - Type "profile" for account assistance\n\n🚀 **Quick Start:** Type "resume" to create a job-specific resume!\n\n🔗 Visit CampusPe.com to create your account`);
            return;
        }
        await routeMessage(user, messageBody, 'text', phoneNumber);
    }
    catch (error) {
        console.error('Error handling user message:', error);
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, "Sorry, I encountered an error processing your message. Please try again.\n\n- CampusPe Team");
    }
}
const sendProfileInfo = async (phoneNumber, student) => {
    const message = `📊 Your Profile:\n\nName: ${student.firstName || 'N/A'}\nSkills: ${student.skills?.map((s) => s.name).join(', ') || 'None'}\nExperience: ${student.experience?.length || 0} entries`;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, message);
};
const sendStudentMenu = async (phoneNumber, name) => {
    const message = `Hello ${name}! 👋\n\nWhat would you like to do?\n1. View Profile\n2. Search Jobs\n3. View Applications\n4. Help`;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, message);
};
const sendCandidatesSummary = async (phoneNumber, recruiter) => {
    const message = `📈 Candidates Summary:\n\nActive applications: 0\nPending reviews: 0\nShortlisted: 0`;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, message);
};
const sendJobPostingInstructions = async (phoneNumber) => {
    const message = `📝 To post a job:\n1. Visit our portal\n2. Fill job details\n3. Set requirements\n4. Publish`;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, message);
};
const sendRecruiterDashboard = async (phoneNumber, recruiter) => {
    const message = `🏢 Recruiter Dashboard:\n\nCompany: ${recruiter.companyName || 'N/A'}\nActive Jobs: 0\nApplications: 0`;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, message);
};
const sendStudentsSummary = async (phoneNumber, college) => {
    const message = `🎓 Students Summary:\n\nTotal students: 0\nPlaced: 0\nActive applications: 0`;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, message);
};
const sendPlacementStats = async (phoneNumber, college) => {
    const message = `📊 Placement Statistics:\n\nPlacement rate: 0%\nAverage package: ₹0\nTop recruiter: N/A`;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, message);
};
const sendVerificationInstructions = async (phoneNumber) => {
    const message = `✅ Verification Instructions:\n1. Submit documents\n2. Wait for review\n3. Get verified status`;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, message);
};
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('WhatsApp webhook verified');
        res.status(200).send(challenge);
    }
    else {
        console.log('WhatsApp webhook verification failed');
        res.status(403).send('Forbidden');
    }
};
exports.verifyWebhook = verifyWebhook;
const handleWebhook = async (req, res) => {
    try {
        const body = req.body;
        if (body.object === 'whatsapp_business_account') {
            body.entry?.forEach(async (entry) => {
                const changes = entry.changes;
                changes?.forEach(async (change) => {
                    if (change.field === 'messages') {
                        const value = change.value;
                        if (value.messages) {
                            for (const message of value.messages) {
                                await processIncomingMessage(message, value.contacts?.[0]);
                            }
                        }
                    }
                });
            });
        }
        res.status(200).send('EVENT_RECEIVED');
    }
    catch (error) {
        console.error('Webhook handling error:', error);
        res.status(500).send('Internal Server Error');
    }
};
exports.handleWebhook = handleWebhook;
async function processIncomingMessage(message, contact) {
    try {
        const phoneNumber = message.from;
        const messageBody = message.text?.body?.toLowerCase() || '';
        const messageType = message.type;
        const user = await User_1.User.findOne({
            $or: [
                { phone: phoneNumber },
                { whatsappNumber: phoneNumber }
            ]
        }).populate('role');
        if (!user) {
            await sendWelcomeMessage(phoneNumber, contact?.profile?.name || 'User');
            return;
        }
        await routeMessage(user, messageBody, messageType, phoneNumber);
    }
    catch (error) {
        console.error('Error processing message:', error);
    }
}
async function sendWelcomeMessage(phoneNumber, userName) {
    const welcomeMessage = `
🎓 Welcome to CampusPe Platform, ${userName}!

I'm your career assistant. Here's how I can help you:

📋 *For Students:*
• Type "jobs" - View latest job opportunities
• Type "applications" - Check your application status
• Type "profile" - Update your profile

🏢 *For Recruiters:*
• Type "post job" - Post new job opportunities
• Type "candidates" - View potential candidates
• Type "dashboard" - Access your dashboard

🎓 *For Colleges:*
• Type "students" - Manage student profiles
• Type "placements" - View placement statistics
• Type "verify" - Verify student credentials

💡 *Quick Actions:*
• Type "help" - Get help
• Type "contact" - Contact support

To get started, please register at: https://campuspe.com

How can I assist you today?
    `;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, welcomeMessage.trim());
}
async function routeMessage(user, messageBody, messageType, phoneNumber) {
    const userRole = user.role;
    if (messageBody.includes('help')) {
        await sendHelpMessage(phoneNumber, userRole);
        return;
    }
    if (messageBody.includes('contact') || messageBody.includes('support')) {
        await sendContactInfo(phoneNumber);
        return;
    }
    switch (userRole) {
        case 'student':
            await handleStudentMessage(user, messageBody, phoneNumber);
            break;
        case 'recruiter':
            await handleRecruiterMessage(user, messageBody, phoneNumber);
            break;
        case 'college':
            await handleCollegeMessage(user, messageBody, phoneNumber);
            break;
        default:
            await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, "I'm sorry, I couldn't understand your message. Type 'help' for assistance.");
    }
}
async function handleStudentMessage(user, messageBody, phoneNumber) {
    try {
        const student = await Student_1.Student.findOne({ userId: user._id }).populate('collegeId');
        if (messageBody.includes('jobs') || messageBody.includes('opportunities')) {
            await sendLatestJobs(phoneNumber, student);
        }
        else if (messageBody.includes('applications') || messageBody.includes('status')) {
            await sendApplicationStatus(phoneNumber, student);
        }
        else if (messageBody.includes('profile')) {
            await sendProfileInfo(phoneNumber, student);
        }
        else {
            await sendStudentMenu(phoneNumber, student?.firstName || 'Student');
        }
    }
    catch (error) {
        console.error('Error handling student message:', error);
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, "Sorry, I encountered an error. Please try again later.");
    }
}
async function handleRecruiterMessage(user, messageBody, phoneNumber) {
    try {
        const recruiter = await Recruiter_1.Recruiter.findOne({ userId: user._id });
        if (messageBody.includes('candidates') || messageBody.includes('students')) {
            await sendCandidatesSummary(phoneNumber, recruiter);
        }
        else if (messageBody.includes('post') && messageBody.includes('job')) {
            await sendJobPostingInstructions(phoneNumber);
        }
        else if (messageBody.includes('dashboard') || messageBody.includes('analytics')) {
            await sendRecruiterDashboard(phoneNumber, recruiter);
        }
        else {
            await sendRecruiterMenu(phoneNumber, recruiter?.recruiterProfile?.firstName || 'Recruiter');
        }
    }
    catch (error) {
        console.error('Error handling recruiter message:', error);
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, "Sorry, I encountered an error. Please try again later.");
    }
}
async function handleCollegeMessage(user, messageBody, phoneNumber) {
    try {
        const college = await College_1.College.findOne({ userId: user._id });
        if (messageBody.includes('students') || messageBody.includes('manage')) {
            await sendStudentsSummary(phoneNumber, college);
        }
        else if (messageBody.includes('placements') || messageBody.includes('statistics')) {
            await sendPlacementStats(phoneNumber, college);
        }
        else if (messageBody.includes('verify')) {
            await sendVerificationInstructions(phoneNumber);
        }
        else {
            await sendCollegeMenu(phoneNumber, college?.name || 'College');
        }
    }
    catch (error) {
        console.error('Error handling college message:', error);
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, "Sorry, I encountered an error. Please try again later.");
    }
}
async function sendHelpMessage(phoneNumber, userRole) {
    let helpMessage = '';
    switch (userRole) {
        case 'student':
            helpMessage = `
🎓 *Student Help Menu*

📋 Available Commands:
• "jobs" - View latest job opportunities
• "applications" - Check application status
• "profile" - View/update profile
• "help" - Show this menu
• "contact" - Contact support

🔍 Quick Tips:
• Keep your profile updated
• Apply to relevant jobs quickly
• Check application status regularly

Need more help? Visit: https://campuspe.com/help
            `;
            break;
        case 'recruiter':
            helpMessage = `
🏢 *Recruiter Help Menu*

📋 Available Commands:
• "candidates" - View potential candidates
• "post job" - Instructions to post jobs
• "dashboard" - View your dashboard
• "help" - Show this menu
• "contact" - Contact support

🔍 Quick Tips:
• Post detailed job descriptions
• Review candidate profiles thoroughly
• Provide timely feedback to applicants

Need more help? Visit: https://campuspe.com/help
            `;
            break;
        case 'college':
            helpMessage = `
🎓 *College Help Menu*

📋 Available Commands:
• "students" - Manage student profiles
• "placements" - View placement statistics
• "verify" - Student verification process
• "help" - Show this menu
• "contact" - Contact support

🔍 Quick Tips:
• Keep student data updated
• Monitor placement activities
• Assist students with profile verification

Need more help? Visit: https://campuspe.com/help
            `;
            break;
        default:
            helpMessage = `
💡 *General Help*

Please register at https://campuspe.com to access role-specific features.

For immediate assistance, contact our support team.
            `;
    }
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, helpMessage.trim());
}
async function sendContactInfo(phoneNumber) {
    const contactMessage = `
📞 *Contact Support*

🕐 Available 24/7

📧 Email: support@campuspe.com
📱 WhatsApp: You're already here!
🌐 Website: https://campuspe.com
💬 Live Chat: Available on our website

What can we help you with today?
    `;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, contactMessage.trim());
}
async function sendLatestJobs(phoneNumber, student) {
    try {
        const jobs = await Job_1.Job.find({ status: 'active' })
            .limit(5)
            .sort({ createdAt: -1 })
            .select('title companyName salary locations requirements applicationDeadline');
        if (jobs.length === 0) {
            await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, "No active job opportunities at the moment. We'll notify you when new jobs are posted!");
            return;
        }
        let jobsMessage = "🚀 *Latest Job Opportunities*\n\n";
        jobs.forEach((job, index) => {
            jobsMessage += `${index + 1}. *${job.title}*\n`;
            jobsMessage += `🏢 ${job.companyName}\n`;
            if (job.salary?.min) {
                jobsMessage += `💰 ₹${job.salary.min}${job.salary.max ? ` - ₹${job.salary.max}` : '+'}\n`;
            }
            jobsMessage += `📍 ${job.locations?.[0]?.city || 'Multiple locations'}\n`;
            jobsMessage += `⏰ Apply by: ${new Date(job.applicationDeadline).toLocaleDateString()}\n\n`;
        });
        jobsMessage += "🔗 View and apply: https://campuspe.com/jobs\n";
        jobsMessage += "💡 Type 'applications' to check your application status";
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, jobsMessage);
    }
    catch (error) {
        console.error('Error sending jobs:', error);
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, "Sorry, I couldn't fetch job listings right now. Please try again later.");
    }
}
async function sendApplicationStatus(phoneNumber, student) {
    try {
        const applications = await Application_1.Application.find({ studentId: student._id })
            .populate('jobId', 'title companyName')
            .sort({ createdAt: -1 })
            .limit(5);
        if (applications.length === 0) {
            await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, "You haven't applied to any jobs yet. Type 'jobs' to see available opportunities!");
            return;
        }
        let statusMessage = "📋 *Your Application Status*\n\n";
        applications.forEach((app, index) => {
            const job = app.jobId;
            statusMessage += `${index + 1}. *${job.title}* at ${job.companyName}\n`;
            statusMessage += `📊 Status: ${app.currentStatus.toUpperCase()}\n`;
            statusMessage += `📅 Applied: ${new Date(app.appliedAt).toLocaleDateString()}\n\n`;
        });
        statusMessage += "🔗 View details: https://campuspe.com/dashboard";
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, statusMessage);
    }
    catch (error) {
        console.error('Error sending application status:', error);
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, "Sorry, I couldn't fetch your application status right now. Please try again later.");
    }
}
async function sendRecruiterMenu(phoneNumber, firstName) {
    const menuMessage = `
🏢 Hello ${firstName}! How can I assist you today?

📋 *Quick Actions:*
• Type "candidates" - View potential candidates
• Type "post job" - Get job posting instructions
• Type "dashboard" - View your analytics

💡 *Need Help?*
• Type "help" - Get detailed help
• Type "contact" - Contact support

🔗 Access your dashboard: https://campuspe.com/dashboard/recruiter
    `;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, menuMessage.trim());
}
async function sendCollegeMenu(phoneNumber, collegeName) {
    const menuMessage = `
🎓 Hello ${collegeName}! How can I help you today?

📋 *Quick Actions:*
• Type "students" - Manage student profiles
• Type "placements" - View placement statistics
• Type "verify" - Student verification help

💡 *Need Help?*
• Type "help" - Get detailed help
• Type "contact" - Contact support

🔗 Access your dashboard: https://campuspe.com/dashboard/college
    `;
    await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, menuMessage.trim());
}
