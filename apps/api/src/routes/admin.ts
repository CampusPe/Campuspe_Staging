import express from 'express';
import {
    getPendingApprovals,
    approveCollege,
    rejectCollege,
    approveRecruiter,
    rejectRecruiter,
    getDashboardStats,
    getCollegeDetails,
    getRecruiterDetails,
    getAdminProfile,
    handleDocumentUpload,
    getAllColleges,
    getAllRecruiters,
    deactivateCollege,
    activateCollege,
    deactivateRecruiter,
    activateRecruiter,
    suspendCollege,
    suspendRecruiter
} from '../controllers/admin';
import authMiddleware from '../middleware/auth';
import { adminMiddleware, checkPermission } from '../middleware/adminAuth';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard statistics
router.get('/dashboard/stats', checkPermission('view_analytics'), getDashboardStats);

// Get pending approvals
router.get('/pending-approvals', getPendingApprovals);

// Get all entities
router.get('/colleges', getAllColleges);
router.get('/recruiters', getAllRecruiters);

// College approval routes
router.get('/colleges/:collegeId', getCollegeDetails);
router.post('/colleges/:collegeId/approve', checkPermission('approve_colleges'), approveCollege);
router.post('/colleges/:collegeId/reject', checkPermission('approve_colleges'), rejectCollege);
router.post('/colleges/:collegeId/deactivate', checkPermission('manage_users'), deactivateCollege);
router.post('/colleges/:collegeId/activate', checkPermission('manage_users'), activateCollege);
router.post('/colleges/:collegeId/suspend', checkPermission('manage_users'), suspendCollege);

// Recruiter approval routes
router.get('/recruiters/:recruiterId', getRecruiterDetails);
router.post('/recruiters/:recruiterId/approve', checkPermission('approve_recruiters'), approveRecruiter);
router.post('/recruiters/:recruiterId/reject', checkPermission('approve_recruiters'), rejectRecruiter);
router.post('/recruiters/:recruiterId/deactivate', checkPermission('manage_users'), deactivateRecruiter);
router.post('/recruiters/:recruiterId/activate', checkPermission('manage_users'), activateRecruiter);
router.post('/recruiters/:recruiterId/suspend', checkPermission('manage_users'), suspendRecruiter);

// Admin profile
router.get('/profile/:userId', getAdminProfile);

// Document upload for resubmission
router.post('/documents/:entityType/:entityId', handleDocumentUpload);

export default router;
