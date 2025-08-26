import { Request, Response } from 'express';
import { Admin } from '../models/Admin';
import { College } from '../models/College';
import { Recruiter } from '../models/Recruiter';
import { User } from '../models/User';
import { Types } from 'mongoose';

// Get all pending approvals (colleges and recruiters)
export const getPendingApprovals = async (req: Request, res: Response) => {
    try {
        const pendingColleges = await College.find({ approvalStatus: 'pending' })
            .populate('userId', 'email phone createdAt')
            .select('name shortName domainCode address primaryContact establishedYear affiliation approvalStatus createdAt')
            .lean();

        const pendingRecruiters = await Recruiter.find({ approvalStatus: 'pending' })
            .populate('userId', 'email phone createdAt')
            .select('companyInfo recruiterProfile hiringInfo approvalStatus createdAt')
            .lean();

        res.status(200).json({
            pendingColleges,
            pendingRecruiters,
            totalPending: pendingColleges.length + pendingRecruiters.length
        });
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ message: 'Server error fetching pending approvals' });
    }
};

// Approve college
export const approveCollege = async (req: Request, res: Response) => {
    try {
        const { collegeId } = req.params;
        const adminId = req.user?.userId; // Get adminId from authenticated user

        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }

        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Update college approval status
        college.approvalStatus = 'approved';
        // Only set approvedBy if adminId is a valid ObjectId (not config admin)
        if (adminId !== 'admin' && adminId) {
            college.approvedBy = adminId;
        }
        college.approvedAt = new Date();
        college.isVerified = true;
        await college.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: 'approved_college',
                            targetType: 'college',
                            targetId: collegeId,
                            timestamp: new Date(),
                            details: `Approved college: ${college.name}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: 'College approved successfully',
            college: college
        });
    } catch (error) {
        console.error('Error approving college:', error);
        res.status(500).json({ message: 'Server error approving college' });
    }
};

// Reject college
export const rejectCollege = async (req: Request, res: Response) => {
    try {
        const { collegeId } = req.params;
        const { rejectionReason } = req.body;
        const adminId = req.user?.userId; // Get adminId from authenticated user

        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }

        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Update college approval status
        college.approvalStatus = 'rejected';
        college.rejectionReason = rejectionReason;
        // Only set approvedBy if adminId is a valid ObjectId (not config admin)
        if (adminId !== 'admin' && adminId) {
            college.approvedBy = adminId;
        }
        college.approvedAt = new Date();
        await college.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: 'rejected_college',
                            targetType: 'college',
                            targetId: collegeId,
                            timestamp: new Date(),
                            details: `Rejected college: ${college.name}. Reason: ${rejectionReason}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: 'College rejected successfully',
            college: college
        });
    } catch (error) {
        console.error('Error rejecting college:', error);
        res.status(500).json({ message: 'Server error rejecting college' });
    }
};

// Approve recruiter
export const approveRecruiter = async (req: Request, res: Response) => {
    try {
        const { recruiterId } = req.params;
        const adminId = req.user?.userId; // Get adminId from authenticated user

        if (!Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }

        const recruiter = await Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        // Update recruiter approval status
        recruiter.approvalStatus = 'approved';
        // Only set approvedBy if adminId is a valid ObjectId (not config admin)
        if (adminId !== 'admin' && adminId) {
            recruiter.approvedBy = adminId;
        }
        recruiter.approvedAt = new Date();
        recruiter.isVerified = true;
        await recruiter.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: 'approved_recruiter',
                            targetType: 'recruiter',
                            targetId: recruiterId,
                            timestamp: new Date(),
                            details: `Approved recruiter: ${recruiter.companyInfo.name}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: 'Recruiter approved successfully',
            recruiter: recruiter
        });
    } catch (error) {
        console.error('Error approving recruiter:', error);
        res.status(500).json({ message: 'Server error approving recruiter' });
    }
};

// Reject recruiter
export const rejectRecruiter = async (req: Request, res: Response) => {
    try {
        const { recruiterId } = req.params;
        const { rejectionReason } = req.body;
        const adminId = req.user?.userId; // Get adminId from authenticated user

        if (!Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }

        const recruiter = await Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        // Update recruiter approval status
        recruiter.approvalStatus = 'rejected';
        recruiter.rejectionReason = rejectionReason;
        // Only set approvedBy if adminId is a valid ObjectId (not config admin)
        if (adminId !== 'admin' && adminId) {
            recruiter.approvedBy = adminId;
        }
        recruiter.approvedAt = new Date();
        await recruiter.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: 'rejected_recruiter',
                            targetType: 'recruiter',
                            targetId: recruiterId,
                            timestamp: new Date(),
                            details: `Rejected recruiter: ${recruiter.companyInfo.name}. Reason: ${rejectionReason}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: 'Recruiter rejected successfully',
            recruiter: recruiter
        });
    } catch (error) {
        console.error('Error rejecting recruiter:', error);
        res.status(500).json({ message: 'Server error rejecting recruiter' });
    }
};

