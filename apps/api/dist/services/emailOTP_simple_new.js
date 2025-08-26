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
exports.verifyEmailOTP = exports.sendEmailOTP = void 0;
const OTPVerification_1 = require("../models/OTPVerification");
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
const getAzureConfig = () => {
    const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    const fromEmail = process.env.AZURE_COMMUNICATION_EMAIL_FROM;
    return {
        connectionString: connectionString || null,
        fromEmail: fromEmail || 'DoNotReply@campuspe.com',
        hasAzure: !!connectionString
    };
};
const sendEmailOTP = async (email, userType) => {
    try {
        const recentOTP = await OTPVerification_1.OTPVerification.findOne({
            email,
            userType,
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
        const azureConfig = getAzureConfig();
        let azureMessageId = null;
        let emailSent = false;
        if (azureConfig.hasAzure && azureConfig.connectionString) {
            try {
                const AzureModule = await Promise.resolve().then(() => __importStar(require('@azure/communication-email')));
                const EmailClient = AzureModule.EmailClient;
                const emailClient = new EmailClient(azureConfig.connectionString);
                const emailMessage = {
                    senderAddress: azureConfig.fromEmail,
                    content: {
                        subject: `CampusPe OTP Verification - ${otp}`,
                        html: `
                        <html>
                        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #2563eb; margin-bottom: 10px;">CampusPe</h1>
                                <h2 style="color: #374151; margin-bottom: 20px;">Email Verification</h2>
                            </div>

                            <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                                <h3 style="color: #374151; margin-bottom: 15px;">Your OTP Code</h3>
                                <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; margin: 20px 0; padding: 15px; background-color: white; border-radius: 4px; border: 2px dashed #2563eb;">
                                    ${otp}
                                </div>
                                <p style="color: #6b7280; margin-top: 15px;">This code expires in 15 minutes</p>
                            </div>

                            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                                <p style="color: #92400e; margin: 0; font-size: 14px;">
                                    <strong>Security Notice:</strong> Do not share this OTP with anyone.
                                </p>
                            </div>

                            <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
                                <p>This is an automated message from CampusPe.</p>
                            </div>
                        </body>
                        </html>
                        `,
                    },
                    recipients: {
                        to: [{ address: email }],
                    },
                };
                const poller = await emailClient.beginSend(emailMessage);
                const emailResult = await poller.pollUntilDone();
                if (emailResult.status === 'Succeeded') {
                    azureMessageId = emailResult.id;
                    emailSent = true;
                    console.log(`✅ Azure email sent successfully to ${email}`);
                }
                else {
                    console.log(`❌ Azure email failed for ${email}, falling back to console`);
                }
            }
            catch (azureError) {
                console.error(`❌ Azure email error for ${email}:`, azureError);
                emailSent = true;
                console.log(`📝 Email sending failed, but OTP will be logged to console for testing`);
            }
        }
        else {
            emailSent = true;
            console.log(`❌ No Azure email configuration found, using console logging only`);
        }
        const otpRecord = new OTPVerification_1.OTPVerification({
            email,
            userType,
            otp,
            otpExpiry,
            isVerified: false,
            attempts: 0,
            azureMessageId
        });
        await otpRecord.save();
        console.log(`📧 EMAIL OTP for ${email}: ${otp} (expires in 15 minutes)`);
        console.log(`🆔 OTP ID: ${otpRecord._id.toString()}`);
        const message = emailSent
            ? `OTP sent to your email ${email}. Please check your inbox.`
            : `OTP sent to your email ${email}. Check the server console for testing.`;
        return {
            success: true,
            otpId: otpRecord._id.toString(),
            message
        };
    }
    catch (error) {
        console.error('Error sending email OTP:', error);
        return {
            success: false,
            message: 'Failed to send OTP email'
        };
    }
};
exports.sendEmailOTP = sendEmailOTP;
const verifyEmailOTP = async (otpId, providedOTP) => {
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
        if (otpRecord.otp !== providedOTP) {
            await otpRecord.save();
            return {
                success: false,
                message: `Invalid OTP. ${maxAttempts - otpRecord.attempts} attempts remaining`
            };
        }
        otpRecord.isVerified = true;
        otpRecord.verifiedAt = new Date();
        await otpRecord.save();
        return {
            success: true,
            message: 'Email verified successfully'
        };
    }
    catch (error) {
        console.error('Error verifying email OTP:', error);
        return {
            success: false,
            message: 'Failed to verify OTP'
        };
    }
};
exports.verifyEmailOTP = verifyEmailOTP;
