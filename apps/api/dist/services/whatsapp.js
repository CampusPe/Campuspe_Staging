"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugWABBWebhook = exports.sendWelcomeMessageAfterRegistration = exports.sendJobMatchNotification = exports.verifyWhatsAppOTP = exports.sendWhatsAppOTP = exports.sendWhatsAppMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const OTPVerification_1 = require("../models/OTPVerification");
const WABB_API_URL = process.env.WABB_API_URL || 'https://api.wabb.in';
const WABB_API_KEY = process.env.WABB_API_KEY;
const WABB_WEBHOOK_URLS = {
    otp: process.env.WABB_WEBHOOK_URL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/',
    jobs: process.env.WABB_WEBHOOK_URL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/Fy4MvhulWrYT/',
    resume: process.env.WABB_WEBHOOK_URL_RESUME || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/',
    general: process.env.WABB_WEBHOOK_URL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/',
    primary: process.env.WABB_WEBHOOK_URL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/',
    test: process.env.WABB_TEST_WEBHOOK_URL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/',
    fallback: 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/',
    direct: 'https://api.wabb.in/220/HJGMsTitkl8a/webhook'
};
console.log('WABB Webhook URLs configured:', {
    otp: WABB_WEBHOOK_URLS.otp,
    jobs: WABB_WEBHOOK_URLS.jobs,
    resume: WABB_WEBHOOK_URLS.resume,
    general: WABB_WEBHOOK_URLS.general,
    env_webhook: process.env.WABB_WEBHOOK_URL,
    env_test_webhook: process.env.WABB_TEST_WEBHOOK_URL
});
const getWebhookUrl = (serviceType = 'general') => {
    return WABB_WEBHOOK_URLS[serviceType] || WABB_WEBHOOK_URLS.general || WABB_WEBHOOK_URLS.otp;
};
const sendWhatsAppMessage = async (to, message, serviceType = 'general') => {
    try {
        console.log('🚀 WhatsApp Service Called:', {
            to: to,
            messageLength: message.length,
            serviceType: serviceType,
            timestamp: new Date().toISOString()
        });
        const webhookUrl = getWebhookUrl(serviceType);
        console.log('📱 WhatsApp Service Debug:', {
            serviceType,
            requestedUrl: WABB_WEBHOOK_URLS[serviceType],
            fallbackUrl: WABB_WEBHOOK_URLS.general || WABB_WEBHOOK_URLS.fallback,
            finalUrl: webhookUrl,
            envVars: {
                WABB_WEBHOOK_URL: !!process.env.WABB_WEBHOOK_URL,
                WABB_WEBHOOK_URL_RESUME: !!process.env.WABB_WEBHOOK_URL_RESUME,
                WABB_WEBHOOK_URL_GENERAL: !!process.env.WABB_WEBHOOK_URL_GENERAL,
                WABB_API_KEY: !!process.env.WABB_API_KEY
            }
        });
        if (!webhookUrl) {
            console.log('❌ No webhook URL configured for WhatsApp service');
            console.log(`📱 WhatsApp message to ${to}: ${message}`);
            return { success: false, message: 'WhatsApp webhook not configured' };
        }
        const formattedPhone = to.replace(/[^\d]/g, '');
        const queryParams = new URLSearchParams({
            Phone: formattedPhone,
            Message: message
        });
        const urlFormats = [
            webhookUrl,
            WABB_WEBHOOK_URLS.direct,
            WABB_WEBHOOK_URLS.fallback
        ];
        let lastError = null;
        for (const url of urlFormats) {
            try {
                console.log('Attempting WhatsApp message via WABB webhook:', {
                    url: url,
                    phone: formattedPhone,
                    serviceType: serviceType,
                    method: 'POST'
                });
                const response = await axios_1.default.post(url, {
                    phone: formattedPhone,
                    message: message
                }, {
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'CampusPe-WhatsApp-Service/1.0',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                console.log('WhatsApp webhook response:', {
                    status: response.status,
                    data: response.data,
                    url: url,
                    method: 'POST'
                });
                return {
                    success: true,
                    data: response.data,
                    phone: formattedPhone,
                    message: message,
                    url: url,
                    method: 'POST'
                };
            }
            catch (error) {
                console.log(`WhatsApp webhook POST failed for URL ${url}:`, {
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                try {
                    const webhookUrlWithParams = `${url}?phone=${formattedPhone}&message=${encodeURIComponent(message)}`;
                    console.log('Attempting GET fallback for WhatsApp webhook:', {
                        url: url,
                        fullUrl: webhookUrlWithParams,
                        method: 'GET'
                    });
                    const response = await axios_1.default.get(webhookUrlWithParams, {
                        timeout: 30000,
                        headers: {
                            'User-Agent': 'CampusPe-WhatsApp-Service/1.0',
                            'Accept': 'application/json'
                        }
                    });
                    console.log('WhatsApp webhook GET response:', {
                        status: response.status,
                        data: response.data,
                        url: url,
                        method: 'GET'
                    });
                    return {
                        success: true,
                        data: response.data,
                        phone: formattedPhone,
                        message: message,
                        url: url,
                        method: 'GET'
                    };
                }
                catch (getError) {
                    lastError = getError;
                    console.log(`WhatsApp webhook GET also failed for URL ${url}:`, {
                        error: getError.message,
                        status: getError.response?.status,
                        data: getError.response?.data
                    });
                    continue;
                }
            }
        }
        throw lastError;
    }
    catch (error) {
        console.error('WhatsApp webhook send error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
        };
    }
};
exports.sendWhatsAppMessage = sendWhatsAppMessage;
const sendWhatsAppOTP = async (phoneNumber, userType = 'student', name) => {
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        const otpVerification = new OTPVerification_1.OTPVerification({
            phoneNumber: phoneNumber,
            whatsappNumber: phoneNumber,
            userType: userType,
            otp: otp,
            otpExpiry: otpExpiry,
            isVerified: false,
            attempts: 0,
            maxAttempts: 3
        });
        const savedOTP = await otpVerification.save();
        const otpWebhookUrl = getWebhookUrl('otp');
        if (otpWebhookUrl) {
            try {
                const formattedPhone = phoneNumber.replace(/[^\d]/g, '');
                const queryParams = new URLSearchParams({
                    Phone: formattedPhone,
                    Name: name ? name : `User_${phoneNumber.slice(-4)}`,
                    OTP: otp
                });
                const webhookUrlWithParams = `${otpWebhookUrl}?${queryParams.toString()}`;
                console.log('Sending OTP via WABB.in webhook:', {
                    url: webhookUrlWithParams.replace(otp, '******'),
                    phone: formattedPhone,
                    name: name ? name : `User_${phoneNumber.slice(-4)}`
                });
                const response = await axios_1.default.get(webhookUrlWithParams, {
                    headers: {
                        'User-Agent': 'CampusPe-WhatsApp-Integration'
                    },
                    timeout: 30000
                });
                console.log('WABB.in webhook response:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data
                });
                if (response.status === 200 || response.status === 201) {
                    return {
                        success: true,
                        message: 'OTP sent successfully via WhatsApp',
                        otpId: savedOTP._id.toString(),
                        expiresIn: '10 minutes'
                    };
                }
                else {
                    throw new Error(`WABB webhook returned status: ${response.status}`);
                }
            }
            catch (webhookError) {
                console.error('WABB webhook error:', webhookError);
                if (axios_1.default.isAxiosError(webhookError)) {
                    console.error('Webhook error details:', {
                        status: webhookError.response?.status,
                        statusText: webhookError.response?.statusText,
                        data: webhookError.response?.data,
                        message: webhookError.message
                    });
                }
                const errorMessage = webhookError instanceof Error ? webhookError.message : 'Unknown error';
                return {
                    success: false,
                    message: `Failed to send OTP via WABB webhook: ${errorMessage}`
                };
            }
        }
        else {
            return {
                success: false,
                message: 'WABB webhook URL not configured'
            };
        }
    }
    catch (error) {
        console.error('WhatsApp OTP send error:', error);
        return {
            success: false,
            message: 'Failed to send OTP via WhatsApp'
        };
    }
};
exports.sendWhatsAppOTP = sendWhatsAppOTP;
const verifyWhatsAppOTP = async (otpId, providedOTP) => {
    try {
        const otpRecord = await OTPVerification_1.OTPVerification.findById(otpId);
        if (!otpRecord) {
            return {
                success: false,
                message: 'Invalid OTP ID'
            };
        }
        if (otpRecord.isVerified) {
            return {
                success: false,
                message: 'OTP has already been verified'
            };
        }
        if (otpRecord.otpExpiry < new Date()) {
            return {
                success: false,
                message: 'OTP has expired'
            };
        }
        if (otpRecord.attempts >= otpRecord.maxAttempts) {
            return {
                success: false,
                message: 'Maximum verification attempts exceeded'
            };
        }
        otpRecord.attempts += 1;
        await otpRecord.save();
        if (otpRecord.otp !== providedOTP) {
            return {
                success: false,
                message: `Invalid OTP. ${otpRecord.maxAttempts - otpRecord.attempts} attempts remaining`
            };
        }
        otpRecord.isVerified = true;
        otpRecord.verifiedAt = new Date();
        await otpRecord.save();
        const successMessage = `✅ Verification successful!\n\nYour phone number has been verified for CampusPe.\n\nWelcome to the platform!\n\n- CampusPe Team`;
        await (0, exports.sendWhatsAppMessage)(otpRecord.phoneNumber, successMessage);
        return {
            success: true,
            message: 'OTP verified successfully',
            phoneNumber: otpRecord.phoneNumber,
            userType: otpRecord.userType
        };
    }
    catch (error) {
        console.error('WhatsApp OTP verification error:', error);
        return {
            success: false,
            message: 'Failed to verify OTP'
        };
    }
};
exports.verifyWhatsAppOTP = verifyWhatsAppOTP;
const sendJobMatchNotification = async (phoneNumber, jobData) => {
    try {
        console.log(`📱 Sending job match notification to ${phoneNumber}`);
        const WEBHOOK_URL = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/Fy4MvhulWrYT/';
        const queryParams = new URLSearchParams({
            Number: phoneNumber
        });
        const webhookUrlWithParams = `${WEBHOOK_URL}?${queryParams.toString()}`;
        const response = await axios_1.default.post(webhookUrlWithParams, jobData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        console.log(`✅ Job match notification sent successfully to ${phoneNumber}`);
        console.log('Webhook response:', response.status, response.data);
        return {
            success: true,
            message: 'Job match notification sent successfully',
            data: response.data
        };
    }
    catch (error) {
        console.error('❌ Failed to send job match notification:', error);
        if (axios_1.default.isAxiosError(error)) {
            console.error('Webhook error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
        }
        return {
            success: false,
            message: `Failed to send job match notification: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};
exports.sendJobMatchNotification = sendJobMatchNotification;
const sendWelcomeMessageAfterRegistration = async (phoneNumber, name, userType) => {
    try {
        let welcomeMessage = '';
        switch (userType) {
            case 'student':
                welcomeMessage = `🎓 Welcome to CampusPe, ${name}!\n\nYour student account has been successfully created. You can now:\n\n📋 Browse job opportunities\n💼 Apply for positions\n📊 Track your applications\n🔍 Build your profile\n\nStart exploring: https://campuspe.com/dashboard/student\n\nType "help" anytime for assistance.\n\n- CampusPe Team`;
                break;
            case 'recruiter':
                welcomeMessage = `🏢 Welcome to CampusPe, ${name}!\n\nYour recruiter account has been successfully created. You can now:\n\n📝 Post job opportunities\n👥 Browse student profiles\n📊 Manage applications\n🎯 Find perfect candidates\n\nStart recruiting: https://campuspe.com/dashboard/recruiter\n\nType "help" anytime for assistance.\n\n- CampusPe Team`;
                break;
            case 'college':
                welcomeMessage = `🎓 Welcome to CampusPe, ${name}!\n\nYour college account has been successfully created. You can now:\n\n👥 Manage student profiles\n📊 View placement statistics\n✅ Verify student credentials\n📈 Track placement progress\n\nAccess dashboard: https://campuspe.com/dashboard/college\n\nType "help" anytime for assistance.\n\n- CampusPe Team`;
                break;
            default:
                welcomeMessage = `🎉 Welcome to CampusPe, ${name}!\n\nYour account has been successfully created.\n\nExplore the platform: https://campuspe.com\n\n- CampusPe Team`;
        }
        await (0, exports.sendWhatsAppMessage)(phoneNumber, welcomeMessage);
        return { success: true };
    }
    catch (error) {
        console.error('Welcome message error:', error);
        return { success: false };
    }
};
exports.sendWelcomeMessageAfterRegistration = sendWelcomeMessageAfterRegistration;
const debugWABBWebhook = async (phoneNumber) => {
    console.log('🧪 DEBUG: Testing WABB.in webhook integration...');
    const otpWebhookUrl = getWebhookUrl('otp');
    if (!otpWebhookUrl) {
        console.error('❌ WABB_WEBHOOK_URL_OTP not configured');
        return { success: false, message: 'OTP Webhook URL not configured' };
    }
    const formattedPhone = phoneNumber.replace(/[^\d]/g, '');
    const testOtp = '123456';
    const queryParams = new URLSearchParams({
        Phone: formattedPhone,
        Name: 'Debug_Test',
        OTP: testOtp
    });
    const webhookUrlWithParams = `${otpWebhookUrl}?${queryParams.toString()}`;
    console.log('📤 Sending test webhook request:');
    console.log('URL:', webhookUrlWithParams.replace(testOtp, '******'));
    console.log('Method: GET');
    console.log('Query Parameters:', {
        Phone: formattedPhone,
        Name: 'Debug_Test',
        OTP: '******'
    });
    try {
        const response = await axios_1.default.get(webhookUrlWithParams, {
            headers: {
                'User-Agent': 'CampusPe-Debug-Test'
            },
            timeout: 30000,
            validateStatus: () => true
        });
        console.log('📥 Webhook response received:');
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('Headers:', response.headers);
        console.log('Data:', response.data);
        return {
            success: response.status === 200 || response.status === 201,
            status: response.status,
            data: response.data,
            message: `Webhook test completed with status ${response.status}`
        };
    }
    catch (error) {
        console.error('❌ Webhook test error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
exports.debugWABBWebhook = debugWABBWebhook;
