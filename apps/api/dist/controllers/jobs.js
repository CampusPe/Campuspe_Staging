"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobNotificationHistory = exports.sendWhatsAppToStudents = exports.triggerJobAlerts = exports.findMatchingStudents = exports.getJobMatchingStats = exports.publishJob = exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getAllJobs = void 0;
const Job_1 = require("../models/Job");
const mongoose_1 = require("mongoose");
const job_posting_1 = __importDefault(require("../services/job-posting"));
const career_alerts_1 = __importDefault(require("../services/career-alerts"));
const ai_matching_1 = __importDefault(require("../services/ai-matching"));
const getAllJobs = async (req, res) => {
    try {
        const { recruiterId } = req.query;
        let filter = {};
        if (recruiterId) {
            filter = { recruiterId: new mongoose_1.Types.ObjectId(recruiterId) };
        }
        const jobs = await Job_1.Job.find(filter)
            .populate('recruiterId', 'companyInfo.name')
            .sort({ createdAt: -1 });
        res.status(200).json(jobs);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllJobs = getAllJobs;
const getJobById = async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await Job_1.Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(job);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getJobById = getJobById;
const createJob = async (req, res) => {
    const jobData = req.body;
    const user = req.user;
    let recruiterId;
    try {
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId: user._id });
        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Recruiter profile not found. Please complete your recruiter registration first.'
            });
        }
        recruiterId = recruiter._id;
    }
    catch (error) {
        console.error('Error finding recruiter:', error);
        return res.status(500).json({
            success: false,
            message: 'Error finding recruiter profile'
        });
    }
    jobData.recruiterId = recruiterId;
    const validateJobData = (data) => {
        const errors = [];
        if (!data.title || typeof data.title !== 'string')
            errors.push('Invalid or missing title');
        if (!data.description || typeof data.description !== 'string')
            errors.push('Invalid or missing description');
        if (!data.companyName || typeof data.companyName !== 'string')
            errors.push('Invalid or missing companyName');
        if (!data.locations || !Array.isArray(data.locations) || data.locations.length === 0)
            errors.push('Invalid or missing locations');
        if (!data.workMode || !['remote', 'onsite', 'hybrid'].includes(data.workMode))
            errors.push('Invalid or missing workMode');
        if (!data.jobType || !['full-time', 'part-time', 'internship', 'contract', 'freelance'].includes(data.jobType))
            errors.push('Invalid or missing jobType');
        if (!data.department || typeof data.department !== 'string')
            errors.push('Invalid or missing department');
        if (!data.experienceLevel || !['entry', 'mid', 'senior', 'lead', 'executive'].includes(data.experienceLevel))
            errors.push('Invalid or missing experienceLevel');
        if (typeof data.minExperience !== 'number' || data.minExperience < 0)
            errors.push('Invalid or missing minExperience');
        if (data.maxExperience !== undefined && (typeof data.maxExperience !== 'number' || data.maxExperience < 0))
            errors.push('Invalid maxExperience');
        if (!data.salary || typeof data.salary !== 'object')
            errors.push('Invalid or missing salary');
        else {
            if (typeof data.salary.min !== 'number' || data.salary.min < 0)
                errors.push('Invalid salary.min');
            if (typeof data.salary.max !== 'number' || data.salary.max < 0)
                errors.push('Invalid salary.max');
            if (!data.salary.currency || typeof data.salary.currency !== 'string')
                errors.push('Invalid salary.currency');
        }
        if (!data.applicationDeadline || isNaN(Date.parse(data.applicationDeadline)))
            errors.push('Invalid or missing applicationDeadline');
        if (typeof data.totalPositions !== 'number' || data.totalPositions < 1)
            errors.push('Invalid or missing totalPositions');
        if (!data.interviewProcess || typeof data.interviewProcess !== 'object')
            errors.push('Invalid or missing interviewProcess');
        else {
            if (!Array.isArray(data.interviewProcess.rounds))
                errors.push('Invalid interviewProcess.rounds');
            if (typeof data.interviewProcess.duration !== 'string')
                errors.push('Invalid interviewProcess.duration');
            if (!['online', 'offline', 'hybrid'].includes(data.interviewProcess.mode))
                errors.push('Invalid interviewProcess.mode');
        }
        return errors;
    };
    const errors = validateJobData(jobData);
    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: 'Validation errors', errors });
    }
    try {
        console.log('Creating job with data:', jobData);
        try {
            const newJob = await job_posting_1.default.createIntelligentJob(jobData);
            return res.status(201).json({
                success: true,
                message: 'Job posted successfully! Our AI will automatically analyze the description, extract key skills, and match it with qualified students. Matching students will receive personalized WhatsApp notifications.',
                data: newJob
            });
        }
        catch (aiError) {
            console.warn('AI job creation failed, falling back to basic creation:', aiError);
            const newJob = new Job_1.Job({
                ...jobData,
                status: 'active',
                postedAt: new Date(),
                lastModified: new Date(),
                views: 0,
                applications: []
            });
            const savedJob = await newJob.save();
            console.log('Job created successfully with basic method:', savedJob._id);
            try {
                console.log(`🚀 Triggering AI matching for basic job: ${savedJob._id}`);
                await career_alerts_1.default.processNewJobPosting(savedJob._id);
            }
            catch (matchingError) {
                console.error('Failed to trigger matching for basic job:', matchingError);
            }
            return res.status(201).json({
                success: true,
                message: 'Job created successfully with automatic AI matching enabled',
                data: savedJob
            });
        }
    }
    catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create job',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createJob = createJob;
