"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppResumeFlow = void 0;
const whatsapp_1 = require("./whatsapp");
const resume_builder_1 = __importDefault(require("./resume-builder"));
const Student_1 = require("../models/Student");
const User_1 = require("../models/User");
const conversationStates = new Map();
class WhatsAppResumeFlow {
    static async handleIncomingMessage(phoneNumber, message, name) {
        const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
        const messageText = message.toLowerCase().trim();
        let state = conversationStates.get(cleanPhone);
        if (messageText.includes('resume') || messageText.includes('cv') || messageText.includes('start')) {
            await this.startResumeFlow(cleanPhone, name);
            return;
        }
        if (messageText.includes('help')) {
            await this.sendHelpMessage(cleanPhone, name);
            return;
        }
        if (messageText.includes('cancel') || messageText.includes('stop')) {
            conversationStates.delete(cleanPhone);
            await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `❌ *Process Cancelled*\n\nNo worries! You can start again anytime by typing "resume" 😊\n\n💡 Need help? Type "help"`);
            return;
        }
        if (!state) {
            await this.sendWelcomeMessage(cleanPhone, name);
            return;
        }
        await this.processStep(cleanPhone, messageText, message, state);
    }
    static async startResumeFlow(phoneNumber, name) {
        const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
        const state = {
            phoneNumber: cleanPhone,
            step: 'collecting_email',
            name,
            attemptCount: 0,
            lastMessageAt: new Date()
        };
        conversationStates.set(cleanPhone, state);
        await (0, whatsapp_1.sendWhatsAppMessage)(cleanPhone, `🎯 *AI Resume Builder Started*\n\nHi ${name || 'there'}! I'll help you create a tailored resume for your target job.\n\n📧 **Step 1 of 2:** Please share your email address\n\n*Example:* john.doe@email.com\n\n💡 This email should match your CampusPe profile\n\n❌ Type "cancel" to stop anytime`);
    }
    static async processStep(phoneNumber, messageText, originalMessage, state) {
        state.lastMessageAt = new Date();
        state.attemptCount++;
        switch (state.step) {
            case 'collecting_email':
                await this.handleEmailCollection(phoneNumber, messageText, originalMessage, state);
                break;
            case 'collecting_job_description':
                await this.handleJobDescriptionCollection(phoneNumber, originalMessage, state);
                break;
            default:
                await this.sendWelcomeMessage(phoneNumber, state.name);
                break;
        }
    }
    static async handleEmailCollection(phoneNumber, messageText, originalMessage, state) {
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
        const emailMatch = originalMessage.match(emailRegex);
        if (!emailMatch) {
            if (state.attemptCount <= 3) {
                await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `❌ *Invalid Email Format*\n\nPlease provide a valid email address.\n\n📧 *Example:* john.doe@gmail.com\n\n🔢 Attempt ${state.attemptCount}/3\n\n❌ Type "cancel" to stop`);
                return;
            }
            else {
                conversationStates.delete(phoneNumber);
                await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `❌ *Too Many Invalid Attempts*\n\nLet's start fresh! Type "resume" when you're ready to try again.\n\n💡 Need help? Type "help"`);
                return;
            }
        }
        const email = emailMatch[0].toLowerCase();
        state.email = email;
        state.step = 'collecting_job_description';
        state.attemptCount = 0;
        const userExists = await this.verifyUserExists(email);
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `✅ *Email Confirmed:* ${email}\n\n${userExists ? '🎉 Profile found on CampusPe!' : '⚠️ Profile not found - I\'ll create a basic resume'}\n\n📋 **Step 2 of 2:** Please share the complete job description\n\nPaste the entire job posting including:\n• Job title\n• Company name\n• Requirements\n• Responsibilities\n• Qualifications\n\n💡 *Tip:* The more details you provide, the better I can tailor your resume!\n\n❌ Type "cancel" to stop`);
    }
    static async handleJobDescriptionCollection(phoneNumber, jobDescription, state) {
        if (jobDescription.length < 50) {
            if (state.attemptCount <= 3) {
                await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `❌ *Job Description Too Short*\n\nPlease provide a more detailed job description (at least 50 characters).\n\nInclude:\n• Job title & company\n• Key requirements\n• Responsibilities\n• Required skills\n\n🔢 Attempt ${state.attemptCount}/3\n\n❌ Type "cancel" to stop`);
                return;
            }
            else {
                conversationStates.delete(phoneNumber);
                await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `❌ *Too Many Short Descriptions*\n\nLet's start fresh! Type "resume" when you have a complete job description ready.\n\n💡 Need help? Type "help"`);
                return;
            }
        }
        state.jobDescription = jobDescription;
        state.step = 'processing';
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `🚀 *Resume Generation Started*\n\n✅ Email: ${state.email}\n✅ Job Description: Received (${jobDescription.length} characters)\n\n🤖 *AI is now working on:*\n• Analyzing job requirements\n• Fetching your profile data\n• Matching skills to job needs\n• Creating tailored content\n• Generating professional PDF\n\n⏳ *This takes 30-60 seconds...*\n\nI'll notify you when it's ready! 📄✨`);
        await this.generateAndSendResume(phoneNumber, state);
    }
    static async generateAndSendResume(phoneNumber, state) {
        try {
            const result = await resume_builder_1.default.createTailoredResume(state.email, phoneNumber, state.jobDescription);
            if (result.success) {
                state.step = 'completed';
                await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `🎉 *Resume Generated Successfully!*\n\n📄 *Your tailored resume is ready!*\n\n📊 **Resume Details:**\n• File: ${result.fileName}\n• Size: ${Math.round(result.pdfBuffer.length / 1024)}KB\n• Generated: ${new Date().toLocaleString()}\n• Optimized for the job requirements\n\n🎯 **What I customized:**\n• Skills matching job requirements\n• Experience relevance\n• Professional summary\n• Keywords for ATS systems\n\n📥 **Download Link:**\n${result.downloadUrl || 'Check your CampusPe account'}\n\n🚀 **Next Steps:**\n• Review and fine-tune if needed\n• Submit your application\n• Track on CampusPe.com\n\n💼 Good luck with your application!\n\n🔄 Need another resume? Type "resume"`);
                setTimeout(() => {
                    conversationStates.delete(phoneNumber);
                }, 300000);
            }
            else {
                await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `❌ *Resume Generation Failed*\n\n**Error:** ${result.message}\n\n🔧 **Common solutions:**\n• Ensure you have a complete CampusPe profile\n• Verify your email is correct\n• Add skills and experience to your profile\n• Try again in a few minutes\n\n🌐 **Create/Update Profile:**\nhttps://campuspe.com/profile\n\n🔄 **Try Again:** Type "resume"\n💡 **Need Help:** Type "help"`);
                conversationStates.delete(phoneNumber);
            }
        }
        catch (error) {
            console.error('Resume generation error:', error);
            await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `❌ *Technical Error*\n\nSorry! I encountered a technical issue while generating your resume.\n\n🔧 **What happened:**\n• Server processing error\n• Our team has been notified\n• This will be fixed shortly\n\n🔄 **Try again in 5 minutes**\n💻 **Alternative:** Visit CampusPe.com\n💡 **Support:** Contact our team\n\n🙏 Apologies for the inconvenience!`);
            conversationStates.delete(phoneNumber);
        }
    }
    static async sendWelcomeMessage(phoneNumber, name) {
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `👋 *Welcome to CampusPe AI Resume Builder!*\n\nHi ${name || 'there'}! I'm your personal resume assistant. 🤖\n\n✨ **What I can do:**\n• Create tailored resumes for specific jobs\n• Analyze job requirements with AI\n• Match your skills to job needs\n• Generate professional PDF resumes\n• Optimize for ATS systems\n\n📋 **How it works:**\n1️⃣ You share your email + job description\n2️⃣ I analyze & fetch your CampusPe profile\n3️⃣ AI creates a tailored resume\n4️⃣ You get a professional PDF instantly\n\n🚀 **Ready to start?** Type "resume"\n💡 **Need help?** Type "help"\n\n🔗 Make sure you have a profile on CampusPe.com`);
    }
    static async sendHelpMessage(phoneNumber, name) {
        await (0, whatsapp_1.sendWhatsAppMessage)(phoneNumber, `📖 *CampusPe Resume Builder Help*\n\n🤖 **Commands:**\n• "resume" or "start" - Begin resume creation\n• "help" - Show this help message\n• "cancel" or "stop" - Cancel current process\n\n📝 **How to use:**\n1️⃣ Type "resume" to start\n2️⃣ Provide your email address\n3️⃣ Share the complete job description\n4️⃣ Wait 30-60 seconds for AI magic\n5️⃣ Receive your tailored resume!\n\n✅ **Requirements:**\n• Valid email address\n• Complete job description (50+ chars)\n• CampusPe profile (recommended)\n\n🌐 **Create Profile:** CampusPe.com\n📞 **Support:** support@campuspe.com\n\n🚀 Ready? Type "resume" to begin!`);
    }
    static async verifyUserExists(email) {
        try {
            const user = await User_1.User.findOne({ email }).lean();
            if (user) {
                const student = await Student_1.Student.findOne({ userId: user._id }).lean();
                return !!student;
            }
            return false;
        }
        catch (error) {
            console.error('Error verifying user:', error);
            return false;
        }
    }
    static cleanupOldConversations() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        for (const [phoneNumber, state] of conversationStates.entries()) {
            if (state.lastMessageAt < oneHourAgo) {
                conversationStates.delete(phoneNumber);
            }
        }
    }
    static getStats() {
        const activeConversations = conversationStates.size;
        return { activeConversations, completedToday: 0 };
    }
}
exports.WhatsAppResumeFlow = WhatsAppResumeFlow;
setInterval(() => {
    WhatsAppResumeFlow.cleanupOldConversations();
}, 60 * 60 * 1000);
exports.default = WhatsAppResumeFlow;
