"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mockWhatsAppService = {
    async sendMessage(phone, message, serviceType = 'general') {
        console.log('📱 MOCK WhatsApp Service - Message would be sent to:', {
            phone: phone,
            message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            serviceType: serviceType,
            timestamp: new Date().toISOString()
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            success: true,
            data: {
                messageId: `mock_${Date.now()}`,
                status: 'sent',
                phone: phone
            },
            phone: phone,
            message: message,
            mock: true
        };
    },
    async sendOTP(phone, otp) {
        const message = `Your CampusPe verification code is: ${otp}. This code is valid for 10 minutes.`;
        return await this.sendMessage(phone, message, 'otp');
    },
    async sendJobNotification(phone, jobTitle, companyName) {
        const message = `🚀 New job opportunity: ${jobTitle} at ${companyName}. Check your CampusPe dashboard for details!`;
        return await this.sendMessage(phone, message, 'jobs');
    },
    async sendResumeNotification(phone, jobTitle, companyName, resumeUrl) {
        const message = `✅ Your AI-powered resume for ${jobTitle} at ${companyName} is ready! Download: ${resumeUrl}`;
        return await this.sendMessage(phone, message, 'resume');
    }
};
exports.default = mockWhatsAppService;