// Get admin dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalColleges = await College.countDocuments();
        const totalRecruiters = await Recruiter.countDocuments();
        const pendingColleges = await College.countDocuments({ approvalStatus: 'pending' });
        const pendingRecruiters = await Recruiter.countDocuments({ approvalStatus: 'pending' });
        const approvedColleges = await College.countDocuments({ approvalStatus: 'approved' });
        const approvedRecruiters = await Recruiter.countDocuments({ approvalStatus: 'approved' });
        const rejectedColleges = await College.countDocuments({ approvalStatus: 'rejected' });
        const rejectedRecruiters = await Recruiter.countDocuments({ approvalStatus: 'rejected' });

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
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

// Get college details for admin review
export const getCollegeDetails = async (req: Request, res: Response) => {
    try {
        const { collegeId } = req.params;

        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }

        const college = await College.findById(collegeId)
            .populate('userId', 'email phone createdAt')
            .lean();

        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.status(200).json(college);
    } catch (error) {
        console.error('Error fetching college details:', error);
        res.status(500).json({ message: 'Server error fetching college details' });
    }
};

// Get recruiter details for admin review
export const getRecruiterDetails = async (req: Request, res: Response) => {
    try {
        const { recruiterId } = req.params;

        if (!Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }

        const recruiter = await Recruiter.findById(recruiterId)
            .populate('userId', 'email phone createdAt')
            .lean();

        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        res.status(200).json(recruiter);
    } catch (error) {
        console.error('Error fetching recruiter details:', error);
        res.status(500).json({ message: 'Server error fetching recruiter details' });
    }
};

// Get admin profile
export const getAdminProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const admin = await Admin.findOne({ userId })
            .populate('userId', 'email phone createdAt')
            .lean();

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json(admin);
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({ message: 'Server error fetching admin profile' });
    }
};

// Handle document upload for resubmission
export const handleDocumentUpload = async (req: Request, res: Response) => {
    try {
        const { entityType, entityId } = req.params;
        const { documentUrls, resubmissionNotes } = req.body;

        if (!Types.ObjectId.isValid(entityId)) {
            return res.status(400).json({ message: 'Invalid entity ID' });
        }

        if (entityType === 'college') {
            const college = await College.findById(entityId);
            if (!college) {
                return res.status(404).json({ message: 'College not found' });
            }

            college.submittedDocuments = documentUrls;
            college.resubmissionNotes = resubmissionNotes;
            college.approvalStatus = 'pending'; // Reset to pending for review
            await college.save();

            res.status(200).json({ message: 'Documents uploaded successfully', college });
        } else if (entityType === 'recruiter') {
            const recruiter = await Recruiter.findById(entityId);
            if (!recruiter) {
                return res.status(404).json({ message: 'Recruiter not found' });
            }

            recruiter.submittedDocuments = documentUrls;
            recruiter.resubmissionNotes = resubmissionNotes;
            recruiter.approvalStatus = 'pending'; // Reset to pending for review
            await recruiter.save();

            res.status(200).json({ message: 'Documents uploaded successfully', recruiter });
        } else {
            return res.status(400).json({ message: 'Invalid entity type' });
        }
    } catch (error) {
        console.error('Error handling document upload:', error);
        res.status(500).json({ message: 'Server error handling document upload' });
    }
};

// Get all colleges with their status
export const getAllColleges = async (req: Request, res: Response) => {
    try {
        const colleges = await College.find({})
            .populate('userId', 'email phone createdAt')
            .select('name shortName domainCode approvalStatus isActive createdAt userId')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(colleges);
    } catch (error) {
        console.error('Error fetching all colleges:', error);
        res.status(500).json({ message: 'Server error fetching colleges' });
    }
};

// Get all recruiters with their status
export const getAllRecruiters = async (req: Request, res: Response) => {
    try {
        const recruiters = await Recruiter.find({})
            .populate('userId', 'email phone createdAt')
            .select('companyInfo recruiterProfile approvalStatus isActive createdAt userId')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json(recruiters);
    } catch (error) {
        console.error('Error fetching all recruiters:', error);
        res.status(500).json({ message: 'Server error fetching recruiters' });
    }
};

