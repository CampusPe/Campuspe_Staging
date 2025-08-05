import express from 'express';
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
    getStudentResumeAnalyses,
    getStudentApplications
} from '../controllers/job-applications';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Search students with filters
router.get('/search', searchStudents);

// Route to get students by college
router.get('/college/:collegeId', getStudentsByCollege);

// Route to get all students
router.get('/', getAllStudents);

// Route to get a student by user ID
router.get('/user/:userId', getStudentByUserId);

// Route to get a student by ID
router.get('/:id', getStudentById);

// Route to get job matches for a student
router.get('/:id/matches', getStudentJobMatches);

// Route to analyze student profile with AI
router.get('/:id/analyze', analyzeStudentProfile);

// Route to get resume analyses for a student (AI matching results)
router.get('/:id/resume-analyses', authMiddleware, getStudentResumeAnalyses);

// Route to get applications for a student  
router.get('/applications', authMiddleware, getStudentApplications);

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