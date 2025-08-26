"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeResumeOnly = exports.testGenerateAnalysis = exports.getCurrentUserResumeAnalysis = exports.getStudentApplications = exports.getResumeAnalysis = exports.getJobApplications = exports.getResumeImprovementSuggestions = exports.applyForJob = void 0;
const Application_1 = require("../models/Application");
const Student_1 = require("../models/Student");
const Job_1 = require("../models/Job");
const ResumeJobAnalysis_1 = require("../models/ResumeJobAnalysis");
const mongoose_1 = require("mongoose");
const ai_resume_matching_1 = __importDefault(require("../services/ai-resume-matching"));
const applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { skipNotification = false } = req.body;
        const user = req.user;
        const userId = user._id || user.userId;
        console.log('Apply for job - User ID:', userId);
        console.log('Apply for job - Job ID:', jobId);
        console.log('Apply for job - Request body:', req.body);
        console.log('Apply for job - Skip notification:', skipNotification);
        const student = await Student_1.Student.findOne({ userId });
        console.log('Apply for job - Student found:', student ? `${student.firstName} ${student.lastName}` : 'No student profile');
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found',
                debug: `User ID: ${userId}, User email: ${user.email}`
            });
        }
        let resumeContent = student.resumeText ||
            (student.resumeAnalysis?.summary ? `${student.resumeAnalysis.summary}\nSkills: ${student.resumeAnalysis.skills?.join(', ')}` : null);
        if (!resumeContent) {
            try {
                resumeContent = `Profile summary for ${student.firstName} ${student.lastName}`;
                console.log('Generated resume content using AI scanning fallback');
            }
            catch (error) {
                console.error('Error generating resume content:', error);
                return res.status(400).json({
                    success: false,
                    message: 'Please upload your resume before applying to jobs'
                });
            }
        }
        const job = await Job_1.Job.findById(jobId).populate('recruiterId');
        console.log('Apply for job - Job found:', job ? job.title : 'No job found');
        console.log('Apply for job - Job recruiterId:', job && job.recruiterId ? job.recruiterId : 'No recruiterId');
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        if (!job.recruiterId) {
            console.warn('Job recruiterId is missing, setting to a new ObjectId placeholder to avoid validation error');
            job.recruiterId = new mongoose_1.Types.ObjectId('000000000000000000000000');
        }
        const existingApplication = await Application_1.Application.findOne({
            studentId: student._id,
            jobId: new mongoose_1.Types.ObjectId(jobId)
        });
        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }
        let matchResult;
        try {
            matchResult = await ai_resume_matching_1.default.analyzeResumeMatch(resumeContent, job.description);
        }
        catch (aiError) {
            console.error('AIResumeMatchingService error:', aiError);
            return res.status(500).json({
                success: false,
                message: 'AI resume analysis failed. Please try again later.',
                error: aiError instanceof Error ? aiError.message : 'Unknown AI error'
            });
        }
        let application;
        try {
            application = new Application_1.Application({
                studentId: student._id,
                jobId: new mongoose_1.Types.ObjectId(jobId),
                recruiterId: job.recruiterId || null,
                collegeId: student.collegeId,
                currentStatus: 'applied',
                statusHistory: [{
                        status: 'applied',
                        updatedAt: new Date(),
                        updatedBy: student.userId,
                        notes: 'Application submitted through platform'
                    }],
                matchScore: matchResult.matchScore,
                skillsMatchPercentage: matchResult.matchScore,
                source: 'platform',
                appliedAt: new Date(),
                whatsappNotificationSent: false,
                emailNotificationSent: false,
                recruiterViewed: false
            });
            await application.save();
        }
        catch (appError) {
            console.error('Application save error:', appError);
            return res.status(500).json({
                success: false,
                message: 'Failed to save application. Please try again later.',
                error: appError instanceof Error ? appError.message : 'Unknown application save error'
            });
        }
        try {
            const analysisData = {
                studentId: student._id,
                jobId: new mongoose_1.Types.ObjectId(jobId),
                matchScore: matchResult.matchScore,
                explanation: matchResult.explanation,
                suggestions: matchResult.suggestions,
                skillsMatched: matchResult.skillsMatched,
                skillsGap: matchResult.skillsGap,
                resumeText: resumeContent,
                resumeVersion: 1,
                jobTitle: job.title,
                jobDescription: job.description,
                companyName: job.companyName,
                applicationId: application._id,
                dateApplied: new Date(),
                isActive: true,
                analyzedAt: new Date()
            };
            await ResumeJobAnalysis_1.ResumeJobAnalysis.findOneAndUpdate({
                studentId: student._id,
                jobId: new mongoose_1.Types.ObjectId(jobId)
            }, analysisData, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            });
            console.log('✅ Resume analysis saved/updated successfully');
        }
        catch (analysisError) {
            console.error('ResumeAnalysis save error:', analysisError);
        }
        if (matchResult.matchScore >= 70 && !skipNotification) {
            try {
                console.log(`🎯 High match score (${matchResult.matchScore}%) detected! Auto-sending WhatsApp notification to student...`);
                const studentWithUser = await Student_1.Student.findById(student._id).populate('userId', 'phone whatsappNumber');
                const userDetails = studentWithUser?.userId;
                const phoneNumber = userDetails?.whatsappNumber || userDetails?.phone;
                if (phoneNumber) {
                    const { sendJobMatchNotification } = require('../services/whatsapp');
                    let salaryInfo = 'Competitive';
                    if (job.salary && job.salary.min && job.salary.max) {
                        const currency = job.salary.currency === 'INR' ? '₹' : job.salary.currency;
                        const minLPA = Math.round(job.salary.min / 100000);
                        const maxLPA = Math.round(job.salary.max / 100000);
                        salaryInfo = `${currency}${minLPA}-${maxLPA} LPA`;
                    }
                    let locationInfo = job.workMode || 'remote';
                    if (job.locations && job.locations.length > 0) {
                        const location = job.locations[0];
                        if (location.city && location.state) {
                            locationInfo = `${location.city}, ${location.state}`;
                        }
                        if (location.isRemote) {
                            locationInfo = 'remote';
                        }
                        else if (location.hybrid) {
                            locationInfo = `${locationInfo} (Hybrid)`;
                        }
                    }
                    const messageData = {
                        jobTitle: job.title,
                        company: job.companyName,
                        location: locationInfo,
                        salary: salaryInfo,
                        matchScore: matchResult.matchScore.toString(),
                        personalizedMessage: `🎉 Congratulations! You're a ${matchResult.matchScore}% match for this role at ${job.companyName}!`,
                        jobLink: `https://campuspe.com/jobs/${jobId}`
                    };
                    const whatsappResult = await sendJobMatchNotification(phoneNumber, messageData);
                    if (whatsappResult.success) {
                        await Application_1.Application.findByIdAndUpdate(application._id, {
                            whatsappNotificationSent: true,
                            whatsappNotificationSentAt: new Date()
                        });
                        const { Notification } = require('../models');
                        await new Notification({
                            recipientId: student._id,
                            recipientType: 'student',
                            title: `🎯 Great Match: ${job.title}`,
                            message: `You're a ${matchResult.matchScore}% match! Your application for ${job.title} at ${job.companyName} has been submitted.`,
                            notificationType: 'job_match',
                            channels: {
                                whatsapp: true
                            },
                            deliveryStatus: {
                                whatsapp: 'sent'
                            },
                            relatedJobId: jobId,
                            priority: 'high',
                            metadata: {
                                matchScore: matchResult.matchScore,
                                autoSent: true,
                                triggerReason: 'high_match_score'
                            }
                        }).save();
                        console.log(`✅ Auto-sent WhatsApp notification to ${student.firstName} ${student.lastName} (${phoneNumber}) for high match score`);
                    }
                    else {
                        console.error(`❌ Failed to auto-send WhatsApp notification:`, whatsappResult.message);
                    }
                }
                else {
                    console.log(`📞 No phone number available for student ${student.firstName} ${student.lastName} - skipping auto WhatsApp notification`);
                }
            }
            catch (whatsappError) {
                console.error('Error sending auto WhatsApp notification:', whatsappError);
            }
        }
        else if (matchResult.matchScore >= 70 && skipNotification) {
            console.log(`📱 High match score (${matchResult.matchScore}%) but notifications skipped for dashboard application`);
        }
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully!',
            data: {
                applicationId: application._id,
                matchScore: matchResult.matchScore,
                explanation: matchResult.explanation,
                suggestions: matchResult.suggestions,
                skillsMatched: matchResult.skillsMatched,
                skillsGap: matchResult.skillsGap
            }
        });
    }
    catch (error) {
        console.error('Error applying for job:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        res.status(500).json({
            success: false,
            message: 'Failed to submit application. Please try again.',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.applyForJob = applyForJob;
const getResumeImprovementSuggestions = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { userId } = req.user;
        const student = await Student_1.Student.findOne({ userId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        const resumeContent = student.resumeText ||
            (student.resumeAnalysis?.summary ? `${student.resumeAnalysis.summary}\nSkills: ${student.resumeAnalysis.skills?.join(', ')}` : null);
        if (!resumeContent) {
            return res.status(400).json({
                success: false,
                message: 'Please upload your resume first'
            });
        }
        const job = await Job_1.Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        const improvements = await ai_resume_matching_1.default.generateImprovementSuggestions(resumeContent);
        await ResumeJobAnalysis_1.ResumeJobAnalysis.findOneAndUpdate({ studentId: student._id, jobId: new mongoose_1.Types.ObjectId(jobId) }, {
            $set: {
                improvementsGenerated: true,
                improvementsSuggestions: improvements
            }
        }, { upsert: true });
        res.status(200).json({
            success: true,
            message: 'Resume improvement suggestions generated successfully',
            data: {
                improvements,
                jobTitle: job.title,
                companyName: job.companyName
            }
        });
    }
    catch (error) {
        console.error('Error generating resume improvements:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate improvement suggestions. Please try again.'
        });
    }
};
exports.getResumeImprovementSuggestions = getResumeImprovementSuggestions;
const getJobApplications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { userId } = req.user;
        const job = await Job_1.Job.findById(jobId).populate('recruiterId');
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        const applications = await Application_1.Application.find({ jobId: new mongoose_1.Types.ObjectId(jobId) })
            .populate({
            path: 'studentId',
            select: 'personalInfo contactInfo skills experience education resumeFile resumeText'
        })
            .sort({ matchScore: -1, appliedAt: -1 })
            .lean();
        const applicationIds = applications.map(app => app._id);
        const resumeAnalyses = await ResumeJobAnalysis_1.ResumeJobAnalysis.find({
            applicationId: { $in: applicationIds }
        });
        const analysisMap = new Map();
        resumeAnalyses.forEach(analysis => {
            if (analysis.applicationId) {
                analysisMap.set(analysis.applicationId.toString(), analysis);
            }
        });
        const enrichedApplications = applications.map(app => {
            const analysis = analysisMap.get(app._id.toString());
            return {
                ...app,
                resumeAnalysis: analysis ? {
                    matchScore: analysis.matchScore,
                    explanation: analysis.explanation,
                    skillsMatched: analysis.skillsMatched,
                    skillsGap: analysis.skillsGap,
                    suggestions: analysis.suggestions
                } : null
            };
        });
        res.status(200).json({
            success: true,
            data: {
                jobId,
                jobTitle: job.title,
                companyName: job.companyName,
                totalApplications: applications.length,
                applications: enrichedApplications
            }
        });
    }
    catch (error) {
        console.error('Error fetching job applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications. Please try again.'
        });
    }
};
exports.getJobApplications = getJobApplications;
const getResumeAnalysis = async (req, res) => {
    try {
        const { jobId, studentId } = req.params;
        const analysis = await ResumeJobAnalysis_1.ResumeJobAnalysis.findOne({
            studentId: new mongoose_1.Types.ObjectId(studentId),
            jobId: new mongoose_1.Types.ObjectId(jobId)
        }).populate('studentId', 'personalInfo contactInfo')
            .populate('jobId', 'title companyName');
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'Resume analysis not found'
            });
        }
        res.status(200).json({
            success: true,
            data: analysis
        });
    }
    catch (error) {
        console.error('Error fetching resume analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resume analysis'
        });
    }
};
exports.getResumeAnalysis = getResumeAnalysis;
const getStudentApplications = async (req, res) => {
    try {
        const user = req.user;
        const userId = user?._id || user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const student = await Student_1.Student.findOne({ userId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found',
                debug: { userId, userEmail: user?.email }
            });
        }
        const applications = await Application_1.Application.find({
            studentId: student._id
        })
            .populate('jobId', 'title companyName applicationDeadline status location workMode salary')
            .populate('recruiterId', 'companyName contactInfo')
            .sort({ appliedAt: -1 })
            .lean();
        if (!applications || applications.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: 'No applications found',
                totalCount: 0,
                statusBreakdown: {
                    applied: 0,
                    under_review: 0,
                    interview_scheduled: 0,
                    interviewed: 0,
                    selected: 0,
                    rejected: 0,
                    withdrawn: 0
                }
            });
        }
        const applicationsWithDetails = await Promise.all(applications.map(async (app) => {
            try {
                const matchAnalysis = await ResumeJobAnalysis_1.ResumeJobAnalysis.findOne({
                    studentId: student._id,
                    jobId: app.jobId,
                    applicationId: app._id
                }).lean();
                const statusHistory = app.statusHistory || [];
                const latestStatus = statusHistory.length > 0
                    ? statusHistory[statusHistory.length - 1]
                    : { status: app.currentStatus, updatedAt: app.appliedAt };
                const jobDetails = app.jobId;
                const recruiterDetails = app.recruiterId;
                return {
                    _id: app._id,
                    jobId: jobDetails?._id || app.jobId,
                    jobTitle: jobDetails?.title || 'Job Title',
                    companyName: jobDetails?.companyName || recruiterDetails?.companyName || 'Company',
                    appliedDate: app.appliedAt,
                    dateApplied: app.appliedAt,
                    status: app.currentStatus || 'applied',
                    currentStatus: app.currentStatus || 'applied',
                    lastUpdated: latestStatus.updatedAt || app.appliedAt,
                    lastStatusChange: latestStatus.updatedAt || app.appliedAt,
                    statusHistory: statusHistory.slice(-3),
                    matchScore: matchAnalysis?.matchScore || app.matchScore,
                    matchAnalysis: matchAnalysis ? {
                        overallMatch: matchAnalysis.matchScore,
                        explanation: matchAnalysis.explanation,
                        skillsMatched: matchAnalysis.skillsMatched,
                        skillsGap: matchAnalysis.skillsGap,
                        suggestions: matchAnalysis.suggestions
                    } : null,
                    notes: app.shortlistReason || app.rejectionReason || '',
                    jobLocation: jobDetails?.location || 'Not specified',
                    workMode: jobDetails?.workMode || 'Not specified',
                    salary: jobDetails?.salary,
                    applicationDeadline: jobDetails?.applicationDeadline,
                    whatsappNotificationSent: app.whatsappNotificationSent || false,
                    emailNotificationSent: app.emailNotificationSent || false,
                    recruiterViewed: app.recruiterViewed || false,
                    lastChecked: new Date(),
                    isActive: jobDetails?.status === 'active',
                    canWithdraw: ['applied', 'under_review'].includes(app.currentStatus || 'applied'),
                    interviews: app.interviews || [],
                    feedback: app.studentFeedback?.comments || '',
                    rejectionReason: app.rejectionReason || ''
                };
            }
            catch (error) {
                console.error('Error processing application:', app._id, error);
                return {
                    _id: app._id,
                    jobId: app.jobId,
                    jobTitle: 'Error loading job details',
                    companyName: 'Unknown',
                    appliedDate: app.appliedAt,
                    status: app.currentStatus || 'applied',
                    error: 'Failed to load application details'
                };
            }
        }));
        const statusBreakdown = applicationsWithDetails.reduce((acc, app) => {
            const status = app.status || 'applied';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const allStatuses = ['applied', 'under_review', 'interview_scheduled', 'interviewed', 'selected', 'rejected', 'withdrawn'];
        allStatuses.forEach(status => {
            if (!statusBreakdown[status]) {
                statusBreakdown[status] = 0;
            }
        });
        console.log('✅ Successfully retrieved applications:', {
            studentName: `${student.firstName} ${student.lastName}`,
            totalApplications: applicationsWithDetails.length,
            statusBreakdown
        });
        res.json({
            success: true,
            data: applicationsWithDetails,
            message: `Found ${applicationsWithDetails.length} applications`,
            totalCount: applicationsWithDetails.length,
            statusBreakdown,
            lastUpdated: new Date(),
            realTimeData: true
        });
    }
    catch (error) {
        console.error('Error fetching student applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getStudentApplications = getStudentApplications;
const getCurrentUserResumeAnalysis = async (req, res) => {
    try {
        const { jobId } = req.params;
        const user = req.user;
        const userId = user._id || user.userId;
        const student = await Student_1.Student.findOne({ userId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        const analysis = await ResumeJobAnalysis_1.ResumeJobAnalysis.findOne({
            studentId: student._id,
            jobId: new mongoose_1.Types.ObjectId(jobId),
            isActive: true
        }).populate('jobId', 'title companyName').lean();
        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: 'No resume analysis found for this job'
            });
        }
        res.status(200).json({
            success: true,
            data: analysis
        });
    }
    catch (error) {
        console.error('Error fetching current user resume analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch resume analysis',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getCurrentUserResumeAnalysis = getCurrentUserResumeAnalysis;
const testGenerateAnalysis = async (req, res) => {
    try {
        const { jobId } = req.params;
        const user = req.user;
        const userId = user._id || user.userId;
        const student = await Student_1.Student.findOne({ userId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }
        const job = await Job_1.Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        let resumeContent = student.resumeText ||
            (student.resumeAnalysis?.summary ? `${student.resumeAnalysis.summary}\nSkills: ${student.resumeAnalysis.skills?.join(', ')}` : null);
        if (!resumeContent) {
            resumeContent = `Test resume content for ${student.firstName} ${student.lastName}. Skills: JavaScript, React, Node.js. Experience: 2 years in web development.`;
        }
        const matchResult = await ai_resume_matching_1.default.analyzeResumeMatch(resumeContent, job.description);
        const analysisData = {
            studentId: student._id,
            jobId: new mongoose_1.Types.ObjectId(jobId),
            matchScore: matchResult.matchScore,
            explanation: matchResult.explanation,
            suggestions: matchResult.suggestions,
            skillsMatched: matchResult.skillsMatched,
            skillsGap: matchResult.skillsGap,
            resumeText: resumeContent,
            resumeVersion: 1,
            jobTitle: job.title,
            jobDescription: job.description,
            companyName: job.companyName,
            isActive: true,
            analyzedAt: new Date()
        };
        const savedAnalysis = await ResumeJobAnalysis_1.ResumeJobAnalysis.findOneAndUpdate({
            studentId: student._id,
            jobId: new mongoose_1.Types.ObjectId(jobId)
        }, analysisData, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        });
        res.status(200).json({
            success: true,
            message: 'Test analysis generated and saved successfully',
            data: {
                analysisId: savedAnalysis._id,
                matchScore: matchResult.matchScore,
                explanation: matchResult.explanation,
                suggestions: matchResult.suggestions,
                skillsMatched: matchResult.skillsMatched,
                skillsGap: matchResult.skillsGap
            }
        });
    }
    catch (error) {
        console.error('Error generating test analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate test analysis',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.testGenerateAnalysis = testGenerateAnalysis;
const analyzeResumeOnly = async (req, res) => {
    try {
        const { jobId } = req.params;
        const user = req.user;
        const userId = user._id || user.userId;
        console.log('Analyze resume only - User ID:', userId);
        console.log('Analyze resume only - Job ID:', jobId);
        const student = await Student_1.Student.findOne({ userId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found',
                debug: `User ID: ${userId}, User email: ${user.email}`
            });
        }
        let resumeContent = student.resumeText ||
            (student.resumeAnalysis?.summary ? `${student.resumeAnalysis.summary}\nSkills: ${student.resumeAnalysis.skills?.join(', ')}` : null);
        if (!resumeContent) {
            return res.status(400).json({
                success: false,
                message: 'Please upload your resume before analyzing for this job'
            });
        }
        const job = await Job_1.Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        const existingAnalysis = await ResumeJobAnalysis_1.ResumeJobAnalysis.findOne({
            studentId: student._id,
            jobId: new mongoose_1.Types.ObjectId(jobId)
        });
        if (existingAnalysis) {
            return res.status(200).json({
                success: true,
                message: 'Analysis already exists for this job',
                data: {
                    matchScore: existingAnalysis.matchScore,
                    explanation: existingAnalysis.explanation,
                    suggestions: existingAnalysis.suggestions,
                    skillsMatched: existingAnalysis.skillsMatched,
                    skillsGap: existingAnalysis.skillsGap,
                    analyzedAt: existingAnalysis.analyzedAt
                }
            });
        }
        let matchResult;
        try {
            matchResult = await ai_resume_matching_1.default.analyzeResumeMatch(resumeContent, job.description);
        }
        catch (aiError) {
            console.error('AI resume analysis error:', aiError);
            return res.status(500).json({
                success: false,
                message: 'AI resume analysis failed. Please try again later.',
                error: aiError instanceof Error ? aiError.message : 'Unknown AI error'
            });
        }
        try {
            const analysisData = {
                studentId: student._id,
                jobId: new mongoose_1.Types.ObjectId(jobId),
                matchScore: matchResult.matchScore,
                explanation: matchResult.explanation,
                suggestions: matchResult.suggestions,
                skillsMatched: matchResult.skillsMatched,
                skillsGap: matchResult.skillsGap,
                resumeText: resumeContent,
                resumeVersion: 1,
                jobTitle: job.title,
                jobDescription: job.description,
                companyName: job.companyName,
                isActive: true,
                analyzedAt: new Date()
            };
            const analysis = await ResumeJobAnalysis_1.ResumeJobAnalysis.create(analysisData);
            console.log('✅ Resume analysis saved successfully (analysis only)');
            return res.status(200).json({
                success: true,
                message: 'Resume analysis completed successfully',
                data: {
                    matchScore: matchResult.matchScore,
                    explanation: matchResult.explanation,
                    suggestions: matchResult.suggestions,
                    skillsMatched: matchResult.skillsMatched,
                    skillsGap: matchResult.skillsGap,
                    analyzedAt: analysis.analyzedAt
                }
            });
        }
        catch (analysisError) {
            console.error('Analysis save error:', analysisError);
            return res.status(500).json({
                success: false,
                message: 'Failed to save analysis. Please try again later.',
                error: analysisError instanceof Error ? analysisError.message : 'Unknown analysis save error'
            });
        }
    }
    catch (error) {
        console.error('Analyze resume only error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.analyzeResumeOnly = analyzeResumeOnly;
