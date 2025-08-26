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
import {
    createJobInvitations,
    getJobInvitations
} from '../controllers/invitations';
import { Job } from '../models/Job';
import authMiddleware from '../middleware/auth';
import { checkRecruiterAccess } from '../middleware/entityAccess';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = express.Router();

// Route to get all jobs
router.get('/', getAllJobs);

// Route to get jobs for authenticated recruiter
router.get('/recruiter-jobs', authMiddleware, checkRecruiterAccess, async (req: any, res: any) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Find recruiter first, then get jobs
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        const jobs = await Job.find({ recruiterId: recruiter._id })
            .populate('recruiterId', 'companyInfo.name')
            .sort({ createdAt: -1 });
            
        // Calculate applications count for each job
        const { Application } = require('../models/Application');
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const applicantsCount = await Application.countDocuments({ jobId: job._id });
            return {
                ...job.toJSON(),
                applicantsCount
            };
        }));
            
        res.status(200).json(jobsWithCounts);
    } catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Alias route for my-jobs (used by frontend)
router.get('/my-jobs', authMiddleware, checkRecruiterAccess, async (req: any, res: any) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // Find recruiter first, then get jobs
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        
        const jobs = await Job.find({ recruiterId: recruiter._id })
            .populate('recruiterId', 'companyInfo.name')
            .sort({ createdAt: -1 });
            
        // Calculate applications count for each job
        const { Application } = require('../models/Application');
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const applicantsCount = await Application.countDocuments({ jobId: job._id });
            return {
                ...job.toJSON(),
                applicantsCount
            };
        }));
            
        res.status(200).json(jobsWithCounts);
    } catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

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

// Invitation routes for jobs
router.post('/:jobId/invitations', authMiddleware, checkRecruiterAccess, createJobInvitations);
router.get('/:jobId/invitations', authMiddleware, checkRecruiterAccess, getJobInvitations);

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
