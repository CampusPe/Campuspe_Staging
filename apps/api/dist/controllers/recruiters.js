"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resubmitRecruiter = exports.notifyStudents = exports.requestCollegeApproval = exports.verifyRecruiter = exports.searchRecruiters = exports.getRecruitersByIndustry = exports.deleteRecruiter = exports.updateRecruiter = exports.updateRecruiterByUserId = exports.createRecruiter = exports.getRecruiterByUserId = exports.getRecruiterById = exports.getAllRecruiters = exports.getRecruiterStats = exports.getRecruiterProfile = void 0;
const bunnynet_1 = require("../services/bunnynet");
const Recruiter_1 = require("../models/Recruiter");
const Job_1 = require("../models/Job");
const Application_1 = require("../models/Application");
const mongoose_1 = require("mongoose");
const getRecruiterProfile = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const recruiter = await Recruiter_1.Recruiter.findOne({ userId }).lean();
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        res.status(200).json(recruiter);
    }
    catch (error) {
        console.error('Error fetching recruiter profile:', error);
        res.status(500).json({ message: 'Server error fetching recruiter profile' });
    }
};
exports.getRecruiterProfile = getRecruiterProfile;
const getRecruiterStats = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const recruiter = await Recruiter_1.Recruiter.findOne({ userId }).lean();
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        const totalJobs = await Job_1.Job.countDocuments({ recruiterId: recruiter._id });
        const activeJobs = await Job_1.Job.countDocuments({ recruiterId: recruiter._id, status: 'active' });
        const totalApplications = await Application_1.Application.countDocuments({ recruiterId: recruiter._id });
        const pendingApplications = await Application_1.Application.countDocuments({
            recruiterId: recruiter._id,
            currentStatus: 'applied'
        });
        const calculateProfileCompleteness = (recruiterData) => {
            const fields = [
                recruiterData.companyInfo?.name,
                recruiterData.companyInfo?.industry,
                recruiterData.companyInfo?.description,
                recruiterData.companyInfo?.website,
                recruiterData.companyInfo?.size,
                recruiterData.companyInfo?.headquarters?.city,
                recruiterData.recruiterProfile?.firstName,
                recruiterData.recruiterProfile?.lastName,
                recruiterData.recruiterProfile?.designation,
                recruiterData.hiringInfo?.preferredColleges?.length > 0,
                recruiterData.hiringInfo?.workLocations?.length > 0
            ];
            const completedFields = fields.filter(field => field !== undefined && field !== null && field !== '').length;
            return Math.round((completedFields / fields.length) * 100);
        };
        const companyProfileCompleteness = calculateProfileCompleteness(recruiter);
        const scheduledInterviews = 0;
        const selectedCandidates = await Application_1.Application.countDocuments({
            recruiterId: recruiter._id,
            currentStatus: 'selected'
        });
        const stats = {
            totalJobs,
            activeJobs,
            totalApplications,
            scheduledInterviews,
            selectedCandidates,
            avgApplicationsPerJob: totalJobs > 0 ? Math.round(totalApplications / totalJobs * 100) / 100 : 0,
            companyProfileCompleteness,
            pendingApplications,
            approvedApplications: await Application_1.Application.countDocuments({
                recruiterId: recruiter._id,
                currentStatus: 'selected'
            }),
            rejectedApplications: await Application_1.Application.countDocuments({
                recruiterId: recruiter._id,
                currentStatus: 'rejected'
            })
        };
        res.status(200).json(stats);
    }
    catch (error) {
        console.error('Error fetching recruiter stats:', error);
        res.status(500).json({ message: 'Server error fetching recruiter stats' });
    }
};
exports.getRecruiterStats = getRecruiterStats;
const getAllRecruiters = async (req, res) => {
    try {
        const recruiters = await Recruiter_1.Recruiter.find({ isVerified: true })
            .select('companyInfo recruiterProfile isVerified createdAt userId approvalStatus')
            .populate('userId', 'email role')
            .sort({ createdAt: -1 });
        const transformedRecruiters = recruiters.map(recruiter => {
            const populatedUser = recruiter.userId;
            return {
                _id: recruiter._id,
                userId: recruiter.userId,
                companyInfo: recruiter.companyInfo,
                profile: recruiter.recruiterProfile,
                email: populatedUser?.email || 'No email',
                approvalStatus: recruiter.approvalStatus || 'approved',
                isVerified: recruiter.isVerified,
                createdAt: recruiter.createdAt
            };
        });
        res.status(200).json(transformedRecruiters);
    }
    catch (error) {
        console.error('Error fetching recruiters:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recruiters',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAllRecruiters = getAllRecruiters;
const getRecruiterById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }
        const recruiter = await Recruiter_1.Recruiter.findById(id)
            .populate('userId', 'email phone whatsappNumber')
            .populate('hiringInfo.preferredColleges', 'name address')
            .populate('approvedColleges', 'name address')
            .select('-verificationDocuments -submittedDocuments')
            .lean();
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        if (recruiter.approvalStatus !== 'approved') {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        const totalJobs = await Job_1.Job.countDocuments({ recruiterId: recruiter._id });
        const activeJobs = await Job_1.Job.countDocuments({ recruiterId: recruiter._id, status: 'active' });
        const totalApplications = await Application_1.Application.countDocuments({ recruiterId: recruiter._id });
        const calculateProfileCompleteness = (recruiterData) => {
            const fields = [
                recruiterData.companyInfo?.name,
                recruiterData.companyInfo?.industry,
                recruiterData.companyInfo?.description,
                recruiterData.companyInfo?.website,
                recruiterData.companyInfo?.size,
                recruiterData.companyInfo?.headquarters?.city,
                recruiterData.recruiterProfile?.firstName,
                recruiterData.recruiterProfile?.lastName,
                recruiterData.recruiterProfile?.designation,
                recruiterData.hiringInfo?.preferredColleges?.length > 0,
                recruiterData.hiringInfo?.workLocations?.length > 0
            ];
            const completedFields = fields.filter(field => field !== undefined && field !== null && field !== '').length;
            return Math.round((completedFields / fields.length) * 100);
        };
        const enhancedRecruiter = {
            ...recruiter,
            stats: {
                totalJobs,
                activeJobs,
                totalApplications,
                scheduledInterviews: 0,
                selectedCandidates: await Application_1.Application.countDocuments({
                    recruiterId: recruiter._id,
                    currentStatus: 'selected'
                }),
                avgApplicationsPerJob: totalJobs > 0 ? Math.round(totalApplications / totalJobs * 100) / 100 : 0,
                companyProfileCompleteness: calculateProfileCompleteness(recruiter),
                pendingApplications: await Application_1.Application.countDocuments({
                    recruiterId: recruiter._id,
                    currentStatus: 'applied'
                }),
                approvedApplications: await Application_1.Application.countDocuments({
                    recruiterId: recruiter._id,
                    currentStatus: 'selected'
                }),
                rejectedApplications: await Application_1.Application.countDocuments({
                    recruiterId: recruiter._id,
                    currentStatus: 'rejected'
                })
            }
        };
        res.status(200).json(enhancedRecruiter);
    }
    catch (error) {
        console.error('Error fetching recruiter by ID:', error);
        res.status(500).json({ message: 'Server error fetching recruiter' });
    }
};
exports.getRecruiterById = getRecruiterById;
const getRecruiterByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const recruiter = await Recruiter_1.Recruiter.findOne({ userId: userId }).lean();
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        res.status(200).json({
            ...recruiter,
            canAccessDashboard: recruiter.approvalStatus === 'approved'
        });
    }
    catch (error) {
        console.error('Error fetching recruiter by userId:', error);
        res.status(500).json({ message: 'Server error fetching recruiter' });
    }
};
exports.getRecruiterByUserId = getRecruiterByUserId;
const createRecruiter = async (req, res) => {
    res.status(200).json({
        message: 'Recruiter registration should use /api/auth/register endpoint',
        redirect: '/api/auth/register'
    });
};
exports.createRecruiter = createRecruiter;
const updateRecruiterByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        const updateData = req.body;
        const mappedUpdateData = {};
        if (updateData.firstName !== undefined)
            mappedUpdateData['recruiterProfile.firstName'] = updateData.firstName;
        if (updateData.lastName !== undefined)
            mappedUpdateData['recruiterProfile.lastName'] = updateData.lastName;
        if (updateData.designation !== undefined)
            mappedUpdateData['recruiterProfile.designation'] = updateData.designation;
        if (updateData.department !== undefined)
            mappedUpdateData['recruiterProfile.department'] = updateData.department;
        if (updateData.linkedinUrl !== undefined)
            mappedUpdateData['recruiterProfile.linkedinUrl'] = updateData.linkedinUrl;
        if (updateData.preferredContactMethod !== undefined)
            mappedUpdateData['preferredContactMethod'] = updateData.preferredContactMethod;
        if (updateData.whatsappNumber !== undefined)
            mappedUpdateData['whatsappNumber'] = updateData.whatsappNumber;
        if (updateData.companyName !== undefined)
            mappedUpdateData['companyInfo.name'] = updateData.companyName;
        if (updateData.industry !== undefined)
            mappedUpdateData['companyInfo.industry'] = updateData.industry;
        if (updateData.website !== undefined)
            mappedUpdateData['companyInfo.website'] = updateData.website;
        if (updateData.description !== undefined)
            mappedUpdateData['companyInfo.description'] = updateData.description;
        if (updateData.size !== undefined)
            mappedUpdateData['companyInfo.size'] = updateData.size;
        if (updateData.foundedYear !== undefined)
            mappedUpdateData['companyInfo.foundedYear'] = updateData.foundedYear;
        if (updateData.headquartersCity !== undefined)
            mappedUpdateData['companyInfo.headquarters.city'] = updateData.headquartersCity;
        if (updateData.headquartersState !== undefined)
            mappedUpdateData['companyInfo.headquarters.state'] = updateData.headquartersState;
        if (updateData.headquartersCountry !== undefined)
            mappedUpdateData['companyInfo.headquarters.country'] = updateData.headquartersCountry;
        const updatedRecruiter = await Recruiter_1.Recruiter.findOneAndUpdate({ userId: userId }, { $set: mappedUpdateData }, { new: true }).lean();
        if (!updatedRecruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        res.status(200).json({ message: 'Recruiter updated successfully', recruiter: updatedRecruiter });
    }
    catch (error) {
        console.error('Error updating recruiter:', error);
        res.status(500).json({ message: 'Server error updating recruiter' });
    }
};
exports.updateRecruiterByUserId = updateRecruiterByUserId;
const updateRecruiter = async (req, res) => {
    res.status(200).json({ message: 'Recruiter update endpoint coming soon' });
};
exports.updateRecruiter = updateRecruiter;
const deleteRecruiter = async (req, res) => {
    res.status(200).json({ message: 'Recruiter deletion endpoint coming soon' });
};
exports.deleteRecruiter = deleteRecruiter;
const getRecruitersByIndustry = async (req, res) => {
    res.status(200).json({ message: 'Recruiters by industry endpoint coming soon' });
};
exports.getRecruitersByIndustry = getRecruitersByIndustry;
const searchRecruiters = async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
        const searchTerm = query.trim();
        const limitNum = Math.min(Number(limit) || 10, 50);
        const searchRegex = new RegExp(searchTerm, 'i');
        const recruiters = await Recruiter_1.Recruiter.find({
            $and: [
                {
                    $or: [
                        { 'companyInfo.name': searchRegex },
                        { 'companyInfo.industry': searchRegex },
                        { 'companyInfo.description': searchRegex },
                        { 'companyInfo.headquarters.city': searchRegex },
                        { 'companyInfo.headquarters.state': searchRegex },
                        { 'recruiterProfile.firstName': searchRegex },
                        { 'recruiterProfile.lastName': searchRegex },
                        { 'recruiterProfile.designation': searchRegex },
                        { 'recruiterProfile.department': searchRegex }
                    ]
                },
                { approvalStatus: 'approved' },
                { isActive: true }
            ]
        })
            .populate('userId', 'email')
            .select({
            'companyInfo.name': 1,
            'companyInfo.industry': 1,
            'companyInfo.logo': 1,
            'companyInfo.description': 1,
            'companyInfo.size': 1,
            'companyInfo.headquarters': 1,
            'recruiterProfile.firstName': 1,
            'recruiterProfile.lastName': 1,
            'recruiterProfile.designation': 1,
            'recruiterProfile.profilePicture': 1,
            'hiringInfo.workLocations': 1,
            'hiringInfo.remoteWork': 1,
            'isVerified': 1,
            'userId': 1
        })
            .limit(limitNum)
            .sort({ 'companyInfo.name': 1 })
            .lean();
        const formattedResults = recruiters.map(recruiter => ({
            id: recruiter._id,
            userId: recruiter.userId,
            type: 'company',
            name: recruiter.companyInfo.name,
            industry: recruiter.companyInfo.industry,
            logo: recruiter.companyInfo.logo,
            description: recruiter.companyInfo.description,
            size: recruiter.companyInfo.size,
            location: `${recruiter.companyInfo.headquarters.city}, ${recruiter.companyInfo.headquarters.state}`,
            recruiterName: `${recruiter.recruiterProfile.firstName} ${recruiter.recruiterProfile.lastName}`,
            designation: recruiter.recruiterProfile.designation,
            profilePicture: recruiter.recruiterProfile.profilePicture,
            workLocations: recruiter.hiringInfo.workLocations,
            remoteWork: recruiter.hiringInfo.remoteWork,
            isVerified: recruiter.isVerified
        }));
        res.status(200).json({
            success: true,
            data: formattedResults,
            count: formattedResults.length,
            query: searchTerm
        });
    }
    catch (error) {
        console.error('Error searching recruiters:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while searching recruiters'
        });
    }
};
exports.searchRecruiters = searchRecruiters;
const verifyRecruiter = async (req, res) => {
    res.status(200).json({ message: 'Verify recruiter endpoint coming soon' });
};
exports.verifyRecruiter = verifyRecruiter;
const requestCollegeApproval = async (req, res) => {
    res.status(200).json({ message: 'Request college approval endpoint coming soon' });
};
exports.requestCollegeApproval = requestCollegeApproval;
const notifyStudents = async (req, res) => {
    res.status(200).json({ message: 'Notify students endpoint coming soon' });
};
exports.notifyStudents = notifyStudents;
const resubmitRecruiter = async (req, res) => {
    try {
        const { notes } = req.body;
        const userId = req.user?.userId;
        const files = req.files;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const recruiter = await Recruiter_1.Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        const supportingDocuments = [];
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const uploadResult = await bunnynet_1.bunnyNetService.uploadFile(file.buffer, `recruiter-resubmission-${recruiter._id}-${Date.now()}-${file.originalname}`, {
                        folder: 'recruiter-resubmissions',
                        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                        maxSize: 10 * 1024 * 1024
                    });
                    if (uploadResult.success && uploadResult.cdnUrl) {
                        supportingDocuments.push(uploadResult.cdnUrl);
                    }
                    else {
                        console.error(`Failed to upload file ${file.originalname}:`, uploadResult.error);
                    }
                }
                catch (uploadError) {
                    console.error(`Error uploading file ${file.originalname}:`, uploadError);
                }
            }
        }
        recruiter.approvalStatus = 'pending';
        recruiter.resubmissionNotes = notes;
        recruiter.rejectionReason = undefined;
        if (supportingDocuments.length > 0) {
            recruiter.submittedDocuments = supportingDocuments;
        }
        await recruiter.save();
        res.status(200).json({
            message: 'Application resubmitted successfully',
            recruiter: recruiter,
            uploadedDocuments: supportingDocuments.length
        });
    }
    catch (error) {
        console.error('Error resubmitting recruiter application:', error);
        res.status(500).json({ message: 'Server error resubmitting application' });
    }
};
exports.resubmitRecruiter = resubmitRecruiter;