const updateJob = async (req, res) => {
    const { jobId } = req.params;
    const { title, description, jobType, department, recruiterId, companyName, locations, workMode, requirements, experienceLevel, minExperience, maxExperience, educationRequirements, salary, benefits, applicationDeadline, totalPositions, filledPositions, targetColleges, targetCourses, allowDirectApplications, interviewProcess, status, isUrgent, matchingKeywords, } = req.body;
    try {
        const updatedJob = await Job_1.Job.findByIdAndUpdate(jobId, {
            title,
            description,
            jobType,
            department,
            recruiterId,
            companyName,
            locations,
            workMode,
            requirements,
            experienceLevel,
            minExperience,
            maxExperience,
            educationRequirements,
            salary,
            benefits,
            applicationDeadline,
            totalPositions,
            filledPositions,
            targetColleges,
            targetCourses,
            allowDirectApplications,
            interviewProcess,
            status,
            isUrgent,
            matchingKeywords,
            lastModified: new Date(),
        }, { new: true });
        if (!updatedJob) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(updatedJob);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateJob = updateJob;
const deleteJob = async (req, res) => {
    const { jobId } = req.params;
    try {
        const deletedJob = await Job_1.Job.findByIdAndDelete(jobId);
        if (!deletedJob) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json({ message: 'Job deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteJob = deleteJob;
const publishJob = async (req, res) => {
    const { jobId } = req.params;
    try {
        await job_posting_1.default.publishJob(new mongoose_1.Types.ObjectId(jobId));
        res.status(200).json({
            success: true,
            message: 'Job published successfully and matching process initiated'
        });
    }
    catch (error) {
        console.error('Error publishing job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish job',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.publishJob = publishJob;
const getJobMatchingStats = async (req, res) => {
    const { jobId } = req.params;
    try {
        const stats = await job_posting_1.default.getJobMatchingStats(new mongoose_1.Types.ObjectId(jobId));
        res.status(200).json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error getting job matching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get matching statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getJobMatchingStats = getJobMatchingStats;
const findMatchingStudents = async (req, res) => {
    const { jobId } = req.params;
    const { threshold = 0.70, limit = 50, includeDetails = true } = req.query;
    try {
        const matches = await ai_matching_1.default.findMatchingStudents(new mongoose_1.Types.ObjectId(jobId), parseFloat(threshold));
        const limitedMatches = matches.slice(0, parseInt(limit));
        if (includeDetails === 'true') {
            const { Student } = require('../models');
            const enrichedMatches = await Promise.all(limitedMatches.map(async (match) => {
                const student = await Student.findById(match.studentId)
                    .populate('userId', 'email phone whatsappNumber')
                    .populate('collegeId', 'name shortName')
                    .lean();
                if (!student) {
                    console.warn(`Student ${match.studentId} not found`);
                    return null;
                }
                let email = '';
                let phone = '';
                let whatsappNumber = '';
                if (student.userId && typeof student.userId === 'object') {
                    email = student.userId.email || '';
                    phone = student.userId.phone || '';
                    whatsappNumber = student.userId.whatsappNumber || student.userId.phone || '';
                }
                if (!phone || !email) {
                    email = email || student.email || '';
                    phone = phone || student.phoneNumber || student.phone || '';
                    whatsappNumber = whatsappNumber || student.whatsappNumber || phone;
                }
                if (!phone) {
                    phone = student.contactNumber || student.mobile || '';
                    whatsappNumber = whatsappNumber || phone;
                }
                console.log(`📋 Enhanced Contact Data for ${student.firstName} ${student.lastName}:`, {
                    hasUserId: !!student.userId,
                    userEmail: student.userId?.email || 'N/A',
                    userPhone: student.userId?.phone || 'N/A',
                    userWhatsapp: student.userId?.whatsappNumber || 'N/A',
                    studentEmail: student.email || 'N/A',
                    studentPhone: student.phoneNumber || 'N/A',
                    studentWhatsapp: student.whatsappNumber || 'N/A',
                    finalEmail: email,
                    finalPhone: phone,
                    finalWhatsapp: whatsappNumber,
                    collegeName: student.collegeId?.name
                });
                return {
                    studentId: match.studentId,
                    matchScore: Math.round(match.finalMatchScore * 100),
                    skillMatch: Math.round(match.skillMatch * 100),
                    toolMatch: Math.round(match.toolMatch * 100),
                    categoryMatch: match.categoryMatch,
                    workModeMatch: match.workModeMatch,
                    semanticSimilarity: Math.round(match.semanticSimilarity * 100),
                    matchedSkills: match.matchedSkills,
                    matchedTools: match.matchedTools,
                    studentDetails: {
                        firstName: student.firstName || '',
                        lastName: student.lastName || '',
                        email: email,
                        phone: phone,
                        whatsappNumber: whatsappNumber,
                        collegeName: student.collegeId?.name || '',
                        collegeShortName: student.collegeId?.shortName || '',
                        skills: student.skills?.slice(0, 5) || [],
                        graduationYear: student.graduationYear || 0,
                        cgpa: student.cgpa || 0,
                        profileCompleteness: student.profileCompleteness || 0,
                        isPlacementReady: student.isPlacementReady || false
                    }
                };
            }));
            const validMatches = enrichedMatches.filter(match => match !== null);
            res.status(200).json({
                success: true,
                data: {
                    jobId: jobId,
                    totalMatches: matches.length,
                    returnedMatches: validMatches.length,
                    threshold: parseFloat(threshold),
                    matches: validMatches
                }
            });
        }
        else {
            res.status(200).json({
                success: true,
                data: {
                    jobId: jobId,
                    totalMatches: matches.length,
                    returnedMatches: limitedMatches.length,
                    threshold: parseFloat(threshold),
                    matches: limitedMatches.map(match => ({
                        studentId: match.studentId,
                        matchScore: Math.round(match.finalMatchScore * 100),
                        skillMatch: Math.round(match.skillMatch * 100),
                        toolMatch: Math.round(match.toolMatch * 100),
                        categoryMatch: match.categoryMatch,
                        workModeMatch: match.workModeMatch,
                        semanticSimilarity: Math.round(match.semanticSimilarity * 100),
                        matchedSkills: match.matchedSkills,
                        matchedTools: match.matchedTools
                    }))
                }
            });
        }
    }
    catch (error) {
        console.error('Error finding matching students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find matching students',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.findMatchingStudents = findMatchingStudents;
const triggerJobAlerts = async (req, res) => {
    const { jobId } = req.params;
    const { threshold = 0.70 } = req.body;
    try {
        await career_alerts_1.default.processNewJobPosting(new mongoose_1.Types.ObjectId(jobId));
        res.status(200).json({
            success: true,
            message: 'Job alerts triggered successfully'
        });
    }
    catch (error) {
        console.error('Error triggering job alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger job alerts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.triggerJobAlerts = triggerJobAlerts;
const sendWhatsAppToStudents = async (req, res) => {
    const { jobId } = req.params;
    const { studentIds, customMessage, includeJobDetails = true } = req.body;
    try {
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Student IDs array is required and cannot be empty'
            });
        }
        const { Job, Student } = require('../models');
        const job = await Job.findById(jobId).lean();
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        const students = await Student.find({
            _id: { $in: studentIds.map((id) => new mongoose_1.Types.ObjectId(id)) }
        }).populate('userId', 'phone whatsappNumber email name').lean();
        console.log(`📊 Found ${students.length} students for messaging out of ${studentIds.length} requested`);
        const results = [];
        const phoneNumbers = new Set();
        for (const student of students) {
            try {
                let phoneNumber = '';
                if (student.userId && typeof student.userId === 'object') {
                    phoneNumber = student.userId.whatsappNumber ||
                        student.userId.phone || '';
                }
                if (!phoneNumber) {
                    phoneNumber = student.whatsappNumber ||
                        student.phoneNumber ||
                        student.phone || '';
                }
                if (!phoneNumber || phoneNumber.length < 10) {
                    console.log(`❌ Invalid phone number for student ${student.firstName}: "${phoneNumber}"`);
                    results.push({
                        studentId: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        status: 'failed',
                        reason: `Invalid phone number: ${phoneNumber || 'empty'}`
                    });
                    continue;
                }
                if (phoneNumbers.has(phoneNumber)) {
                    console.log(`⚠️  Duplicate phone number detected: ${phoneNumber} for ${student.firstName}`);
                    results.push({
                        studentId: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        status: 'skipped',
                        reason: 'Duplicate phone number - message already sent'
                    });
                    continue;
                }
                phoneNumbers.add(phoneNumber);
                console.log(`📱 Processing message for ${student.firstName} ${student.lastName} at ${phoneNumber}`);
                let messageData;
                if (customMessage) {
                    const { sendWhatsAppMessage } = require('../services/whatsapp');
                    const success = await sendWhatsAppMessage(phoneNumber, customMessage);
                    results.push({
                        studentId: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        phoneNumber: phoneNumber,
                        status: success ? 'sent' : 'failed',
                        message: customMessage
                    });
                }
                else if (includeJobDetails) {
                    const { sendJobMatchNotification } = require('../services/whatsapp');
                    let salaryInfo = 'Competitive';
                    if (job.salary && job.salary.min && job.salary.max) {
                        const currency = job.salary.currency === 'INR' ? '₹' : job.salary.currency;
                        const minLPA = Math.round(job.salary.min / 100000);
                        const maxLPA = Math.round(job.salary.max / 100000);
                        salaryInfo = `${currency}${minLPA}-${maxLPA} LPA`;
                    }
                    let locationInfo = job.workMode || 'Remote';
                    if (job.locations && job.locations.length > 0) {
                        const location = job.locations[0];
                        if (location.city && location.state) {
                            locationInfo = `${location.city}, ${location.state}`;
                        }
                        if (location.isRemote) {
                            locationInfo = 'Remote';
                        }
                        else if (location.hybrid) {
                            locationInfo = `${locationInfo} (Hybrid)`;
                        }
                    }
                    messageData = {
                        jobTitle: job.title,
                        company: job.companyName,
                        location: locationInfo,
                        salary: salaryInfo,
                        matchScore: "85",
                        personalizedMessage: `Great opportunity at ${job.companyName}!`,
                        jobLink: `https://campuspe.com/jobs/${jobId}`
                    };
                    const result = await sendJobMatchNotification(phoneNumber, messageData);
                    results.push({
                        studentId: student._id,
                        studentName: `${student.firstName} ${student.lastName}`,
                        phoneNumber: phoneNumber,
                        status: result.success ? 'sent' : 'failed',
                        message: result.success ? 'Job notification sent' : result.message,
                        webhookData: messageData
                    });
                }
                const { Notification } = require('../models');
                await new Notification({
                    recipientId: student._id,
                    recipientType: 'student',
                    title: `Job Alert: ${job.title}`,
                    message: customMessage || `New job opportunity at ${job.companyName}`,
                    notificationType: 'job_match',
                    channels: {
                        whatsapp: true
                    },
                    deliveryStatus: {
                        whatsapp: results[results.length - 1]?.status === 'sent' ? 'sent' : 'failed'
                    },
                    relatedJobId: jobId,
                    priority: 'medium'
                }).save();
            }
            catch (studentError) {
                console.error(`Error sending message to student ${student._id}:`, studentError);
                results.push({
                    studentId: student._id,
                    studentName: `${student.firstName} ${student.lastName}`,
                    status: 'failed',
                    reason: 'Message sending failed',
                    error: studentError instanceof Error ? studentError.message : 'Unknown error'
                });
            }
        }
        const successCount = results.filter(r => r.status === 'sent').length;
        const failureCount = results.filter(r => r.status === 'failed').length;
        res.status(200).json({
            success: true,
            message: `WhatsApp messages sent to ${successCount} students, ${failureCount} failed`,
            data: {
                totalStudents: students.length,
                successCount,
                failureCount,
                results
            }
        });
    }
    catch (error) {
        console.error('Error sending WhatsApp messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send WhatsApp messages',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.sendWhatsAppToStudents = sendWhatsAppToStudents;
const getJobNotificationHistory = async (req, res) => {
    const { jobId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    try {
        const { Notification } = require('../models');
        const skip = (Number(page) - 1) * Number(limit);
        const notifications = await Notification.find({
            relatedJobId: jobId,
            notificationType: 'job_match'
        })
            .populate('recipientId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const total = await Notification.countDocuments({
            relatedJobId: jobId,
            notificationType: 'job_match'
        });
        const enrichedNotifications = notifications.map((notification) => ({
            id: notification._id,
            studentName: notification.recipientId ?
                `${notification.recipientId.firstName} ${notification.recipientId.lastName}` :
                'Unknown Student',
            title: notification.title,
            message: notification.message,
            status: notification.deliveryStatus?.whatsapp || 'unknown',
            sentAt: notification.createdAt,
            channels: notification.channels,
            priority: notification.priority
        }));
        res.status(200).json({
            success: true,
            data: {
                notifications: enrichedNotifications,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(total / Number(limit)),
                    count: notifications.length,
                    totalRecords: total
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching notification history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getJobNotificationHistory = getJobNotificationHistory;
