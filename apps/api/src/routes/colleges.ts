import express from 'express';
import multer from 'multer';
import {
    getColleges,
    getCollegeById,
    getCollegeByUserId,
    createCollege,
    updateCollege,
    updateCollegeByUserId,
    updateCollegeProfile,
    deleteCollege,
    manageRecruiterApproval,
    getCollegeStats,
    getCollegeProfile,
    getCollegeStudents,
    getCollegeJobs,
    getCollegePlacements,
    getCollegeEvents,
    searchColleges,
    resubmitCollege,
    getCollegeConnections
} from '../controllers/colleges';
import { getStudentsByCollege } from '../controllers/students';
import authMiddleware from '../middleware/auth';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for supporting documents
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

const router = express.Router();

// College Dashboard Routes (authenticated)
router.get('/profile', authMiddleware, getCollegeProfile);
router.put('/profile', authMiddleware, updateCollegeProfile);
router.get('/stats', authMiddleware, getCollegeStats);
router.get('/students', authMiddleware, getCollegeStudents);
router.get('/jobs', authMiddleware, getCollegeJobs);
router.get('/placements', authMiddleware, getCollegePlacements);
router.get('/events', authMiddleware, getCollegeEvents);

// Import invitation functions
import { getCollegeInvitations, acceptInvitation, declineInvitation, proposeCounterDates } from '../controllers/invitations';

// Add invitation routes for college dashboard
router.get('/invitations', authMiddleware, getCollegeInvitations);
router.post('/invitations/:invitationId/accept', authMiddleware, acceptInvitation);
router.post('/invitations/:invitationId/decline', authMiddleware, declineInvitation);
router.post('/invitations/:invitationId/counter', authMiddleware, proposeCounterDates);

// Search colleges
router.get('/search', searchColleges);

// Get public colleges list (for connections)
router.get('/public', getColleges);

// Get college statistics
router.get('/:id/stats', authMiddleware, getCollegeStats);

// Get all colleges
router.get('/', getColleges);

// Get college by user ID
router.get('/user/:userId', getCollegeByUserId);

// Get college profile by ID (public route)
router.get('/:id/profile', getCollegeById);

// Get college by ID
router.get('/:id', getCollegeById);

// Get college connections
router.get('/:collegeId/connections', getCollegeConnections);

// Create new college
router.post('/', createCollege);

// Manage recruiter approval/rejection
router.patch('/:collegeId/recruiters/:recruiterId', manageRecruiterApproval);

// Update college by user ID
router.put('/user/:userId', updateCollegeByUserId);

// Update college
router.put('/:id', updateCollege);

// Resubmit college application
router.post('/resubmit', authMiddleware, upload.array('supportingDocuments', 10), resubmitCollege);

// Delete college
router.delete('/:id', deleteCollege);


router.get('/', getStudentsByCollege);

export default router;
