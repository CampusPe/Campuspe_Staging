"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSMSOTPStatus = exports.verifySMSOTP = exports.sendSMSOTP = void 0;
const axios_1 = __importDefault(require("axios"));
const OTPVerification_1 = require("../models/OTPVerification");
const TWOFACTOR_BASE_URL = 'https://2factor.in/API/V1';
const getSMSConfig = () => {
    const apiKey = process.env.TWOFACTOR_API_KEY;
    console.log('DEBUG - All env vars:', Object.keys(process.env).filter(key => key.includes('TWOFACTOR')));
    console.log('DEBUG - TWOFACTOR_API_KEY value:', apiKey);
    console.log('DEBUG - NODE_ENV:', process.env.NODE_ENV);
    if (!apiKey) {
        throw new Error('2Factor API key is required for SMS OTP');
    }
    return { apiKey };
};
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
const sendSMSOTP = async (phoneNumber) => {
    try {
        const { apiKey } = getSMSConfig();
        const cleanedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
        const recentOTP = await OTPVerification_1.OTPVerification.findOne({
            phoneNumber: cleanedPhoneNumber,
            userType: 'student',
            createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
        });
        if (recentOTP) {
            return {
                success: false,
                message: 'Please wait at least 1 minute before requesting a new OTP.'
            };
        }
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        console.log(`📱 SMS OTP for ${cleanedPhoneNumber}: ${otp} (expires in 15 minutes)`);
        console.log(`🆔 OTP ID will be saved to database`);
        const smsUrl = `${TWOFACTOR_BASE_URL}/${apiKey}/SMS/${cleanedPhoneNumber}/${otp}/CampusPe`;
        console.log(`🔗 2Factor SMS URL: ${smsUrl}`);
        const response = await axios_1.default.get(smsUrl, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (response.data.Status === 'Success') {
            const otpRecord = new OTPVerification_1.OTPVerification({
                phoneNumber: cleanedPhoneNumber,
                userType: 'student',
                otp,
                otpExpiry,
                isVerified: false,
                attempts: 0,
                sessionId: response.data.Details
            });
            await otpRecord.save();
            return {
                success: true,
                otpId: otpRecord._id.toString(),
                sessionId: response.data.Details,
                message: 'OTP sent successfully to your mobile number',
                otp: otp
            };
        }
        else {
            throw new Error(response.data.Details || 'Failed to send SMS');
        }
    }
    catch (error) {
        console.error('Error sending SMS OTP:', error);
        if (axios_1.default.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            if (errorData.Status === 'Error') {
                return {
                    success: false,
                    message: errorData.Details || 'Failed to send SMS OTP'
                };
            }
        }
        return {
            success: false,
            message: 'Failed to send SMS OTP'
        };
    }
};
exports.sendSMSOTP = sendSMSOTP;
const verifySMSOTP = async (otpId, providedOTP) => {
    try {
        const otpRecord = await OTPVerification_1.OTPVerification.findById(otpId);
        if (!otpRecord) {
            return {
                success: false,
                message: 'Invalid OTP request'
            };
        }
        if (otpRecord.isVerified) {
            return {
                success: false,
                message: 'OTP already verified'
            };
        }
        if (new Date() > otpRecord.otpExpiry) {
            return {
                success: false,
                message: 'OTP has expired'
            };
        }
        const maxAttempts = 3;
        if (otpRecord.attempts >= maxAttempts) {
            return {
                success: false,
                message: 'Maximum attempts exceeded'
            };
        }
        otpRecord.attempts += 1;
        if (otpRecord.sessionId) {
            try {
                const { apiKey } = getSMSConfig();
                const verifyResponse = await axios_1.default.post(`${TWOFACTOR_BASE_URL}/${apiKey}/SMS/VERIFY/${otpRecord.sessionId}/${providedOTP}`);
                if (verifyResponse.data.Status === 'Success' && verifyResponse.data.Details === 'OTP Matched') {
                    otpRecord.isVerified = true;
                    await otpRecord.save();
                    return {
                        success: true,
                        message: 'Phone number verified successfully'
                    };
                }
                else {
                    await otpRecord.save();
                    return {
                        success: false,
                        message: `Invalid OTP. ${maxAttempts - otpRecord.attempts} attempts remaining`
                    };
                }
            }
            catch (verifyError) {
                console.error('2Factor verification error:', verifyError);
            }
        }
        if (otpRecord.otp !== providedOTP) {
            await otpRecord.save();
            return {
                success: false,
                message: `Invalid OTP. ${maxAttempts - otpRecord.attempts} attempts remaining`
            };
        }
        otpRecord.isVerified = true;
        await otpRecord.save();
        return {
            success: true,
            message: 'Phone number verified successfully'
        };
    }
    catch (error) {
        console.error('Error verifying SMS OTP:', error);
        return {
            success: false,
            message: 'Failed to verify OTP'
        };
    }
};
exports.verifySMSOTP = verifySMSOTP;
const getSMSOTPStatus = async (phoneNumber) => {
    try {
        const cleanedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
        const otpRecord = await OTPVerification_1.OTPVerification.findOne({
            phoneNumber: cleanedPhoneNumber,
            userType: 'student',
            isVerified: true
        }).sort({ createdAt: -1 });
        return {
            isVerified: !!otpRecord,
            otpId: otpRecord?._id.toString()
        };
    }
    catch (error) {
        console.error('Error checking SMS OTP status:', error);
        return {
            isVerified: false
        };
    }
};
exports.getSMSOTPStatus = getSMSOTPStatus;
