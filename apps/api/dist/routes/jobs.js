"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobs_1 = require("../controllers/jobs");
const job_applications_1 = require("../controllers/job-applications");
const invitations_1 = require("../controllers/invitations");
const Job_1 = require("../models/Job");
const auth_1 = __importDefault(require("../middleware/auth"));
const entityAccess_1 = require("../middleware/entityAccess");
const router = express_1.default.Router();
router.get('/', jobs_1.getAllJobs);
router.get('/recruiter-jobs', auth_1.default, entityAccess_1.checkRecruiterAccess, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        const jobs = await Job_1.Job.find({ recruiterId: recruiter._id })
            .populate('recruiterId', 'companyInfo.name')
            .sort({ createdAt: -1 });
        const { Application } = require('../models/Application');
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const applicantsCount = await Application.countDocuments({ jobId: job._id });
            return {
                ...job.toJSON(),
                applicantsCount
            };
        }));
        res.status(200).json(jobsWithCounts);
    }
    catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/my-jobs', auth_1.default, entityAccess_1.checkRecruiterAccess, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        const jobs = await Job_1.Job.find({ recruiterId: recruiter._id })
            .populate('recruiterId', 'companyInfo.name')
            .sort({ createdAt: -1 });
        const { Application } = require('../models/Application');
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const applicantsCount = await Application.countDocuments({ jobId: job._id });
            return {
                ...job.toJSON(),
                applicantsCount
            };
        }));
        res.status(200).json(jobsWithCounts);
    }
    catch (error) {
        console.error('Error fetching recruiter jobs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/:jobId', jobs_1.getJobById);
router.get('/:jobId/stats', jobs_1.getJobMatchingStats);
router.get('/:jobId/matches', jobs_1.findMatchingStudents);
router.post('/', auth_1.default, entityAccess_1.checkRecruiterAccess, jobs_1.createJob);
router.post('/:jobId/publish', jobs_1.publishJob);
router.post('/:jobId/alerts', jobs_1.triggerJobAlerts);
router.post('/:jobId/whatsapp', auth_1.default, entityAccess_1.checkRecruiterAccess, jobs_1.sendWhatsAppToStudents);
router.get('/:jobId/notifications', auth_1.default, jobs_1.getJobNotificationHistory);
router.post('/:jobId/invitations', auth_1.default, entityAccess_1.checkRecruiterAccess, invitations_1.createJobInvitations);
router.get('/:jobId/invitations', auth_1.default, entityAccess_1.checkRecruiterAccess, invitations_1.getJobInvitations);
router.put('/:jobId', jobs_1.updateJob);
router.delete('/:jobId', jobs_1.deleteJob);
router.post('/:jobId/apply', auth_1.default, job_applications_1.applyForJob);
router.post('/:jobId/analyze-resume', auth_1.default, job_applications_1.analyzeResumeOnly);
router.post('/:jobId/improve-resume', auth_1.default, job_applications_1.getResumeImprovementSuggestions);
router.get('/:jobId/applications', auth_1.default, job_applications_1.getJobApplications);
router.get('/:jobId/resume-analysis/current', auth_1.default, job_applications_1.getCurrentUserResumeAnalysis);
router.get('/:jobId/resume-analysis/:studentId', auth_1.default, job_applications_1.getResumeAnalysis);
exports.default = router;
