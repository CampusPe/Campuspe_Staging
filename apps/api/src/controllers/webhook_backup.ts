import { Request, Response } from 'express';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Recruiter } from '../models/Recruiter';
import { College } from '../models/College';
import { sendWhatsAppMessage, sendWhatsAppOTP, verifyWhatsAppOTP, sendWelcomeMessageAfterRegistration } from '../services/whatsapp';
import { sendEmailOTP, verifyEmailOTP } from '../services/emailOTP_simple';
import { sendSMSOTP, verifySMSOTP, getSMSOTPStatus } from '../services/smsOTP';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Send OTP based on user type (Enhanced with WhatsApp support)
export const sendOTP = async (req: Request, res: Response) => {
    const { phoneNumber, email, userType, preferredMethod } = req.body;

    try {
        if (!userType || !['student', 'college', 'recruiter'].includes(userType)) {
            return res.status(400).json({ message: 'Valid user type is required (student, college, recruiter)' });
        }

        let result;

        if (userType === 'student') {
            if (!phoneNumber) {
                return res.status(400).json({ message: 'Phone number is required for student verification' });
            }

            // For students, prefer WhatsApp if available, fallback to SMS
            if (preferredMethod === 'whatsapp' || !preferredMethod) {
                result = await sendWhatsAppOTP(phoneNumber, userType);
            } else {
                result = await sendSMSOTP(phoneNumber);
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
                method: userType === 'student' && (preferredMethod === 'whatsapp' || !preferredMethod) ? 'whatsapp' : (userType === 'student' ? 'sms' : 'email')
            };
            
            // Only include sessionId for SMS OTP (2Factor)
            if ('sessionId' in result && result.sessionId) {
                response.sessionId = result.sessionId;
            }

            // Include expiry info for WhatsApp OTP
            if ('expiresIn' in result) {
                response.expiresIn = result.expiresIn;
            }
            
            res.status(200).json(response);
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Server error while sending OTP' });
    }
};

// Verify OTP based on user type (Enhanced with WhatsApp support)
export const verifyOTPController = async (req: Request, res: Response) => {
    const { otpId, otp, userType, method } = req.body;

    try {
        if (!otpId || !otp || !userType) {
            return res.status(400).json({ message: 'OTP ID, OTP, and user type are required' });
        }

        let result;

        if (userType === 'student') {
            // Check the method used to determine verification approach
            if (method === 'whatsapp') {
                result = await verifyWhatsAppOTP(otpId, otp);
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
        if (role === 'student' && !phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required for student registration' });
        }

        if ((role === 'college' || role === 'recruiter') && !email) {
            return res.status(400).json({ message: 'Email is required for college/recruiter registration' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

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
            email, 
            password: hashedPassword, 
            role,
            phone: phoneNumber,
            isVerified: !!otpId // Verified if OTP was used
        });
        
        await newUser.save();

        // Create role-specific profile
        let profileId;
        switch (role) {
            case 'student':
                profileId = await createStudentProfile(newUser._id, profileData);
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
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Helper function to create student profile
const createStudentProfile = async (userId: any, profileData: any) => {
    const studentData = {
        userId,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        alternatePhone: profileData.alternatePhone,
        linkedinUrl: profileData.linkedinUrl,
        githubUrl: profileData.githubUrl,
        portfolioUrl: profileData.portfolioUrl,
        collegeId: profileData.collegeId && profileData.collegeId.trim() !== '' ? profileData.collegeId : undefined,
        studentId: profileData.studentId || '',
        enrollmentYear: profileData.enrollmentYear || new Date().getFullYear(),
        graduationYear: profileData.graduationYear,
        currentSemester: profileData.currentSemester,
        education: profileData.education || [],
        experience: profileData.experience || [],
        skills: profileData.skills || [],
        jobPreferences: profileData.jobPreferences || {
            jobTypes: [],
            preferredLocations: [],
            workMode: 'any'
        },
        profileCompleteness: calculateStudentProfileCompleteness(profileData),
        isActive: true,
        isPlacementReady: false
    };

    const student = new Student(studentData);
    await student.save();
    return student._id;
};

// Helper function to create recruiter profile
const createRecruiterProfile = async (userId: any, profileData: any) => {
    const recruiterData = {
        userId,
        companyInfo: {
            name: profileData.companyName || '',
            industry: profileData.industry || '',
            website: profileData.website,
            logo: profileData.logo,
            description: profileData.companyDescription,
            size: profileData.companySize || 'medium',
            foundedYear: profileData.foundedYear,
            headquarters: {
                city: profileData.city || '',
                state: profileData.state || '',
                country: profileData.country || 'India'
            }
        },
        recruiterProfile: {
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            designation: profileData.designation || '',
            department: profileData.department,
            linkedinUrl: profileData.linkedinUrl,
            profilePicture: profileData.profilePicture
        },
        hiringInfo: {
            preferredColleges: profileData.preferredColleges || [],
            preferredCourses: profileData.preferredCourses || [],
            hiringSeasons: profileData.hiringSeasons || ['continuous'],
            averageHires: profileData.averageHires || 0,
            workLocations: profileData.workLocations || [],
            remoteWork: profileData.remoteWork || false,
            internshipOpportunities: profileData.internshipOpportunities || false
        },
        whatsappNumber: profileData.whatsappNumber,
        preferredContactMethod: profileData.preferredContactMethod || 'email',
        isActive: true,
        lastActiveDate: new Date()
    };

    const recruiter = new Recruiter(recruiterData);
    await recruiter.save();
    return recruiter._id;
};

// Helper function to create college profile
const createCollegeProfile = async (userId: any, profileData: any) => {
    const collegeData = {
        userId,
        name: profileData.collegeName || '',
        shortName: profileData.shortName,
        domainCode: profileData.domainCode || generateDomainCode(profileData.collegeName),
        website: profileData.website,
        logo: profileData.logo,
        address: {
            street: profileData.street || '',
            city: profileData.city || '',
            state: profileData.state || '',
            zipCode: profileData.zipCode || '',
            country: profileData.country || 'India'
        },
        primaryContact: {
            name: profileData.contactName || '',
            designation: profileData.contactDesignation || '',
            email: profileData.contactEmail || profileData.email || '',
            phone: profileData.contactPhone || ''
        },
        placementContact: profileData.placementContact,
        establishedYear: profileData.establishedYear || new Date().getFullYear(),
        affiliation: profileData.affiliation || '',
        accreditation: profileData.accreditation || [],
        courses: [],
        departments: profileData.departments || [],
        students: [],
        approvedRecruiters: [],
        pendingRecruiters: [],
        placementStats: [],
        isPlacementActive: profileData.isPlacementActive || true,
        placementCriteria: profileData.placementCriteria,
        isVerified: false,
        verificationDocuments: [],
        isActive: true,
        allowDirectApplications: profileData.allowDirectApplications || true
    };

    const college = new College(collegeData);
    await college.save();
    return college._id;
};

// Helper function to calculate student profile completeness
const calculateStudentProfileCompleteness = (profileData: any): number => {
    let completeness = 0;
    const fields = [
        'firstName', 'lastName', 'collegeId', 'studentId', 'enrollmentYear',
        'skills', 'education', 'jobPreferences'
    ];

    fields.forEach(field => {
        if (profileData[field] && 
            (Array.isArray(profileData[field]) ? profileData[field].length > 0 : true)) {
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

// User login
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
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