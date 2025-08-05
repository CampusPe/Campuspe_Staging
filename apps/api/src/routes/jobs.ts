import express from 'express';
import { 
    getAllJobs, 
    getJobById, 
    createJob, 
    updateJob, 
    deleteJob,
    publishJob,
    getJobMatchingStats,
    findMatchingStudents,
    triggerJobAlerts,
    sendWhatsAppToStudents,
    getJobNotificationHistory
} from '../controllers/jobs';
import {
    applyForJob,
    getResumeImprovementSuggestions,
    getJobApplications,
    getResumeAnalysis,
    getCurrentUserResumeAnalysis,
    analyzeResumeOnly
} from '../controllers/job-applications';
import authMiddleware from '../middleware/auth';
import { checkRecruiterAccess } from '../middleware/entityAccess';

const router = express.Router();

// Route to get all jobs
router.get('/', getAllJobs);

// Route to get job by ID
router.get('/:jobId', getJobById);

// Route to get job matching statistics
router.get('/:jobId/stats', getJobMatchingStats);

// Route to find matching students for a job
router.get('/:jobId/matches', findMatchingStudents);

// Route to create a new job
router.post('/', authMiddleware, checkRecruiterAccess, createJob);

// Route to publish job and trigger matching
router.post('/:jobId/publish', publishJob);

// Route to manually trigger job alerts
router.post('/:jobId/alerts', triggerJobAlerts);

// Route to send WhatsApp messages to selected students
router.post('/:jobId/whatsapp', authMiddleware, checkRecruiterAccess, sendWhatsAppToStudents);

// Route to get WhatsApp notification history
router.get('/:jobId/notifications', authMiddleware, getJobNotificationHistory);

// Route to update a job
router.put('/:jobId', updateJob);

// Route to delete a job
router.delete('/:jobId', deleteJob);

// Job Application Routes (with AI Resume Matching)

// Route for students to apply for a job with AI analysis
router.post('/:jobId/apply', authMiddleware, applyForJob);

// Route for students to analyze resume without applying
router.post('/:jobId/analyze-resume', authMiddleware, analyzeResumeOnly);

// Route for students to get resume improvement suggestions
router.post('/:jobId/improve-resume', authMiddleware, getResumeImprovementSuggestions);

// Route for recruiters to get all applications for a job (sorted by match score)
router.get('/:jobId/applications', authMiddleware, getJobApplications);

// Route to get resume analysis for current authenticated user and specific job (must come before parameterized route)
router.get('/:jobId/resume-analysis/current', authMiddleware, getCurrentUserResumeAnalysis);

// Route to get detailed resume analysis for a specific student-job combination
router.get('/:jobId/resume-analysis/:studentId', authMiddleware, getResumeAnalysis);

export default router;
