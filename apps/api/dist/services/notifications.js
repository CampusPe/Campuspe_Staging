"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendApplicationStatusNotification = exports.sendWelcomeNotification = exports.sendJobNotification = void 0;
const sendJobNotification = async (userId, jobId, message) => {
    try {
        console.log(`Sending job notification to user ${userId} for job ${jobId}: ${message}`);
    }
    catch (error) {
        console.error('Error sending job notification:', error);
        throw error;
    }
};
exports.sendJobNotification = sendJobNotification;
const sendWelcomeNotification = async (userId, userType) => {
    try {
        console.log(`Sending welcome notification to ${userType} user ${userId}`);
    }
    catch (error) {
        console.error('Error sending welcome notification:', error);
        throw error;
    }
};
exports.sendWelcomeNotification = sendWelcomeNotification;
const sendApplicationStatusNotification = async (userId, applicationId, status) => {
    try {
        console.log(`Sending application status notification to user ${userId}: ${status}`);
    }
    catch (error) {
        console.error('Error sending application status notification:', error);
        throw error;
    }
};
exports.sendApplicationStatusNotification = sendApplicationStatusNotification;
