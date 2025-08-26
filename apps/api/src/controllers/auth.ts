import { Request, Response } from 'express';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Recruiter } from '../models/Recruiter';
import { College } from '../models/College';
import { sendWhatsAppMessage, sendWhatsAppOTP, verifyWhatsAppOTP, sendWelcomeMessageAfterRegistration, debugWABBWebhook } from '../services/whatsapp';
import { sendEmailOTP, verifyEmailOTP } from '../services/emailOTP_simple_new';
import { sendSMSOTP, verifySMSOTP, getSMSOTPStatus } from '../services/smsOTP';
import { OTPVerification } from '../models/OTPVerification';
import { getAdminConfig } from '../config/admin.config';
import { verifyGoogleToken } from '../services/googleAuth';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Role-specific login controllers
export const studentLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        console.log('Student login attempt for email:', email);
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate user role for student login
        if (user.role !== 'student') {
            return res.status(403).json({ 
                message: 'Access denied. This login is for students only. Please use the appropriate login page for your account type.',
                redirectTo: user.role === 'recruiter' ? '/company-login' : user.role === 'college' ? '/college-login' : '/login'
            });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'Please use Google Sign-in for this account' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({ 
            token, 
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                isVerified: user.isVerified
            } 
        });
    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const recruiterLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        console.log('Recruiter login attempt for email:', email);
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate user role for recruiter login
        if (user.role !== 'recruiter') {
            return res.status(403).json({ 
                message: 'Access denied. This login is for recruiters only. Please use the appropriate login page for your account type.',
                redirectTo: user.role === 'student' ? '/login' : user.role === 'college' ? '/college-login' : '/login'
            });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'Please use Google Sign-in for this account' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({ 
            token, 
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                isVerified: user.isVerified
            } 
        });
    } catch (error) {
        console.error('Recruiter login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const collegeLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        console.log('College login attempt for email:', email);
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate user role for college login
        if (!['college', 'college_admin', 'placement_officer'].includes(user.role)) {
            return res.status(403).json({ 
                message: 'Access denied. This login is for college administrators only. Please use the appropriate login page for your account type.',
                redirectTo: user.role === 'student' ? '/login' : user.role === 'recruiter' ? '/company-login' : '/login'
            });
        }

        if (!user.password) {
            return res.status(400).json({ message: 'Please use Google Sign-in for this account' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({ 
            token, 
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                isVerified: user.isVerified
            } 
        });
    } catch (error) {
        console.error('College login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Send OTP based on user type (Enhanced with WhatsApp support)
export const sendOTP = async (req: Request, res: Response) => {
    const { phoneNumber, email, userType, preferredMethod, firstName, lastName } = req.body;

    console.log('sendOTP called with email:', email);

    try {
        if (!userType || !['student', 'college', 'recruiter'].includes(userType)) {
            return res.status(400).json({ message: 'Valid user type is required (student, college, recruiter)' });
        }

        // Check if user already exists by email or phone before sending OTP
        let existingUser = null;
        if (email) {
            existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        }
        if (!existingUser && phoneNumber) {
            existingUser = await User.findOne({ phone: phoneNumber.trim() });
        }
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or phone number' });
        }

        let result;
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : `User_${phoneNumber ? phoneNumber.slice(-4) : 'Unknown'}`;

        if (userType === 'student') {
            if (!phoneNumber) {
                return res.status(400).json({ message: 'Phone number is required for student verification' });
            }

            // 🚀 PRODUCTION-LEVEL OTP SENDING WITH FALLBACK
            console.log(`📱 Sending OTP to student: ${phoneNumber}, preferred method: ${preferredMethod}`);
            
            // Primary: Try WhatsApp OTP via WABB webhook
            if (preferredMethod === 'whatsapp' || !preferredMethod) {
                console.log('🔄 Attempting WhatsApp OTP via WABB webhook...');
                result = await sendWhatsAppOTP(phoneNumber, userType, fullName);
                
                // If WhatsApp fails, fallback to SMS automatically
                if (!result.success) {
                    console.log('❌ WhatsApp OTP failed, falling back to SMS...');
                    console.log('WhatsApp error:', result.message);
                    
                    // Fallback to SMS OTP
                    const smsResult = await sendSMSOTP(phoneNumber);
                    
                    if (smsResult.success) {
                        console.log('✅ SMS OTP fallback successful');
                        result = {
                            ...smsResult,
                            message: 'OTP sent via SMS (WhatsApp temporarily unavailable)',
                            method: 'sms_fallback'
                        };

                        // Call WABB webhook for SMS notifications (optional)
                        if (smsResult.otp) {
                            const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/';
                            const params = new URLSearchParams({
                                Phone: phoneNumber,
                                Name: fullName,
                                OTP: smsResult.otp,
                                Method: 'SMS_FALLBACK'
                            });
                            const fullUrl = `${webhookUrl}?${params.toString()}`;

                            try {
                                await axios.get(fullUrl);
                                console.log('📤 SMS fallback webhook notification sent');
                            } catch (webhookError) {
                                console.error('⚠️ SMS fallback webhook failed (non-critical):', webhookError);
                            }
                        }
                    } else {
                        console.log('❌ Both WhatsApp and SMS failed');
                        result = {
                            success: false,
                            message: 'Failed to send OTP via WhatsApp and SMS. Please try again or contact support.',
                            details: {
                                whatsapp: result.message,
                                sms: smsResult.message
                            }
                        };
                    }
                } else {
                    console.log('✅ WhatsApp OTP sent successfully');
                }
            } else {
                // User explicitly chose SMS
                console.log('📱 User chose SMS method');
                result = await sendSMSOTP(phoneNumber);

                // If SMS OTP sent successfully, call registration webhook with Phone, Name, OTP
                if (result.success && result.otp) {
                    const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/FQavVMJ9VP7G/';
                    const params = new URLSearchParams({
                        Phone: phoneNumber,
                        Name: fullName,
                        OTP: result.otp,
                        Method: 'SMS_DIRECT'
                    });
                    const fullUrl = `${webhookUrl}?${params.toString()}`;

                    try {
                        await axios.get(fullUrl);
                        console.log(`✅ Direct SMS webhook notification sent to ${fullUrl}`);
                    } catch (webhookError) {
                        console.error('⚠️ Direct SMS webhook failed (non-critical):', webhookError);
                    }
                }
            }
        } else {
            if (!email) {
                return res.status(400).json({ message: 'Email is required for college/recruiter verification' });
            }
            result = await sendEmailOTP(email, userType as 'college' | 'recruiter');
        }
        
        if (result.success) {
            const response: any = {
                message: result.message,
                otpId: result.otpId,
                method: (result as any).method || (userType === 'student' && (preferredMethod === 'whatsapp' || !preferredMethod) ? 'whatsapp' : (userType === 'student' ? 'sms' : 'email'))
            };
            
            // Only include sessionId for SMS OTP (2Factor)
            if ('sessionId' in result && result.sessionId) {
                response.sessionId = result.sessionId;
            }

            // Include expiry info for WhatsApp OTP
            if ('expiresIn' in result) {
                response.expiresIn = result.expiresIn;
            }

            // Include fallback info if applicable
            if ('details' in result && (result as any).details) {
                response.fallbackUsed = true;
                response.originalError = (result as any).details;
            }
            
            console.log(`📤 OTP Response:`, { 
                method: response.method, 
                success: true, 
                otpId: response.otpId ? 'present' : 'missing' 
            });
            
            res.status(200).json(response);
        } else {
            console.log(`❌ OTP Failed:`, result.message);
            res.status(400).json({ 
                message: result.message,
                details: (result as any).details || undefined
            });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Server error while sending OTP' });
    }
};

// Verify OTP based on user type (Enhanced with WhatsApp support)
export const verifyOTPController = async (req: Request, res: Response) => {
    const { otpId, otp, userType, method, autoLogin, phone, email } = req.body;

    try {
        if (!otpId || !otp || !userType) {
            return res.status(400).json({ message: 'OTP ID, OTP, and user type are required' });
        }

        let result;

        if (userType === 'student') {
            // Check the method used to determine verification approach
            if (method === 'whatsapp') {
                result = await verifyWhatsAppOTP(otpId, otp);
            } else if (method === 'webhook') {
                // Verify OTP from OTPVerification collection
                const otpRecord = await OTPVerification.findById(otpId);
                if (!otpRecord) {
                    result = { success: false, message: 'Invalid OTP request' };
                } else if (otpRecord.isVerified) {
                    result = { success: false, message: 'OTP has already been verified' };
                } else if (otpRecord.otpExpiry < new Date()) {
                    result = { success: false, message: 'OTP has expired' };
                } else if (otpRecord.otp !== otp) {
                    result = { success: false, message: 'Invalid OTP' };
                } else {
                    otpRecord.isVerified = true;
                    otpRecord.verifiedAt = new Date();
                    await otpRecord.save();
                    result = { success: true, message: 'OTP verified successfully', phoneNumber: otpRecord.phoneNumber, userType: otpRecord.userType };
                }
            } else {
                result = await verifySMSOTP(otpId, otp);
            }
        } else {
            result = await verifyEmailOTP(otpId, otp);
        }
        
        if (result.success) {
            const response: any = { 
                message: result.message, 
                verified: true
            };

            // Add additional data if available
            if ('phoneNumber' in result && result.phoneNumber) {
                response.phoneNumber = result.phoneNumber;
            }
            if ('userType' in result && result.userType) {
                response.userType = result.userType;
            }

            // If autoLogin flag is set, generate JWT token for the user
            if (autoLogin) {
                let user = null;

                // For students, try to find user by phone number
                if (userType === 'student' && (phone || response.phoneNumber)) {
                    const phoneNumberToUse = phone || response.phoneNumber;
                    user = await User.findOne({ phone: phoneNumberToUse });
                } 
                // For college and recruiter, try to find user by email
                else if ((userType === 'college' || userType === 'recruiter') && email) {
                    console.log('Looking for user by email:', email);
                    user = await User.findOne({ email: email.toLowerCase().trim() });

                    // If not found directly, try to find via related profile
                    if (!user && userType === 'college') {
                        const college = await import('../models/College').then(mod => mod.College.findOne({ 
                            'primaryContact.email': email.toLowerCase().trim() 
                        }));
                        if (college && college.userId) {
                            user = await User.findById(college.userId);
                        }
                    }

                    if (!user && userType === 'recruiter') {
                        const recruiter = await import('../models/Recruiter').then(mod => mod.Recruiter.findOne({
                            userId: { $exists: true }
                        }).where('recruiterProfile.email').equals(email.toLowerCase().trim()));
                        if (recruiter && recruiter.userId) {
                            user = await User.findById(recruiter.userId);
                        }
                    }
                }

                if (user) {
                    // For students, fetch student profile id
                    let studentId = null;
                    if (user.role === 'student') {
                        const student = await import('../models/Student').then(mod => mod.Student.findOne({ userId: user._id }).lean());
                        if (student) {
                            studentId = student._id.toString();
                        }
                    }

                    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
                    response.token = token;
                    response.user = {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        isVerified: user.isVerified,
                        studentId: studentId
                    };
                }
            }

            res.status(200).json(response);
        } else {
            res.status(400).json({ message: result.message, verified: false });
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error while verifying OTP' });
    }
};



// User registration with complete profile data
export const register = async (req: Request, res: Response) => {
    const { email, password, role, phoneNumber, otpId, profileData, userType } = req.body;

    try {
        // Validate required fields
        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required' });
        }

        // Validate role-specific requirements
        if (role === 'student') {
            if (!phoneNumber) {
                return res.status(400).json({ message: 'Phone number is required for student registration' });
            }
        }

        if ((role === 'college' || role === 'recruiter') && !email) {
            return res.status(400).json({ message: 'Email is required for college/recruiter registration' });
        }

        // Validate primaryContact fields for college role
        if (role === 'college') {
            console.log('Validating college profile data:', JSON.stringify(profileData, null, 2));
            
            if (!profileData || !profileData.contactDesignation || profileData.contactDesignation.trim() === '') {
                console.log('Missing contactDesignation:', profileData?.contactDesignation);
                return res.status(400).json({ message: 'Primary contact designation is required for college registration' });
            }
            if (!profileData.contactName || profileData.contactName.trim() === '') {
                console.log('Missing contactName:', profileData?.contactName);
                return res.status(400).json({ message: 'Primary contact name is required for college registration' });
            }
            if (!profileData.contactEmail || profileData.contactEmail.trim() === '') {
                console.log('Missing contactEmail:', profileData?.contactEmail);
                return res.status(400).json({ message: 'Primary contact email is required for college registration' });
            }
            if (!profileData.contactPhone || profileData.contactPhone.trim() === '') {
                console.log('Missing contactPhone:', profileData?.contactPhone);
                return res.status(400).json({ message: 'Primary contact phone is required for college registration' });
            }
        }

        // Check if user already exists by email
        const existingUserByEmail = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUserByEmail) {
            console.warn(`Registration attempt with existing email: ${email.toLowerCase().trim()}, role: ${role}`);

            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Check if user already exists by phone number
        if (phoneNumber) {
            const existingUserByPhone = await User.findOne({ phone: phoneNumber.trim() });
            if (existingUserByPhone) {
                console.warn(`Registration attempt with existing phone number: ${phoneNumber.trim()}, role: ${role}`);

                return res.status(400).json({ message: 'User already exists with this phone number' });
            }
        }

        // Additional logging for debugging
        console.log('Registering user with email:', email ? email.toLowerCase().trim() : 'No email provided');
        console.log('Profile data received:', profileData);

        // Log email before saving user
        console.log('Email before saving user:', email);

        // Verify OTP if provided
        if (otpId) {
            let otpStatus;
            if (role === 'student') {
                otpStatus = await getSMSOTPStatus(phoneNumber);
            } else {
                // For colleges and recruiters, we need to check email verification
                // This is a simplified check - in production, you'd want more robust verification
                otpStatus = { isVerified: true }; // Assuming email OTP was verified in previous step
            }

            if (!otpStatus.isVerified) {
                return res.status(400).json({ message: 'Verification required. Please verify your contact information first.' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = new User({ 
            email: email ? email.toLowerCase().trim() : undefined, 
            password: hashedPassword, 
            role,
            phone: phoneNumber,
            isVerified: !!otpId // Verified if OTP was used
        });

        console.log('New user object before save:', newUser);
        
        await newUser.save();

        console.log('New user saved:', newUser);

        // Log saved email after saving user
        console.log('Saved user email:', newUser.email);

        // Create role-specific profile
        let profileId;
        switch (role) {
            case 'student':
                profileId = await createStudentProfile(newUser._id, profileData, email);
                break;
            case 'recruiter':
                profileId = await createRecruiterProfile(newUser._id, profileData);
                break;
            case 'college':
                profileId = await createCollegeProfile(newUser._id, profileData);
                break;
            default:
                return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
        
        res.status(201).json({ 
            message: 'User registered successfully', 
            token, 
            user: { 
                id: newUser._id, 
                email: newUser.email, 
                role: newUser.role,
                isVerified: newUser.isVerified,
                profileId
            } 
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Log more details about the error
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            // Check if it's a MongoDB validation error
            if (error.name === 'ValidationError') {
                console.error('MongoDB validation error details:', error);
                const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
                return res.status(400).json({ 
                    message: 'Validation failed', 
                    errors: validationErrors,
                    details: error.message 
                });
            }
            
            // Check if it's a duplicate key error
            if (error.name === 'MongoServerError' && (error as any).code === 11000) {
                const field = Object.keys((error as any).keyPattern || {})[0];
                return res.status(400).json({ 
                    message: `${field} already exists`,
                    error: 'DUPLICATE_KEY'
                });
            }
            
            res.status(500).json({ message: `Server error during registration: ${error.message}` });
        } else {
            console.error('Unknown error type:', typeof error, error);
            res.status(500).json({ message: 'Server error during registration' });
        }
    }
};

// Helper function to create student profile
const createStudentProfile = async (userId: any, profileData: any, email: string) => {
    // Handle case where profileData is null or undefined
    const profile = profileData || {};
    
    // If no college is selected, use the first available college as default
    let collegeId = profile.collegeId && profile.collegeId.trim() !== '' ? profile.collegeId : null;
    if (!collegeId) {
        try {
            const firstCollege = await College.findOne({});
            collegeId = firstCollege ? firstCollege._id : null;
        } catch (error) {
            console.error('Error fetching default college:', error);
        }
    }
    
    // If collegeId is still null, we'll need to handle this in the Student model or create a default college
    if (!collegeId) {
        // Skip collegeId requirement for now - student can update later
        console.warn('No college selected or available - student profile created without college assignment');
    }
    
    const studentData: any = {
        userId,
        firstName: profile.firstName || 'Student',
        lastName: profile.lastName || 'User',
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        email: email || '',
        phoneNumber: profile.phoneNumber || profile.whatsappNumber || '',
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
        studentId: profile.studentId || `STU${Date.now()}`,
        enrollmentYear: profile.enrollmentYear || new Date().getFullYear(),
        graduationYear: profile.graduationYear,
        currentSemester: profile.currentSemester,
        education: profile.education || [],
        experience: profile.experience || [], 
        skills: profile.skills || [],
        jobPreferences: profile.jobPreferences || {
            jobTypes: [],
            preferredLocations: [],
            workMode: 'any'
        },
        profileCompleteness: calculateStudentProfileCompleteness(profile),
        isActive: true,
        isPlacementReady: false
    };

    // Only include collegeId if we have one
    if (collegeId) {
        studentData.collegeId = collegeId;
    }

    const student = new Student(studentData);
    await student.save()
    return student._id;
};

// Helper function to create recruiter profile
const createRecruiterProfile = async (userId: any, profileData: any) => {
    try {
        // Handle case where profileData is null or undefined
        const profile = profileData || {};
        
        const recruiterData = {
            userId,
            companyInfo: {
                name: profile.companyName || '',
                industry: profile.industry || '',
                website: profile.website,
                logo: profile.logo,
                description: profile.companyDescription,
                size: profile.companySize || 'medium',
                foundedYear: profile.foundedYear,
                headquarters: {
                    city: profile.city || '',
                    state: profile.state || '',
                    country: profile.country || 'India'
                }
            },
            recruiterProfile: {
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                designation: profile.designation || '',
                department: profile.department,
                linkedinUrl: profile.linkedinUrl,
                profilePicture: profile.profilePicture
            },
            hiringInfo: {
                preferredColleges: profile.preferredColleges || [],
                preferredCourses: profile.preferredCourses || [],
                hiringSeasons: profile.hiringSeasons || ['continuous'],
                averageHires: profile.averageHires || 0,
                workLocations: profile.workLocations || [],
                remoteWork: profile.remoteWork || false,
                internshipOpportunities: profile.internshipOpportunities || false
            },
            whatsappNumber: profile.whatsappNumber,
            preferredContactMethod: profile.preferredContactMethod || 'email',
            isActive: true,
            lastActiveDate: new Date()
        };

        const recruiter = new Recruiter(recruiterData);
        await recruiter.save();
        return recruiter._id;
    } catch (error) {
        console.error('Error creating recruiter profile:', error);
        throw error;
    }
};

// Helper function to create college profile
const createCollegeProfile = async (userId: any, profileData: any) => {
    // Handle case where profileData is null or undefined
    const profile = profileData || {};
    
    const collegeData = {
        userId,
        name: profile.collegeName || '',
        shortName: profile.shortName,
        domainCode: profile.domainCode || generateDomainCode(profile.collegeName),
        website: profile.website,
        logo: profile.logo,
        address: {
            street: profile.street || '',
            city: profile.city || '',
            state: profile.state || '',
            zipCode: profile.zipCode || '',
            country: profile.country || 'India'
        },
        primaryContact: {
            name: profile.contactName || '',
            designation: profile.contactDesignation || '',
            email: profile.contactEmail || profile.email || '',
            phone: profile.contactPhone || ''
        },
        placementContact: profile.placementContact,
        establishedYear: profile.establishedYear || new Date().getFullYear(),
        affiliation: profile.affiliation || '',
        accreditation: profile.accreditation || [],
        courses: [],
        departments: profile.departments || [],
        students: [],
        approvedRecruiters: [],
        pendingRecruiters: [],
        placementStats: [],
        isPlacementActive: profile.isPlacementActive || true,
        placementCriteria: profile.placementCriteria,
        isVerified: false,
        verificationDocuments: [],
        isActive: true,
        allowDirectApplications: profile.allowDirectApplications || true
    };

    const college = new College(collegeData);
    await college.save();
    return college._id;
};

// Helper function to calculate student profile completeness
const calculateStudentProfileCompleteness = (profileData: any): number => {
    // Handle case where profileData is null or undefined
    const profile = profileData || {};
    
    let completeness = 0;
    const fields = [
        'firstName', 'lastName', 'collegeId', 'studentId', 'enrollmentYear',
        'skills', 'education', 'jobPreferences'
    ];

    fields.forEach(field => {
        if (profile[field] && 
            (Array.isArray(profile[field]) ? profile[field].length > 0 : true)) {
            completeness += 12.5; // 100/8 fields
        }
    });

    return Math.round(completeness);
};

// Helper function to generate domain code for college
const generateDomainCode = (collegeName: string): string => {
    if (!collegeName) return 'COL' + Date.now();
    
    return collegeName
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 6) + Math.floor(Math.random() * 1000);
};

import { body, validationResult } from 'express-validator';

export const validateEmail = [
    body('email').isEmail().withMessage('Valid email is required'),
    (req: Request, res: Response, next: any) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export const checkEmail = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            return res.status(200).json({ available: false, message: 'Email is already taken' });
        } else {
            return res.status(200).json({ available: true, message: 'Email is available' });
        }
    } catch (error) {
        console.error('Check email error:', error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        return res.status(500).json({ message: 'Server error while checking email' });
    }
};

export const checkPhone = async (req: Request, res: Response) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        const user = await User.findOne({ phone: phone.trim() });
        if (user) {
            return res.status(200).json({ available: false, message: 'Phone number is already taken' });
        } else {
            return res.status(200).json({ available: true, message: 'Phone number is available' });
        }
    } catch (error) {
        console.error('Check phone error:', error);
        return res.status(500).json({ message: 'Server error while checking phone number' });
    }
};

// Temporary test login endpoint for development
export const testLogin = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ 
            token, 
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                isVerified: user.isVerified
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// User login
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        console.log('Login attempt for email:', email);
        
        // Input validation
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if it's admin credentials
        console.log('Checking admin credentials...');
        const adminConfig = getAdminConfig();
        if (email === adminConfig.email && password === adminConfig.password) {
            console.log('Admin login successful');
            const token = jwt.sign({ 
                userId: 'admin', 
                role: 'admin',
                email: adminConfig.email,
                name: adminConfig.name
            }, JWT_SECRET, { expiresIn: '24h' });
            
            return res.status(200).json({ 
                token, 
                user: { 
                    id: 'admin', 
                    email: adminConfig.email, 
                    role: 'admin',
                    name: adminConfig.name,
                    isVerified: true
                } 
            });
        }

        console.log('Looking up user in database...');
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('User found, verifying password...');
        
        // Check if user has a password (for non-Google auth users)
        if (!user.password) {
            console.log('User has no password set (possibly Google auth user)');
            return res.status(400).json({ message: 'Please use Google Sign-in for this account' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('Password verified, updating last login...');
        // Update last login - handle tenant validation issue
        user.lastLogin = new Date();
        
        // For backward compatibility, set a default tenantId for student/college users if missing
        if (['student', 'college_admin', 'placement_officer'].includes(user.role) && !user.tenantId) {
            console.log('Setting default tenantId for user role:', user.role);
            user.tenantId = new mongoose.Types.ObjectId(); // Create a default tenant ID
        }
        
        try {
            await user.save();
        } catch (saveError) {
            console.error('Error saving user during login:', saveError);
            // Even if save fails, continue with login - we don't want to block user access
            console.log('Continuing login despite save error...');
        }

        console.log('Generating JWT token...');
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        
        console.log('Login successful for user:', email);
        res.status(200).json({ 
            token, 
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                isVerified: user.isVerified
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
        res.status(500).json({ 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
        });
    }
};

// Forgot password - send OTP to phone number or email
export const forgotPassword = async (req: Request, res: Response) => {
    const { phone, email, preferredMethod } = req.body;

    try {
        let user;
        if (preferredMethod === 'email') {
            if (!email) {
                return res.status(400).json({ message: 'Email is required for email OTP' });
            }
            console.log('Looking up user by email:', email.toLowerCase().trim());
            const allUsers = await User.find({}, { email: 1 }).lean();
            console.log('All user emails in DB:', allUsers.map(u => u.email));
            user = await User.findOne({ email: email.toLowerCase().trim() });
            if (!user) {
                // Try to find user by email in Student collection
                const student = await import('../models/Student').then(mod => mod.Student.findOne({ email: email.toLowerCase().trim() }));
                console.log('Student found by email:', student);
                if (student) {
                    user = await User.findById(student.userId);
                    console.log('User found by student userId:', user);
                }
            }
            if (!user) {
                return res.status(404).json({ message: 'No account found with this email' });
            }
            // Check if user email is verified
            if (!user.isVerified) {
                return res.status(400).json({ message: 'Email is not verified. Please verify your email first.' });
            }
            console.log('User found and verified:', user);
        } else {
            if (!phone) {
                return res.status(400).json({ message: 'Phone number is required for phone OTP' });
            }
            user = await User.findOne({ phone });
            if (!user) {
                return res.status(404).json({ message: 'No account found with this phone number' });
            }
        }

        // Check OTP request count in last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let otpRequestCount;
        if (preferredMethod === 'email') {
            otpRequestCount = await OTPVerification.countDocuments({
                email: email.toLowerCase().trim(),
                createdAt: { $gte: twentyFourHoursAgo }
            });
        } else {
            otpRequestCount = await OTPVerification.countDocuments({
                phoneNumber: phone,
                createdAt: { $gte: twentyFourHoursAgo }
            });
        }

        if (otpRequestCount >= 3) {
            return res.status(429).json({ message: 'Maximum OTP requests reached. Please try again later.' });
        }

        if (preferredMethod === 'email') {
            // Send email OTP using existing service
            // Map enterprise roles to legacy OTP service roles
            const emailUserRole = user.role === 'recruiter' ? 'recruiter' : 'college';
            const result = await sendEmailOTP(email.toLowerCase().trim(), emailUserRole);
            if (result.success) {
                return res.status(200).json({
                    message: 'OTP has been sent to your email address',
                    otpId: result.otpId,
                    method: 'email',
                    expiresIn: (result as any).expiresIn || '10 minutes'
                });
            } else {
                return res.status(400).json({ message: result.message || 'Failed to send email OTP' });
            }
        } else {
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Save OTP to database
            const otpVerification = new OTPVerification({
                phoneNumber: phone,
                userType: user.role,
                otp: otp,
                otpExpiry: otpExpiry,
                isVerified: false,
                attempts: 0,
                maxAttempts: 3
            });

            await otpVerification.save();

            // Send GET request to webhook URL with Number and OTP
            const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/4nVuxt446PLJ/';
            const params = new URLSearchParams({
                Number: phone,
                OTP: otp
            });
            const fullUrl = `${webhookUrl}?${params.toString()}`;

            try {
                await axios.get(fullUrl);
                console.log(`Webhook request sent successfully to ${fullUrl}`);
            } catch (webhookError) {
                console.error('Error sending webhook request:', webhookError);
            }

            return res.status(200).json({
                message: 'OTP has been sent to your phone number',
                otpId: otpVerification._id.toString(),
                method: 'webhook',
                expiresIn: '10 minutes'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error while processing forgot password' });
    }
};

// Verify OTP and auto-login
export const verifyOTPAndLogin = async (req: Request, res: Response) => {
    const { otpId, otp, userType, method, phone, email } = req.body;

    try {
        if (!otpId || !otp || !userType || (!phone && !email)) {
            return res.status(400).json({ message: 'OTP ID, OTP, user type, and phone or email are required' });
        }

        let result;

        // Verify OTP based on method
        if (userType === 'student') {
            if (method === 'whatsapp') {
                result = await verifyWhatsAppOTP(otpId, otp);
            } else if (method === 'webhook') {
                // Verify OTP from OTPVerification collection
                const otpRecord = await OTPVerification.findById(otpId);
                if (!otpRecord) {
                    result = { success: false, message: 'Invalid OTP request' };
                } else if (otpRecord.isVerified) {
                    result = { success: false, message: 'OTP has already been verified' };
                } else if (otpRecord.otpExpiry < new Date()) {
                    result = { success: false, message: 'OTP has expired' };
                } else if (otpRecord.otp !== otp) {
                    result = { success: false, message: 'Invalid OTP' };
                } else {
                    otpRecord.isVerified = true;
                    otpRecord.verifiedAt = new Date();
                    await otpRecord.save();
                    result = { success: true, message: 'OTP verified successfully', phoneNumber: otpRecord.phoneNumber, userType: otpRecord.userType };
                }
            } else {
                result = await verifySMSOTP(otpId, otp);
            }
        } else {
            result = await verifyEmailOTP(otpId, otp);
        }
        
        if (result.success) {
            // Find user by phone number or email
            let user;
            if (userType === 'student') {
                user = await User.findOne({ phone });
            } else {
                user = await User.findOne({ email: email.toLowerCase().trim() });
            }
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            console.log('User found for OTP verification:', user);

            // For students, fetch student id linked to user
            let studentId = null;
            if (user.role === 'student') {
                const student = await import('../models/Student').then(mod => mod.Student.findOne({ userId: user._id }).lean());
                if (student) {
                    studentId = student._id.toString();
                }
            }
            console.log('User role:', user.role);
            console.log('Student ID:', studentId);

            // Generate JWT token for auto-login
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(200).json({
                message: 'OTP verified successfully',
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                    studentId: studentId
                }
            });
        } else {
            res.status(400).json({ message: result.message, verified: false });
        }
    } catch (error) {
        console.error('Verify OTP and login error:', error);
        res.status(500).json({ message: 'Server error while verifying OTP and logging in' });
    }
};

// Google Sign-up with Phone Verification
export const googleSignup = async (req: Request, res: Response) => {
    const { idToken, phone, userType = 'student' } = req.body;

    try {
        if (!idToken) {
            return res.status(400).json({ message: 'Google ID token is required' });
        }

        // For students, phone number is required
        if (userType === 'student' && !phone) {
            return res.status(400).json({ message: 'Phone number is required for student registration' });
        }

        // Verify Google token
        const googleAuthResult = await verifyGoogleToken(idToken);
        if (!googleAuthResult.success) {
            return res.status(400).json({ message: googleAuthResult.message });
        }

        const { user: googleUser } = googleAuthResult;
        
        // Additional null check for googleUser
        if (!googleUser) {
            return res.status(400).json({ message: 'Failed to get user information from Google' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: googleUser.email },
                { googleId: googleUser.googleId }
            ]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or Google account' });
        }

        // For students, check if phone number is already registered
        if (userType === 'student' && phone) {
            const existingUserByPhone = await User.findOne({ phone: phone.trim() });
            if (existingUserByPhone) {
                return res.status(400).json({ message: 'User already exists with this phone number' });
            }
        }

        // Create new user with Google info
        const newUser = new User({
            email: googleUser.email,
            googleId: googleUser.googleId,
            role: userType,
            phone: userType === 'student' ? phone : undefined,
            isVerified: googleUser.emailVerified, // Email is verified by Google
            name: googleUser.name,
            profilePicture: googleUser.picture
        });

        await newUser.save();

        // For students, we need to verify phone number
        if (userType === 'student' && phone) {
            // Send OTP to phone for verification
            const otpResult = await sendWhatsAppOTP(phone, 'student');
            
            if (otpResult.success) {
                return res.status(200).json({
                    message: 'Google account linked successfully. Please verify your phone number.',
                    userId: newUser._id,
                    email: newUser.email,
                    requiresPhoneVerification: true,
                    otpId: otpResult.otpId,
                    phone: phone
                });
            } else {
                // If WhatsApp OTP fails, try webhook OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

                const otpVerification = new OTPVerification({
                    phoneNumber: phone,
                    userType: 'student',
                    otp: otp,
                    otpExpiry: otpExpiry,
                    isVerified: false,
                    attempts: 0,
                    maxAttempts: 3
                });

                await otpVerification.save();

                // Send webhook request
                const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/4nVuxt446PLJ/';
                const params = new URLSearchParams({
                    Number: phone,
                    OTP: otp
                });

                try {
                    await axios.get(`${webhookUrl}?${params.toString()}`);
                    console.log('Webhook OTP sent successfully for Google signup');
                } catch (webhookError) {
                    console.error('Webhook error for Google signup:', webhookError);
                }

                return res.status(200).json({
                    message: 'Google account linked successfully. Please verify your phone number.',
                    userId: newUser._id,
                    email: newUser.email,
                    requiresPhoneVerification: true,
                    otpId: otpVerification._id.toString(),
                    phone: phone,
                    method: 'webhook'
                });
            }
        }

        // For non-students (college/recruiter), no phone verification needed
        // Create appropriate profile
        let profileId;
        switch (userType) {
            case 'college':
                const college = new College({
                    userId: newUser._id,
                    name: googleUser!.name,
                    email: googleUser!.email,
                    isVerified: true
                });
                await college.save();
                profileId = college._id;
                break;
            case 'recruiter':
                const recruiter = new Recruiter({
                    userId: newUser._id,
                    name: googleUser!.name,
                    email: googleUser!.email,
                    isVerified: true
                });
                await recruiter.save();
                profileId = recruiter._id;
                break;
        }

        // Generate JWT token
        const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Google signup successful',
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                isVerified: newUser.isVerified,
                profileId: profileId
            }
        });

    } catch (error) {
        console.error('Google signup error:', error);
        res.status(500).json({ message: 'Server error during Google signup' });
    }
};

// Verify phone after Google signup
export const verifyGoogleSignupPhone = async (req: Request, res: Response) => {
    const { userId, otpId, otp, method } = req.body;

    try {
        if (!userId || !otpId || !otp) {
            return res.status(400).json({ message: 'User ID, OTP ID, and OTP are required' });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify OTP
        let result;
        if (method === 'whatsapp') {
            result = await verifyWhatsAppOTP(otpId, otp);
        } else {
            // Verify using OTPVerification collection
            const otpRecord = await OTPVerification.findById(otpId);
            if (!otpRecord) {
                result = { success: false, message: 'Invalid OTP request' };
            } else if (otpRecord.isVerified) {
                result = { success: false, message: 'OTP has already been verified' };
            } else if (otpRecord.otpExpiry < new Date()) {
                result = { success: false, message: 'OTP has expired' };
            } else if (otpRecord.otp !== otp) {
                result = { success: false, message: 'Invalid OTP' };
            } else {
                otpRecord.isVerified = true;
                otpRecord.verifiedAt = new Date();
                await otpRecord.save();
                result = { success: true, message: 'OTP verified successfully' };
            }
        }

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        // Update user's verification status
        user.isVerified = true;
        await user.save();

        // Create student profile
        const student = new Student({
            userId: user._id,
            email: user.email,
            phone: user.phone,
            isVerified: true
        });
        await student.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Phone verification successful. Account setup complete.',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                studentId: student._id
            }
        });

    } catch (error) {
        console.error('Google signup phone verification error:', error);
        res.status(500).json({ message: 'Server error during phone verification' });
    }
};