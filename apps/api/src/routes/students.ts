import express from 'express';
import multer from 'multer';
import { 
    getAllStudents, 
    getStudentById, 
    getStudentByUserId,
    createStudent, 
    updateStudent, 
    updateStudentByUserId,
    deleteStudent,
    getStudentsByCollege,
    searchStudents
} from '../controllers/students';
import {
    updateStudentProfile,
    getStudentJobMatches,
    triggerStudentJobAlerts,
    analyzeStudentProfile
} from '../controllers/student-career';
import {
    getResumeAnalysis,
    getStudentApplications
} from '../controllers/job-applications';
import {
    getEnhancedStudentApplications,
    updateApplicationStatus
} from '../controllers/student-applications-enhanced';
import authMiddleware from '../middleware/auth';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
});

const router = express.Router();

// Search students with filters
router.get('/search', searchStudents);

// Resume upload endpoint for registration
router.post('/upload-resume', upload.single('resume'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file provided'
      });
    }

    // Here you would typically:
    // 1. Upload file to cloud storage (Azure Blob, AWS S3, etc.)
    // 2. Extract text using OCR/parsing service
    // 3. Analyze resume using AI service
    // 4. Store analysis results
    
    // For now, return a mock response
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Simulate processing
    setTimeout(() => {
      console.log(`Resume analysis completed for ${req.file.originalname} with ID: ${analysisId}`);
    }, 1000);

    res.json({
      success: true,
      message: 'Resume uploaded and analysis started',
      analysisId,
      filename: req.file.originalname,
      size: req.file.size
    });
    
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume'
    });
  }
});

// Route to get students by college
router.get('/college/:collegeId', getStudentsByCollege);

// Route to get applications for a student - MOVED UP BEFORE /:id
router.get('/applications', authMiddleware, getStudentApplications);

// Enhanced applications endpoint with real-time features
router.get('/applications/enhanced', authMiddleware, getEnhancedStudentApplications);

// Update application status (for real-time testing)
router.patch('/applications/:applicationId/status', authMiddleware, updateApplicationStatus);

// Route to get all students
router.get('/', getAllStudents);

// Route to get a student by user ID
router.get('/user/:userId', getStudentByUserId);

// Route to get current student's own profile - MOVED UP BEFORE /:id
router.get('/profile', authMiddleware, async (req: any, res: any) => {
  try {
    const user = req.user;
    
    const { Student } = require('../models/Student');
    const student = await Student.findOne({ userId: user._id })
      .populate('collegeId', 'name address')
      .populate('userId', 'email')
      .select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Route to get a student by ID
router.get('/:id', getStudentById);

// Route to get student profile for recruiters (detailed view)
router.get('/:id/profile', authMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Only allow recruiters to view student profiles
    if (user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { Student } = require('../models/Student');
    const student = await Student.findById(id)
      .populate('collegeId', 'name address')
      .populate('userId', 'email')
      .select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get job matches for a student
router.get('/:id/matches', getStudentJobMatches);

// Route to analyze student profile with AI
router.get('/:id/analyze', analyzeStudentProfile);

// Route to get resume analyses for a student (AI matching results)
router.get('/:id/resume-analyses', authMiddleware, getResumeAnalysis);

// Route to create a new student
router.post('/', createStudent);

// Route to trigger job alerts for a student
router.post('/:id/alerts', triggerStudentJobAlerts);

// Route to update a student profile (with job matching)
router.put('/:id/profile', updateStudentProfile);

// Route to update a student by user ID
router.put('/user/:userId', updateStudentByUserId);

// Route to update a student by ID
router.put('/:id', updateStudent);

// Route to delete a student by ID
router.delete('/:id', deleteStudent);

export default router;