// Deactivate college
export const deactivateCollege = async (req: Request, res: Response) => {
    try {
        const { collegeId } = req.params;
        const { reason, adminId } = req.body;

        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }

        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        college.isActive = false;
        await college.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: 'deactivated_college',
                            targetType: 'college',
                            targetId: collegeId,
                            timestamp: new Date(),
                            details: `Deactivated college: ${college.name}. Reason: ${reason || 'No reason provided'}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: 'College deactivated successfully',
            college: college
        });
    } catch (error) {
        console.error('Error deactivating college:', error);
        res.status(500).json({ message: 'Server error deactivating college' });
    }
};

// Activate college
export const activateCollege = async (req: Request, res: Response) => {
    try {
        const { collegeId } = req.params;
        const { notes, adminId } = req.body;

        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }

        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        college.isActive = true;
        await college.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: 'activated_college',
                            targetType: 'college',
                            targetId: collegeId,
                            timestamp: new Date(),
                            details: `Activated college: ${college.name}. Notes: ${notes || 'No notes provided'}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: 'College activated successfully',
            college: college
        });
    } catch (error) {
        console.error('Error activating college:', error);
        res.status(500).json({ message: 'Server error activating college' });
    }
};

// Deactivate recruiter
export const deactivateRecruiter = async (req: Request, res: Response) => {
    try {
        const { recruiterId } = req.params;
        const { reason, adminId } = req.body;

        if (!Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }

        const recruiter = await Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        recruiter.isActive = false;
        await recruiter.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: 'deactivated_recruiter',
                            targetType: 'recruiter',
                            targetId: recruiterId,
                            timestamp: new Date(),
                            details: `Deactivated recruiter: ${recruiter.companyInfo.name}. Reason: ${reason || 'No reason provided'}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: 'Recruiter deactivated successfully',
            recruiter: recruiter
        });
    } catch (error) {
        console.error('Error deactivating recruiter:', error);
        res.status(500).json({ message: 'Server error deactivating recruiter' });
    }
};

// Activate recruiter
export const activateRecruiter = async (req: Request, res: Response) => {
    try {
        const { recruiterId } = req.params;
        const { notes, adminId } = req.body;

        if (!Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }

        const recruiter = await Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        recruiter.isActive = true;
        await recruiter.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: 'activated_recruiter',
                            targetType: 'recruiter',
                            targetId: recruiterId,
                            timestamp: new Date(),
                            details: `Activated recruiter: ${recruiter.companyInfo.name}. Notes: ${notes || 'No notes provided'}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: 'Recruiter activated successfully',
            recruiter: recruiter
        });
    } catch (error) {
        console.error('Error activating recruiter:', error);
        res.status(500).json({ message: 'Server error activating recruiter' });
    }
};

// Suspend/Unsuspend college
export const suspendCollege = async (req: Request, res: Response) => {
    try {
        const { collegeId } = req.params;
        const { reason, notes, adminId } = req.body;

        if (!Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ message: 'Invalid college ID' });
        }

        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        // Toggle suspension status
        college.isActive = !college.isActive;
        college.rejectionReason = reason;
        college.resubmissionNotes = notes;
        await college.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: college.isActive ? 'unsuspended_college' : 'suspended_college',
                            targetType: 'college',
                            targetId: collegeId,
                            timestamp: new Date(),
                            details: `${college.isActive ? 'Unsuspended' : 'Suspended'} college: ${college.name}. Reason: ${reason || 'No reason provided'}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: `College ${college.isActive ? 'unsuspended' : 'suspended'} successfully`,
            college: college
        });
    } catch (error) {
        console.error('Error updating college status:', error);
        res.status(500).json({ message: 'Server error updating college status' });
    }
};

// Suspend/Unsuspend recruiter
export const suspendRecruiter = async (req: Request, res: Response) => {
    try {
        const { recruiterId } = req.params;
        const { reason, notes, adminId } = req.body;

        if (!Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ message: 'Invalid recruiter ID' });
        }

        const recruiter = await Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        // Toggle suspension status
        recruiter.isActive = !recruiter.isActive;
        recruiter.rejectionReason = reason;
        recruiter.resubmissionNotes = notes;
        await recruiter.save();

        // Log admin activity
        if (adminId && adminId !== 'admin') {
            await Admin.findOneAndUpdate(
                { userId: adminId },
                {
                    $push: {
                        activityLog: {
                            action: recruiter.isActive ? 'unsuspended_recruiter' : 'suspended_recruiter',
                            targetType: 'recruiter',
                            targetId: recruiterId,
                            timestamp: new Date(),
                            details: `${recruiter.isActive ? 'Unsuspended' : 'Suspended'} recruiter: ${recruiter.companyInfo.name}. Reason: ${reason || 'No reason provided'}`
                        }
                    }
                }
            );
        }

        res.status(200).json({ 
            message: `Recruiter ${recruiter.isActive ? 'unsuspended' : 'suspended'} successfully`,
            recruiter: recruiter
        });
    } catch (error) {
        console.error('Error updating recruiter status:', error);
        res.status(500).json({ message: 'Server error updating recruiter status' });
    }
};
