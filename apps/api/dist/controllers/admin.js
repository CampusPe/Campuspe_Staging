"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suspendRecruiter = exports.suspendCollege = exports.activateRecruiter = exports.deactivateRecruiter = exports.activateCollege = exports.deactivateCollege = exports.getAllRecruiters = exports.getAllColleges = exports.handleDocumentUpload = exports.getAdminProfile = exports.getRecruiterDetails = exports.getCollegeDetails = exports.getDashboardStats = exports.rejectRecruiter = exports.approveRecruiter = exports.rejectCollege = exports.approveCollege = exports.getPendingApprovals = void 0;
const Admin_1 = require("../models/Admin");
const College_1 = require("../models/College");
const Recruiter_1 = require("../models/Recruiter");
const mongoose_1 = require("mongoose");
const getPendingApprovals = async (req, res) => {
    try {
        const pendingColleges = await College_1.College.find({ approvalStatus: 'pending' })
            .populate('userId', 'email phone createdAt')
            .select('name shortName domainCode address primaryContact establishedYear affiliation approvalStatus createdAt')
            .lean();
        const pendingRecruiters = await Recruiter_1.Recruiter.find({ approvalStatus: 'pending' })
            .populate('userId', 'email phone createdAt')
            .select('companyInfo recruiterProfile hiringInfo approvalStatus createdAt')
            .lean();
        res.status(200).json({
            pendingColleges,
            pendingRecruiters,
            totalPending: pendingColleges.length + pendingRecruiters.length
        });
    }
    catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ message: 'Server error fetching pending approvals' });
    }
};
exports.getPendingApprovals = getPendingApprovals;
const approveCollege = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const adminId = req.user?.userId;
        if (!mongoose_1.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }
        const college = await College_1.College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        college.approvalStatus = 'approved';
        if (adminId !== 'admin' && adminId) {
            college.approvedBy = adminId;
        }
        college.approvedAt = new Date();
        college.isVerified = true;
        await college.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: 'approved_college',
                        targetType: 'college',
                        targetId: collegeId,
                        timestamp: new Date(),
                        details: `Approved college: ${college.name}`
                    }
                }
            });
        }
        res.status(200).json({
            message: 'College approved successfully',
            college: college
        });
    }
    catch (error) {
        console.error('Error approving college:', error);
        res.status(500).json({ message: 'Server error approving college' });
    }
};
exports.approveCollege = approveCollege;
const rejectCollege = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { rejectionReason } = req.body;
        const adminId = req.user?.userId;
        if (!mongoose_1.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }
        const college = await College_1.College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        college.approvalStatus = 'rejected';
        college.rejectionReason = rejectionReason;
        if (adminId !== 'admin' && adminId) {
            college.approvedBy = adminId;
        }
        college.approvedAt = new Date();
        await college.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: 'rejected_college',
                        targetType: 'college',
                        targetId: collegeId,
                        timestamp: new Date(),
                        details: `Rejected college: ${college.name}. Reason: ${rejectionReason}`
                    }
                }
            });
        }
        res.status(200).json({
            message: 'College rejected successfully',
            college: college
        });
    }
    catch (error) {
        console.error('Error rejecting college:', error);
        res.status(500).json({ message: 'Server error rejecting college' });
    }
};
exports.rejectCollege = rejectCollege;
const approveRecruiter = async (req, res) => {
    try {
        const { recruiterId } = req.params;
        const adminId = req.user?.userId;
        if (!mongoose_1.Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }
        const recruiter = await Recruiter_1.Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        recruiter.approvalStatus = 'approved';
        if (adminId !== 'admin' && adminId) {
            recruiter.approvedBy = adminId;
        }
        recruiter.approvedAt = new Date();
        recruiter.isVerified = true;
        await recruiter.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: 'approved_recruiter',
                        targetType: 'recruiter',
                        targetId: recruiterId,
                        timestamp: new Date(),
                        details: `Approved recruiter: ${recruiter.companyInfo.name}`
                    }
                }
            });
        }
        res.status(200).json({
            message: 'Recruiter approved successfully',
            recruiter: recruiter
        });
    }
    catch (error) {
        console.error('Error approving recruiter:', error);
        res.status(500).json({ message: 'Server error approving recruiter' });
    }
};
exports.approveRecruiter = approveRecruiter;
const rejectRecruiter = async (req, res) => {
    try {
        const { recruiterId } = req.params;
        const { rejectionReason } = req.body;
        const adminId = req.user?.userId;
        if (!mongoose_1.Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }
        const recruiter = await Recruiter_1.Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        recruiter.approvalStatus = 'rejected';
        recruiter.rejectionReason = rejectionReason;
        if (adminId !== 'admin' && adminId) {
            recruiter.approvedBy = adminId;
        }
        recruiter.approvedAt = new Date();
        await recruiter.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: 'rejected_recruiter',
                        targetType: 'recruiter',
                        targetId: recruiterId,
                        timestamp: new Date(),
                        details: `Rejected recruiter: ${recruiter.companyInfo.name}. Reason: ${rejectionReason}`
                    }
                }
            });
        }
        res.status(200).json({
            message: 'Recruiter rejected successfully',
            recruiter: recruiter
        });
    }
    catch (error) {
        console.error('Error rejecting recruiter:', error);
        res.status(500).json({ message: 'Server error rejecting recruiter' });
    }
};
exports.rejectRecruiter = rejectRecruiter;
const getDashboardStats = async (req, res) => {
    try {
        const totalColleges = await College_1.College.countDocuments();
        const totalRecruiters = await Recruiter_1.Recruiter.countDocuments();
        const pendingColleges = await College_1.College.countDocuments({ approvalStatus: 'pending' });
        const pendingRecruiters = await Recruiter_1.Recruiter.countDocuments({ approvalStatus: 'pending' });
        const approvedColleges = await College_1.College.countDocuments({ approvalStatus: 'approved' });
        const approvedRecruiters = await Recruiter_1.Recruiter.countDocuments({ approvalStatus: 'approved' });
        const rejectedColleges = await College_1.College.countDocuments({ approvalStatus: 'rejected' });
        const rejectedRecruiters = await Recruiter_1.Recruiter.countDocuments({ approvalStatus: 'rejected' });
        res.status(200).json({
            totalColleges,
            totalRecruiters,
            pendingColleges,
            pendingRecruiters,
            approvedColleges,
            approvedRecruiters,
            rejectedColleges,
            rejectedRecruiters,
            totalPending: pendingColleges + pendingRecruiters
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getCollegeDetails = async (req, res) => {
    try {
        const { collegeId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }
        const college = await College_1.College.findById(collegeId)
            .populate('userId', 'email phone createdAt')
            .lean();
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.status(200).json(college);
    }
    catch (error) {
        console.error('Error fetching college details:', error);
        res.status(500).json({ message: 'Server error fetching college details' });
    }
};
exports.getCollegeDetails = getCollegeDetails;
const getRecruiterDetails = async (req, res) => {
    try {
        const { recruiterId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }
        const recruiter = await Recruiter_1.Recruiter.findById(recruiterId)
            .populate('userId', 'email phone createdAt')
            .lean();
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        res.status(200).json(recruiter);
    }
    catch (error) {
        console.error('Error fetching recruiter details:', error);
        res.status(500).json({ message: 'Server error fetching recruiter details' });
    }
};
exports.getRecruiterDetails = getRecruiterDetails;
const getAdminProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const admin = await Admin_1.Admin.findOne({ userId })
            .populate('userId', 'email phone createdAt')
            .lean();
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.status(200).json(admin);
    }
    catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({ message: 'Server error fetching admin profile' });
    }
};
exports.getAdminProfile = getAdminProfile;
const handleDocumentUpload = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const { documentUrls, resubmissionNotes } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(entityId)) {
            return res.status(400).json({ message: 'Invalid entity ID' });
        }
        if (entityType === 'college') {
            const college = await College_1.College.findById(entityId);
            if (!college) {
                return res.status(404).json({ message: 'College not found' });
            }
            college.submittedDocuments = documentUrls;
            college.resubmissionNotes = resubmissionNotes;
            college.approvalStatus = 'pending';
            await college.save();
            res.status(200).json({ message: 'Documents uploaded successfully', college });
        }
        else if (entityType === 'recruiter') {
            const recruiter = await Recruiter_1.Recruiter.findById(entityId);
            if (!recruiter) {
                return res.status(404).json({ message: 'Recruiter not found' });
            }
            recruiter.submittedDocuments = documentUrls;
            recruiter.resubmissionNotes = resubmissionNotes;
            recruiter.approvalStatus = 'pending';
            await recruiter.save();
            res.status(200).json({ message: 'Documents uploaded successfully', recruiter });
        }
        else {
            return res.status(400).json({ message: 'Invalid entity type' });
        }
    }
    catch (error) {
        console.error('Error handling document upload:', error);
        res.status(500).json({ message: 'Server error handling document upload' });
    }
};
exports.handleDocumentUpload = handleDocumentUpload;
const getAllColleges = async (req, res) => {
    try {
        const colleges = await College_1.College.find({})
            .populate('userId', 'email phone createdAt')
            .select('name shortName domainCode approvalStatus isActive createdAt userId')
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json(colleges);
    }
    catch (error) {
        console.error('Error fetching all colleges:', error);
        res.status(500).json({ message: 'Server error fetching colleges' });
    }
};
exports.getAllColleges = getAllColleges;
const getAllRecruiters = async (req, res) => {
    try {
        const recruiters = await Recruiter_1.Recruiter.find({})
            .populate('userId', 'email phone createdAt')
            .select('companyInfo recruiterProfile approvalStatus isActive createdAt userId')
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json(recruiters);
    }
    catch (error) {
        console.error('Error fetching all recruiters:', error);
        res.status(500).json({ message: 'Server error fetching recruiters' });
    }
};
exports.getAllRecruiters = getAllRecruiters;
const deactivateCollege = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { reason, adminId } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }
        const college = await College_1.College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        college.isActive = false;
        await college.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: 'deactivated_college',
                        targetType: 'college',
                        targetId: collegeId,
                        timestamp: new Date(),
                        details: `Deactivated college: ${college.name}. Reason: ${reason || 'No reason provided'}`
                    }
                }
            });
        }
        res.status(200).json({
            message: 'College deactivated successfully',
            college: college
        });
    }
    catch (error) {
        console.error('Error deactivating college:', error);
        res.status(500).json({ message: 'Server error deactivating college' });
    }
};
exports.deactivateCollege = deactivateCollege;
const activateCollege = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { notes, adminId } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }
        const college = await College_1.College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        college.isActive = true;
        await college.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: 'activated_college',
                        targetType: 'college',
                        targetId: collegeId,
                        timestamp: new Date(),
                        details: `Activated college: ${college.name}. Notes: ${notes || 'No notes provided'}`
                    }
                }
            });
        }
        res.status(200).json({
            message: 'College activated successfully',
            college: college
        });
    }
    catch (error) {
        console.error('Error activating college:', error);
        res.status(500).json({ message: 'Server error activating college' });
    }
};
exports.activateCollege = activateCollege;
const deactivateRecruiter = async (req, res) => {
    try {
        const { recruiterId } = req.params;
        const { reason, adminId } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }
        const recruiter = await Recruiter_1.Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        recruiter.isActive = false;
        await recruiter.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: 'deactivated_recruiter',
                        targetType: 'recruiter',
                        targetId: recruiterId,
                        timestamp: new Date(),
                        details: `Deactivated recruiter: ${recruiter.companyInfo.name}. Reason: ${reason || 'No reason provided'}`
                    }
                }
            });
        }
        res.status(200).json({
            message: 'Recruiter deactivated successfully',
            recruiter: recruiter
        });
    }
    catch (error) {
        console.error('Error deactivating recruiter:', error);
        res.status(500).json({ message: 'Server error deactivating recruiter' });
    }
};
exports.deactivateRecruiter = deactivateRecruiter;
const activateRecruiter = async (req, res) => {
    try {
        const { recruiterId } = req.params;
        const { notes, adminId } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }
        const recruiter = await Recruiter_1.Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        recruiter.isActive = true;
        await recruiter.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: 'activated_recruiter',
                        targetType: 'recruiter',
                        targetId: recruiterId,
                        timestamp: new Date(),
                        details: `Activated recruiter: ${recruiter.companyInfo.name}. Notes: ${notes || 'No notes provided'}`
                    }
                }
            });
        }
        res.status(200).json({
            message: 'Recruiter activated successfully',
            recruiter: recruiter
        });
    }
    catch (error) {
        console.error('Error activating recruiter:', error);
        res.status(500).json({ message: 'Server error activating recruiter' });
    }
};
exports.activateRecruiter = activateRecruiter;
const suspendCollege = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { reason, notes, adminId } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }
        const college = await College_1.College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        college.isActive = !college.isActive;
        college.rejectionReason = reason;
        college.resubmissionNotes = notes;
        await college.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: college.isActive ? 'unsuspended_college' : 'suspended_college',
                        targetType: 'college',
                        targetId: collegeId,
                        timestamp: new Date(),
                        details: `${college.isActive ? 'Unsuspended' : 'Suspended'} college: ${college.name}. Reason: ${reason || 'No reason provided'}`
                    }
                }
            });
        }
        res.status(200).json({
            message: `College ${college.isActive ? 'unsuspended' : 'suspended'} successfully`,
            college: college
        });
    }
    catch (error) {
        console.error('Error updating college status:', error);
        res.status(500).json({ message: 'Server error updating college status' });
    }
};
exports.suspendCollege = suspendCollege;
const suspendRecruiter = async (req, res) => {
    try {
        const { recruiterId } = req.params;
        const { reason, notes, adminId } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }
        const recruiter = await Recruiter_1.Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }
        recruiter.isActive = !recruiter.isActive;
        recruiter.rejectionReason = reason;
        recruiter.resubmissionNotes = notes;
        await recruiter.save();
        if (adminId && adminId !== 'admin') {
            await Admin_1.Admin.findOneAndUpdate({ userId: adminId }, {
                $push: {
                    activityLog: {
                        action: recruiter.isActive ? 'unsuspended_recruiter' : 'suspended_recruiter',
                        targetType: 'recruiter',
                        targetId: recruiterId,
                        timestamp: new Date(),
                        details: `${recruiter.isActive ? 'Unsuspended' : 'Suspended'} recruiter: ${recruiter.companyInfo.name}. Reason: ${reason || 'No reason provided'}`
                    }
                }
            });
        }
        res.status(200).json({
            message: `Recruiter ${recruiter.isActive ? 'unsuspended' : 'suspended'} successfully`,
            recruiter: recruiter
        });
    }
    catch (error) {
        console.error('Error updating recruiter status:', error);
        res.status(500).json({ message: 'Server error updating recruiter status' });
    }
};
exports.suspendRecruiter = suspendRecruiter;
