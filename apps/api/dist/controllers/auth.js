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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleSignupPhone = exports.googleSignup = exports.verifyOTPAndLogin = exports.forgotPassword = exports.login = exports.testLogin = exports.checkPhone = exports.checkEmail = exports.validateEmail = exports.register = exports.verifyOTPController = exports.sendOTP = exports.collegeLogin = exports.recruiterLogin = exports.studentLogin = void 0;
const User_1 = require("../models/User");
const Student_1 = require("../models/Student");
const Recruiter_1 = require("../models/Recruiter");
const College_1 = require("../models/College");
const whatsapp_1 = require("../services/whatsapp");
const emailOTP_simple_new_1 = require("../services/emailOTP_simple_new");
const smsOTP_1 = require("../services/smsOTP");
const OTPVerification_1 = require("../models/OTPVerification");
const admin_config_1 = require("../config/admin.config");
const googleAuth_1 = require("../services/googleAuth");
const axios_1 = __importDefault(require("axios"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const studentLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('Student login attempt for email:', email);
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (user.role !== 'student') {
            return res.status(403).json({
                message: 'Access denied. This login is for students only. Please use the appropriate login page for your account type.',
                redirectTo: user.role === 'recruiter' ? '/company-login' : user.role === 'college' ? '/college-login' : '/login'
            });
        }
        if (!user.password) {
            return res.status(400).json({ message: 'Please use Google Sign-in for this account' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        user.lastLogin = new Date();
        await user.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    }
    catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.studentLogin = studentLogin;
const recruiterLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('Recruiter login attempt for email:', email);
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (user.role !== 'recruiter') {
            return res.status(403).json({
                message: 'Access denied. This login is for recruiters only. Please use the appropriate login page for your account type.',
                redirectTo: user.role === 'student' ? '/login' : user.role === 'college' ? '/college-login' : '/login'
            });
        }
        if (!user.password) {
            return res.status(400).json({ message: 'Please use Google Sign-in for this account' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        user.lastLogin = new Date();
        await user.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    }
    catch (error) {
        console.error('Recruiter login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.recruiterLogin = recruiterLogin;
const collegeLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('College login attempt for email:', email);
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (!['college', 'college_admin', 'placement_officer'].includes(user.role)) {
            return res.status(403).json({
                message: 'Access denied. This login is for college administrators only. Please use the appropriate login page for your account type.',
                redirectTo: user.role === 'student' ? '/login' : user.role === 'recruiter' ? '/company-login' : '/login'
            });
        }
        if (!user.password) {
            return res.status(400).json({ message: 'Please use Google Sign-in for this account' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        user.lastLogin = new Date();
        await user.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    }
    catch (error) {
        console.error('College login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.collegeLogin = collegeLogin;
const sendOTP = async (req, res) => {
    const { phoneNumber, email, userType, preferredMethod, firstName, lastName } = req.body;
    console.log('sendOTP called with email:', email);
    try {
        if (!userType || !['student', 'college', 'recruiter'].includes(userType)) {
            return res.status(400).json({ message: 'Valid user type is required (student, college, recruiter)' });
        }
        let existingUser = null;
        if (email) {
            existingUser = await User_1.User.findOne({ email: email.toLowerCase().trim() });
        }
        if (!existingUser && phoneNumber) {
            existingUser = await User_1.User.findOne({ phone: phoneNumber.trim() });
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
            console.log(`📱 Sending OTP to student: ${phoneNumber}, preferred method: ${preferredMethod}`);
            if (preferredMethod === 'whatsapp' || !preferredMethod) {
                console.log('🔄 Attempting WhatsApp OTP via WABB webhook...');
                result = await (0, whatsapp_1.sendWhatsAppOTP)(phoneNumber, userType, fullName);
                if (!result.success) {
                    console.log('❌ WhatsApp OTP failed, falling back to SMS...');
                    console.log('WhatsApp error:', result.message);
                    const smsResult = await (0, smsOTP_1.sendSMSOTP)(phoneNumber);
                    if (smsResult.success) {
                        console.log('✅ SMS OTP fallback successful');
                        result = {
                            ...smsResult,
                            message: 'OTP sent via SMS (WhatsApp temporarily unavailable)',
                            method: 'sms_fallback'
                        };
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
                                await axios_1.default.get(fullUrl);
                                console.log('📤 SMS fallback webhook notification sent');
                            }
                            catch (webhookError) {
                                console.error('⚠️ SMS fallback webhook failed (non-critical):', webhookError);
                            }
                        }
                    }
                    else {
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
                }
                else {
                    console.log('✅ WhatsApp OTP sent successfully');
                }
            }
            else {
                console.log('📱 User chose SMS method');
                result = await (0, smsOTP_1.sendSMSOTP)(phoneNumber);
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
                        await axios_1.default.get(fullUrl);
                        console.log(`✅ Direct SMS webhook notification sent to ${fullUrl}`);
                    }
                    catch (webhookError) {
                        console.error('⚠️ Direct SMS webhook failed (non-critical):', webhookError);
                    }
                }
            }
        }
        else {
            if (!email) {
                return res.status(400).json({ message: 'Email is required for college/recruiter verification' });
            }
            result = await (0, emailOTP_simple_new_1.sendEmailOTP)(email, userType);
        }
        if (result.success) {
            const response = {
                message: result.message,
                otpId: result.otpId,
                method: result.method || (userType === 'student' && (preferredMethod === 'whatsapp' || !preferredMethod) ? 'whatsapp' : (userType === 'student' ? 'sms' : 'email'))
            };
            if ('sessionId' in result && result.sessionId) {
                response.sessionId = result.sessionId;
            }
            if ('expiresIn' in result) {
                response.expiresIn = result.expiresIn;
            }
            if ('details' in result && result.details) {
                response.fallbackUsed = true;
                response.originalError = result.details;
            }
            console.log(`📤 OTP Response:`, {
                method: response.method,
                success: true,
                otpId: response.otpId ? 'present' : 'missing'
            });
            res.status(200).json(response);
        }
        else {
            console.log(`❌ OTP Failed:`, result.message);
            res.status(400).json({
                message: result.message,
                details: result.details || undefined
            });
        }
    }
    catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Server error while sending OTP' });
    }
};
exports.sendOTP = sendOTP;
const verifyOTPController = async (req, res) => {
    const { otpId, otp, userType, method, autoLogin, phone, email } = req.body;
    try {
        if (!otpId || !otp || !userType) {
            return res.status(400).json({ message: 'OTP ID, OTP, and user type are required' });
        }
        let result;
        if (userType === 'student') {
            if (method === 'whatsapp') {
                result = await (0, whatsapp_1.verifyWhatsAppOTP)(otpId, otp);
            }
            else if (method === 'webhook') {
                const otpRecord = await OTPVerification_1.OTPVerification.findById(otpId);
                if (!otpRecord) {
                    result = { success: false, message: 'Invalid OTP request' };
                }
                else if (otpRecord.isVerified) {
                    result = { success: false, message: 'OTP has already been verified' };
                }
                else if (otpRecord.otpExpiry < new Date()) {
                    result = { success: false, message: 'OTP has expired' };
                }
                else if (otpRecord.otp !== otp) {
                    result = { success: false, message: 'Invalid OTP' };
                }
                else {
                    otpRecord.isVerified = true;
                    otpRecord.verifiedAt = new Date();
                    await otpRecord.save();
                    result = { success: true, message: 'OTP verified successfully', phoneNumber: otpRecord.phoneNumber, userType: otpRecord.userType };
                }
            }
            else {
                result = await (0, smsOTP_1.verifySMSOTP)(otpId, otp);
            }
        }
        else {
            result = await (0, emailOTP_simple_new_1.verifyEmailOTP)(otpId, otp);
        }
        if (result.success) {
            const response = {
                message: result.message,
                verified: true
            };
            if ('phoneNumber' in result && result.phoneNumber) {
                response.phoneNumber = result.phoneNumber;
            }
            if ('userType' in result && result.userType) {
                response.userType = result.userType;
            }
            if (autoLogin) {
                let user = null;
                if (userType === 'student' && (phone || response.phoneNumber)) {
                    const phoneNumberToUse = phone || response.phoneNumber;
                    user = await User_1.User.findOne({ phone: phoneNumberToUse });
                }
                else if ((userType === 'college' || userType === 'recruiter') && email) {
                    console.log('Looking for user by email:', email);
                    user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
                    if (!user && userType === 'college') {
                        const college = await Promise.resolve().then(() => __importStar(require('../models/College'))).then(mod => mod.College.findOne({
                            'primaryContact.email': email.toLowerCase().trim()
                        }));
                        if (college && college.userId) {
                            user = await User_1.User.findById(college.userId);
                        }
                    }
                    if (!user && userType === 'recruiter') {
                        const recruiter = await Promise.resolve().then(() => __importStar(require('../models/Recruiter'))).then(mod => mod.Recruiter.findOne({
                            userId: { $exists: true }
                        }).where('recruiterProfile.email').equals(email.toLowerCase().trim()));
                        if (recruiter && recruiter.userId) {
                            user = await User_1.User.findById(recruiter.userId);
                        }
                    }
                }
                if (user) {
                    let studentId = null;
                    if (user.role === 'student') {
                        const student = await Promise.resolve().then(() => __importStar(require('../models/Student'))).then(mod => mod.Student.findOne({ userId: user._id }).lean());
                        if (student) {
                            studentId = student._id.toString();
                        }
                    }
                    const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
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
        }
        else {
            res.status(400).json({ message: result.message, verified: false });
        }
    }
    catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error while verifying OTP' });
    }
};
exports.verifyOTPController = verifyOTPController;
const register = async (req, res) => {
    const { email, password, role, phoneNumber, otpId, profileData, userType } = req.body;
    try {
        console.log('🔍 REGISTRATION DEBUG START');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Email:', email);
        console.log('Password present:', !!password);
        console.log('Role:', role);
        console.log('Phone:', phoneNumber);
        console.log('Profile data:', JSON.stringify(profileData, null, 2));
        console.log('🔍 REGISTRATION DEBUG END');
        if (!email || !password || !role) {
            console.log('❌ Validation failed - missing basic fields:', {
                email: !!email,
                password: !!password,
                role: !!role
            });
            return res.status(400).json({ message: 'Email, password, and role are required' });
        }
        if (role === 'student') {
            if (!phoneNumber) {
                return res.status(400).json({ message: 'Phone number is required for student registration' });
            }
        }
        if ((role === 'college' || role === 'recruiter') && !email) {
            return res.status(400).json({ message: 'Email is required for college/recruiter registration' });
        }
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
        const existingUserByEmail = await User_1.User.findOne({ email: email.toLowerCase().trim() });
        if (existingUserByEmail) {
            console.warn(`Registration attempt with existing email: ${email.toLowerCase().trim()}, role: ${role}`);
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        if (phoneNumber) {
            const existingUserByPhone = await User_1.User.findOne({ phone: phoneNumber.trim() });
            if (existingUserByPhone) {
                console.warn(`Registration attempt with existing phone number: ${phoneNumber.trim()}, role: ${role}`);
                return res.status(400).json({ message: 'User already exists with this phone number' });
            }
        }
        console.log('Registering user with email:', email ? email.toLowerCase().trim() : 'No email provided');
        console.log('Profile data received:', profileData);
        console.log('Email before saving user:', email);
        if (otpId) {
            let otpStatus;
            if (role === 'student') {
                otpStatus = await (0, smsOTP_1.getSMSOTPStatus)(phoneNumber);
            }
            else {
                otpStatus = { isVerified: true };
            }
            if (!otpStatus.isVerified) {
                return res.status(400).json({ message: 'Verification required. Please verify your contact information first.' });
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = new User_1.User({
            email: email ? email.toLowerCase().trim() : undefined,
            password: hashedPassword,
            role,
            phone: phoneNumber,
            isVerified: !!otpId
        });
        console.log('New user object before save:', newUser);
        await newUser.save();
        console.log('New user saved:', newUser);
        console.log('Saved user email:', newUser.email);
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
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
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
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            if (error.name === 'ValidationError') {
                console.error('MongoDB validation error details:', error);
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                return res.status(400).json({
                    message: 'Validation failed',
                    errors: validationErrors,
                    details: error.message
                });
            }
            if (error.name === 'MongoServerError' && error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[0];
                return res.status(400).json({
                    message: `${field} already exists`,
                    error: 'DUPLICATE_KEY'
                });
            }
            res.status(500).json({ message: `Server error during registration: ${error.message}` });
        }
        else {
            console.error('Unknown error type:', typeof error, error);
            res.status(500).json({ message: 'Server error during registration' });
        }
    }
};
exports.register = register;
const createStudentProfile = async (userId, profileData, email) => {
    const profile = profileData || {};
    let collegeId = profile.collegeId && profile.collegeId.trim() !== '' ? profile.collegeId : null;
    if (!collegeId) {
        try {
            const firstCollege = await College_1.College.findOne({});
            collegeId = firstCollege ? firstCollege._id : null;
        }
        catch (error) {
            console.error('Error fetching default college:', error);
        }
    }
    if (!collegeId) {
        console.warn('No college selected or available - student profile created without college assignment');
    }
    const studentData = {
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
    if (collegeId) {
        studentData.collegeId = collegeId;
    }
    const student = new Student_1.Student(studentData);
    await student.save();
    return student._id;
};
const createRecruiterProfile = async (userId, profileData) => {
    try {
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
        const recruiter = new Recruiter_1.Recruiter(recruiterData);
        await recruiter.save();
        return recruiter._id;
    }
    catch (error) {
        console.error('Error creating recruiter profile:', error);
        throw error;
    }
};
const createCollegeProfile = async (userId, profileData) => {
    const profile = profileData || {};
    const collegeData = {
        userId,
        name: profile.collegeName || '',
        shortName: profile.shortName || (profile.collegeName ? profile.collegeName.split(' ').map((word) => word[0]).join('').toUpperCase() : ''),
        domainCode: profile.domainCode || generateDomainCode(profile.collegeName),
        website: profile.website || '',
        logo: profile.logo || '',
        address: {
            street: profile.address || profile.street || '',
            city: profile.city || '',
            state: profile.state || profile.location || '',
            zipCode: profile.pincode || profile.zipCode || '',
            country: profile.country || 'India'
        },
        primaryContact: {
            name: profile.coordinatorName || profile.contactName || '',
            designation: profile.coordinatorDesignation || profile.contactDesignation || '',
            email: profile.coordinatorEmail || profile.contactEmail || profile.email || '',
            phone: profile.coordinatorNumber || profile.contactPhone || profile.mobile || ''
        },
        placementContact: profile.placementContact ? {
            name: profile.placementContact.name,
            designation: profile.placementContact.designation,
            email: profile.placementContact.email,
            phone: profile.placementContact.phone
        } : undefined,
        establishedYear: profile.establishedYear ? Number(profile.establishedYear) : new Date().getFullYear(),
        affiliation: profile.affiliatedTo || profile.affiliation || '',
        collegeType: profile.collegeType || '',
        recognizedBy: profile.recognizedBy || '',
        aboutCollege: profile.aboutCollege || '',
        location: profile.location || '',
        landmark: profile.landmark || '',
        accreditation: profile.accreditation || [],
        courses: [],
        departments: profile.departments || ['General'],
        students: [],
        approvedRecruiters: [],
        pendingRecruiters: [],
        placementStats: [],
        isPlacementActive: profile.isPlacementActive !== undefined ? profile.isPlacementActive : true,
        placementCriteria: profile.placementCriteria || {
            minimumCGPA: 6.0,
            allowedBranches: [],
            noOfBacklogs: 0
        },
        isVerified: false,
        verificationDocuments: [],
        isActive: true,
        approvalStatus: 'pending',
        allowDirectApplications: profile.allowDirectApplications !== undefined ? profile.allowDirectApplications : false
    };
    const college = new College_1.College(collegeData);
    await college.save();
    console.log('College profile created:', {
        collegeId: college._id,
        name: college.name,
        domainCode: college.domainCode,
        approvalStatus: college.approvalStatus
    });
    return college._id;
};
const calculateStudentProfileCompleteness = (profileData) => {
    const profile = profileData || {};
    let completeness = 0;
    const fields = [
        'firstName', 'lastName', 'collegeId', 'studentId', 'enrollmentYear',
        'skills', 'education', 'jobPreferences'
    ];
    fields.forEach(field => {
        if (profile[field] &&
            (Array.isArray(profile[field]) ? profile[field].length > 0 : true)) {
            completeness += 12.5;
        }
    });
    return Math.round(completeness);
};
const generateDomainCode = (collegeName) => {
    if (!collegeName)
        return 'COL' + Date.now();
    return collegeName
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 6) + Math.floor(Math.random() * 1000);
};
const express_validator_1 = require("express-validator");
exports.validateEmail = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
const checkEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            return res.status(200).json({ available: false, message: 'Email is already taken' });
        }
        else {
            return res.status(200).json({ available: true, message: 'Email is available' });
        }
    }
    catch (error) {
        console.error('Check email error:', error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        return res.status(500).json({ message: 'Server error while checking email' });
    }
};
exports.checkEmail = checkEmail;
const checkPhone = async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }
    try {
        const user = await User_1.User.findOne({ phone: phone.trim() });
        if (user) {
            return res.status(200).json({ available: false, message: 'Phone number is already taken' });
        }
        else {
            return res.status(200).json({ available: true, message: 'Phone number is available' });
        }
    }
    catch (error) {
        console.error('Check phone error:', error);
        return res.status(500).json({ message: 'Server error while checking phone number' });
    }
};
exports.checkPhone = checkPhone;
const testLogin = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.testLogin = testLogin;
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('Login attempt for email:', email);
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }
        console.log('Checking admin credentials...');
        const adminConfig = (0, admin_config_1.getAdminConfig)();
        if (email === adminConfig.email && password === adminConfig.password) {
            console.log('Admin login successful');
            const token = jsonwebtoken_1.default.sign({
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
        const user = await User_1.User.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log('User found, verifying password...');
        if (!user.password) {
            console.log('User has no password set (possibly Google auth user)');
            return res.status(400).json({ message: 'Please use Google Sign-in for this account' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log('Password verified, updating last login...');
        user.lastLogin = new Date();
        if (['student', 'college_admin', 'placement_officer'].includes(user.role) && !user.tenantId) {
            console.log('Setting default tenantId for user role:', user.role);
            user.tenantId = new mongoose_1.default.Types.ObjectId();
        }
        try {
            await user.save();
        }
        catch (saveError) {
            console.error('Error saving user during login:', saveError);
            console.log('Continuing login despite save error...');
        }
        console.log('Generating JWT token...');
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
        });
    }
};
exports.login = login;
const forgotPassword = async (req, res) => {
    const { phone, email, preferredMethod } = req.body;
    try {
        let user;
        if (preferredMethod === 'email') {
            if (!email) {
                return res.status(400).json({ message: 'Email is required for email OTP' });
            }
            console.log('Looking up user by email:', email.toLowerCase().trim());
            const allUsers = await User_1.User.find({}, { email: 1 }).lean();
            console.log('All user emails in DB:', allUsers.map(u => u.email));
            user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
            if (!user) {
                const student = await Promise.resolve().then(() => __importStar(require('../models/Student'))).then(mod => mod.Student.findOne({ email: email.toLowerCase().trim() }));
                console.log('Student found by email:', student);
                if (student) {
                    user = await User_1.User.findById(student.userId);
                    console.log('User found by student userId:', user);
                }
            }
            if (!user) {
                return res.status(404).json({ message: 'No account found with this email' });
            }
            if (!user.isVerified) {
                return res.status(400).json({ message: 'Email is not verified. Please verify your email first.' });
            }
            console.log('User found and verified:', user);
        }
        else {
            if (!phone) {
                return res.status(400).json({ message: 'Phone number is required for phone OTP' });
            }
            user = await User_1.User.findOne({ phone });
            if (!user) {
                return res.status(404).json({ message: 'No account found with this phone number' });
            }
        }
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let otpRequestCount;
        if (preferredMethod === 'email') {
            otpRequestCount = await OTPVerification_1.OTPVerification.countDocuments({
                email: email.toLowerCase().trim(),
                createdAt: { $gte: twentyFourHoursAgo }
            });
        }
        else {
            otpRequestCount = await OTPVerification_1.OTPVerification.countDocuments({
                phoneNumber: phone,
                createdAt: { $gte: twentyFourHoursAgo }
            });
        }
        if (otpRequestCount >= 3) {
            return res.status(429).json({ message: 'Maximum OTP requests reached. Please try again later.' });
        }
        if (preferredMethod === 'email') {
            const emailUserRole = user.role === 'recruiter' ? 'recruiter' : 'college';
            const result = await (0, emailOTP_simple_new_1.sendEmailOTP)(email.toLowerCase().trim(), emailUserRole);
            if (result.success) {
                return res.status(200).json({
                    message: 'OTP has been sent to your email address',
                    otpId: result.otpId,
                    method: 'email',
                    expiresIn: result.expiresIn || '10 minutes'
                });
            }
            else {
                return res.status(400).json({ message: result.message || 'Failed to send email OTP' });
            }
        }
        else {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            const otpVerification = new OTPVerification_1.OTPVerification({
                phoneNumber: phone,
                userType: user.role,
                otp: otp,
                otpExpiry: otpExpiry,
                isVerified: false,
                attempts: 0,
                maxAttempts: 3
            });
            await otpVerification.save();
            const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/4nVuxt446PLJ/';
            const params = new URLSearchParams({
                Number: phone,
                OTP: otp
            });
            const fullUrl = `${webhookUrl}?${params.toString()}`;
            try {
                await axios_1.default.get(fullUrl);
                console.log(`Webhook request sent successfully to ${fullUrl}`);
            }
            catch (webhookError) {
                console.error('Error sending webhook request:', webhookError);
            }
            return res.status(200).json({
                message: 'OTP has been sent to your phone number',
                otpId: otpVerification._id.toString(),
                method: 'webhook',
                expiresIn: '10 minutes'
            });
        }
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error while processing forgot password' });
    }
};
exports.forgotPassword = forgotPassword;
const verifyOTPAndLogin = async (req, res) => {
    const { otpId, otp, userType, method, phone, email } = req.body;
    try {
        if (!otpId || !otp || !userType || (!phone && !email)) {
            return res.status(400).json({ message: 'OTP ID, OTP, user type, and phone or email are required' });
        }
        let result;
        if (userType === 'student') {
            if (method === 'whatsapp') {
                result = await (0, whatsapp_1.verifyWhatsAppOTP)(otpId, otp);
            }
            else if (method === 'webhook') {
                const otpRecord = await OTPVerification_1.OTPVerification.findById(otpId);
                if (!otpRecord) {
                    result = { success: false, message: 'Invalid OTP request' };
                }
                else if (otpRecord.isVerified) {
                    result = { success: false, message: 'OTP has already been verified' };
                }
                else if (otpRecord.otpExpiry < new Date()) {
                    result = { success: false, message: 'OTP has expired' };
                }
                else if (otpRecord.otp !== otp) {
                    result = { success: false, message: 'Invalid OTP' };
                }
                else {
                    otpRecord.isVerified = true;
                    otpRecord.verifiedAt = new Date();
                    await otpRecord.save();
                    result = { success: true, message: 'OTP verified successfully', phoneNumber: otpRecord.phoneNumber, userType: otpRecord.userType };
                }
            }
            else {
                result = await (0, smsOTP_1.verifySMSOTP)(otpId, otp);
            }
        }
        else {
            result = await (0, emailOTP_simple_new_1.verifyEmailOTP)(otpId, otp);
        }
        if (result.success) {
            let user;
            if (userType === 'student') {
                user = await User_1.User.findOne({ phone });
            }
            else {
                user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
            }
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            console.log('User found for OTP verification:', user);
            let studentId = null;
            if (user.role === 'student') {
                const student = await Promise.resolve().then(() => __importStar(require('../models/Student'))).then(mod => mod.Student.findOne({ userId: user._id }).lean());
                if (student) {
                    studentId = student._id.toString();
                }
            }
            console.log('User role:', user.role);
            console.log('Student ID:', studentId);
            const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
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
        }
        else {
            res.status(400).json({ message: result.message, verified: false });
        }
    }
    catch (error) {
        console.error('Verify OTP and login error:', error);
        res.status(500).json({ message: 'Server error while verifying OTP and logging in' });
    }
};
exports.verifyOTPAndLogin = verifyOTPAndLogin;
const googleSignup = async (req, res) => {
    const { idToken, phone, userType = 'student' } = req.body;
    try {
        if (!idToken) {
            return res.status(400).json({ message: 'Google ID token is required' });
        }
        if (userType === 'student' && !phone) {
            return res.status(400).json({ message: 'Phone number is required for student registration' });
        }
        const googleAuthResult = await (0, googleAuth_1.verifyGoogleToken)(idToken);
        if (!googleAuthResult.success) {
            return res.status(400).json({ message: googleAuthResult.message });
        }
        const { user: googleUser } = googleAuthResult;
        if (!googleUser) {
            return res.status(400).json({ message: 'Failed to get user information from Google' });
        }
        const existingUser = await User_1.User.findOne({
            $or: [
                { email: googleUser.email },
                { googleId: googleUser.googleId }
            ]
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or Google account' });
        }
        if (userType === 'student' && phone) {
            const existingUserByPhone = await User_1.User.findOne({ phone: phone.trim() });
            if (existingUserByPhone) {
                return res.status(400).json({ message: 'User already exists with this phone number' });
            }
        }
        const newUser = new User_1.User({
            email: googleUser.email,
            googleId: googleUser.googleId,
            role: userType,
            phone: userType === 'student' ? phone : undefined,
            isVerified: googleUser.emailVerified,
            name: googleUser.name,
            profilePicture: googleUser.picture
        });
        await newUser.save();
        if (userType === 'student' && phone) {
            const otpResult = await (0, whatsapp_1.sendWhatsAppOTP)(phone, 'student');
            if (otpResult.success) {
                return res.status(200).json({
                    message: 'Google account linked successfully. Please verify your phone number.',
                    userId: newUser._id,
                    email: newUser.email,
                    requiresPhoneVerification: true,
                    otpId: otpResult.otpId,
                    phone: phone
                });
            }
            else {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
                const otpVerification = new OTPVerification_1.OTPVerification({
                    phoneNumber: phone,
                    userType: 'student',
                    otp: otp,
                    otpExpiry: otpExpiry,
                    isVerified: false,
                    attempts: 0,
                    maxAttempts: 3
                });
                await otpVerification.save();
                const webhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/4nVuxt446PLJ/';
                const params = new URLSearchParams({
                    Number: phone,
                    OTP: otp
                });
                try {
                    await axios_1.default.get(`${webhookUrl}?${params.toString()}`);
                    console.log('Webhook OTP sent successfully for Google signup');
                }
                catch (webhookError) {
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
        let profileId;
        switch (userType) {
            case 'college':
                const college = new College_1.College({
                    userId: newUser._id,
                    name: googleUser.name,
                    email: googleUser.email,
                    isVerified: true
                });
                await college.save();
                profileId = college._id;
                break;
            case 'recruiter':
                const recruiter = new Recruiter_1.Recruiter({
                    userId: newUser._id,
                    name: googleUser.name,
                    email: googleUser.email,
                    isVerified: true
                });
                await recruiter.save();
                profileId = recruiter._id;
                break;
        }
        const token = jsonwebtoken_1.default.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Google signup error:', error);
        res.status(500).json({ message: 'Server error during Google signup' });
    }
};
exports.googleSignup = googleSignup;
const verifyGoogleSignupPhone = async (req, res) => {
    const { userId, otpId, otp, method } = req.body;
    try {
        if (!userId || !otpId || !otp) {
            return res.status(400).json({ message: 'User ID, OTP ID, and OTP are required' });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let result;
        if (method === 'whatsapp') {
            result = await (0, whatsapp_1.verifyWhatsAppOTP)(otpId, otp);
        }
        else {
            const otpRecord = await OTPVerification_1.OTPVerification.findById(otpId);
            if (!otpRecord) {
                result = { success: false, message: 'Invalid OTP request' };
            }
            else if (otpRecord.isVerified) {
                result = { success: false, message: 'OTP has already been verified' };
            }
            else if (otpRecord.otpExpiry < new Date()) {
                result = { success: false, message: 'OTP has expired' };
            }
            else if (otpRecord.otp !== otp) {
                result = { success: false, message: 'Invalid OTP' };
            }
            else {
                otpRecord.isVerified = true;
                otpRecord.verifiedAt = new Date();
                await otpRecord.save();
                result = { success: true, message: 'OTP verified successfully' };
            }
        }
        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }
        user.isVerified = true;
        await user.save();
        const student = new Student_1.Student({
            userId: user._id,
            email: user.email,
            phone: user.phone,
            isVerified: true
        });
        await student.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Google signup phone verification error:', error);
        res.status(500).json({ message: 'Server error during phone verification' });
    }
};
exports.verifyGoogleSignupPhone = verifyGoogleSignupPhone;
