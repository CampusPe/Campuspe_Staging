import express from 'express';
import {
    getColleges,
    getCollegeById,
    getCollegeByUserId,
    createCollege,
    updateCollege,
    updateCollegeByUserId,
    deleteCollege,
    manageRecruiterApproval,
    getCollegeStats,
    searchColleges,
    resubmitCollege
} from '../controllers/colleges';
import { getStudentsByCollege } from '../controllers/students';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Search colleges
router.get('/search', searchColleges);

// Get college statistics
router.get('/:id/stats', getCollegeStats);

// Get all colleges
router.get('/', getColleges);

// Get college by user ID
router.get('/user/:userId', getCollegeByUserId);

// Get college by ID
router.get('/:id', getCollegeById);

// Create new college
router.post('/', createCollege);

// Manage recruiter approval/rejection
router.patch('/:collegeId/recruiters/:recruiterId', manageRecruiterApproval);

// Update college by user ID
router.put('/user/:userId', updateCollegeByUserId);

// Update college
router.put('/:id', updateCollege);

// Resubmit college application
router.post('/resubmit', authMiddleware, resubmitCollege);

// Delete college
router.delete('/:id', deleteCollege);


router.get('/', getStudentsByCollege);

export default router;
