import axios from 'axios';
import { OTPVerification } from '../models/OTPVerification';

const WABB_API_URL = process.env.WABB_API_URL || 'https://api.wabb.in';
const WABB_API_KEY = process.env.WABB_API_KEY;
const WABB_WEBHOOK_URL = process.env.WABB_WEBHOOK_URL;

// Send WhatsApp message via WABB.in platform
export const sendWhatsAppMessage = async (to: string, message: string) => {
    try {
        if (!WABB_API_KEY) {
            console.log(`WhatsApp message to ${to}: ${message}`);
            return { success: true, message: 'WhatsApp service in development mode' };
        }

        const response = await axios.post(`${WABB_API_URL}/send-message`, {
            to: to,
            message: message,
            type: 'text'
        }, {
            headers: {
                'Authorization': `Bearer ${WABB_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return { success: true, messageId: response.data.messageId };
    } catch (error) {
        console.error('WhatsApp send error:', error);
        return { success: false, error: 'Failed to send WhatsApp message' };
    }
};

// Send OTP via WhatsApp using WABB webhook automation
export const sendWhatsAppOTP = async (phoneNumber: string, userType: 'student' | 'college' | 'recruiter' = 'student', name?: string) => {
    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to database
        const otpVerification = new OTPVerification({
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

        // Send OTP via WABB webhook automation
        if (WABB_WEBHOOK_URL) {
            try {
                // Format phone number (remove any non-digits except +)
                const formattedPhone = phoneNumber.replace(/[^\d]/g, '');
                
                // Prepare webhook data as query parameters (as shown in Postman)
                const queryParams = new URLSearchParams({
                    Phone: formattedPhone,
                    Name: name ? name : `User_${phoneNumber.slice(-4)}`,
                    OTP: otp
                });

                // Construct URL with query parameters
                const webhookUrlWithParams = `${WABB_WEBHOOK_URL}?${queryParams.toString()}`;

                console.log('Sending OTP via WABB.in webhook:', {
                    url: webhookUrlWithParams.replace(otp, '******'), // Don't log actual OTP
                    phone: formattedPhone,
                    name: name ? name : `User_${phoneNumber.slice(-4)}`
                });

                const response = await axios.get(webhookUrlWithParams, {
                    headers: {
                        'User-Agent': 'CampusPe-WhatsApp-Integration'
                    },
                    timeout: 30000 // 30 seconds timeout
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
                } else {
                    throw new Error(`WABB webhook returned status: ${response.status}`);
                }

            } catch (webhookError) {
                console.error('WABB webhook error:', webhookError);
                
                // If axios error, get more details
                if (axios.isAxiosError(webhookError)) {
                    console.error('Webhook error details:', {
                        status: webhookError.response?.status,
                        statusText: webhookError.response?.statusText,
                        data: webhookError.response?.data,
                        message: webhookError.message
                    });
                }
                
                // Don't fallback to direct message - return error instead
                const errorMessage = webhookError instanceof Error ? webhookError.message : 'Unknown error';
                return {
                    success: false,
                    message: `Failed to send OTP via WABB webhook: ${errorMessage}`
                };
            }
        } else {
            return {
                success: false,
                message: 'WABB webhook URL not configured'
            };
        }

    } catch (error) {
        console.error('WhatsApp OTP send error:', error);
        return {
            success: false,
            message: 'Failed to send OTP via WhatsApp'
        };
    }
};

// Verify WhatsApp OTP
export const verifyWhatsAppOTP = async (otpId: string, providedOTP: string) => {
    try {
        const otpRecord = await OTPVerification.findById(otpId);

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

        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        if (otpRecord.otp !== providedOTP) {
            return {
                success: false,
                message: `Invalid OTP. ${otpRecord.maxAttempts - otpRecord.attempts} attempts remaining`
            };
        }

        // Mark as verified
        otpRecord.isVerified = true;
        otpRecord.verifiedAt = new Date();
        await otpRecord.save();

        // Send success confirmation via WhatsApp
        const successMessage = `✅ Verification successful!\n\nYour phone number has been verified for CampusPe.\n\nWelcome to the platform!\n\n- CampusPe Team`
        await sendWhatsAppMessage(otpRecord.phoneNumber!, successMessage);

        return {
            success: true,
            message: 'OTP verified successfully',
            phoneNumber: otpRecord.phoneNumber,
            userType: otpRecord.userType
        };

    } catch (error) {
        console.error('WhatsApp OTP verification error:', error);
        return {
            success: false,
            message: 'Failed to verify OTP'
        };
    }
};

// Send job match notification via WABB webhook
export const sendJobMatchNotification = async (phoneNumber: string, jobData: any) => {
    try {
        console.log(`📱 Sending job match notification to ${phoneNumber}`);
        
        // Use your specific webhook URL
        const WEBHOOK_URL = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/Fy4MvhulWrYT/';
        
        // Create query parameters
        const queryParams = new URLSearchParams({
            Number: phoneNumber
        });

        // Create the webhook URL with phone number
        const webhookUrlWithParams = `${WEBHOOK_URL}?${queryParams.toString()}`;

        // Send POST request with job data
        const response = await axios.post(webhookUrlWithParams, jobData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log(`✅ Job match notification sent successfully to ${phoneNumber}`);
        console.log('Webhook response:', response.status, response.data);

        return {
            success: true,
            message: 'Job match notification sent successfully',
            data: response.data
        };

    } catch (error) {
        console.error('❌ Failed to send job match notification:', error);
        
        // If axios error, get more details
        if (axios.isAxiosError(error)) {
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

// Send welcome message after successful registration
export const sendWelcomeMessageAfterRegistration = async (phoneNumber: string, name: string, userType: string) => {
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

        await sendWhatsAppMessage(phoneNumber, welcomeMessage);
        return { success: true };

    } catch (error) {
        console.error('Welcome message error:', error);
        return { success: false };
    }
};

// Debug function to test WABB webhook with detailed logging
export const debugWABBWebhook = async (phoneNumber: string) => {
    console.log('🧪 DEBUG: Testing WABB.in webhook integration...');
    
    if (!WABB_WEBHOOK_URL) {
        console.error('❌ WABB_WEBHOOK_URL not configured');
        return { success: false, message: 'Webhook URL not configured' };
    }
    
    const formattedPhone = phoneNumber.replace(/[^\d]/g, '');
    const testOtp = '123456';
    
    const queryParams = new URLSearchParams({
        Phone: formattedPhone,
        Name: 'Debug_Test',
        OTP: testOtp
    });
    
    const webhookUrlWithParams = `${WABB_WEBHOOK_URL}?${queryParams.toString()}`;
    
    console.log('📤 Sending test webhook request:');
    console.log('URL:', webhookUrlWithParams.replace(testOtp, '******'));
    console.log('Method: GET');
    console.log('Query Parameters:', {
        Phone: formattedPhone,
        Name: 'Debug_Test',
        OTP: '******'
    });
    
    try {
        const response = await axios.get(webhookUrlWithParams, {
            headers: {
                'User-Agent': 'CampusPe-Debug-Test'
            },
            timeout: 30000,
            validateStatus: () => true // Accept any status code for debugging
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
        
    } catch (error) {
        console.error('❌ Webhook test error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};