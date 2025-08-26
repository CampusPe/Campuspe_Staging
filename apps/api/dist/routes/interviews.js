"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const InterviewSlot_1 = require("../models/InterviewSlot");
const Application_1 = require("../models/Application");
const Notification_1 = require("../models/Notification");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.get('/student/assignments', auth_1.default, async (req, res) => {
    try {
        const user = req.user;
        const { Student } = require('../models/Student');
        const student = await Student.findOne({ userId: user._id });
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }
        const interviews = await InterviewSlot_1.InterviewSlot.find({ studentId: student._id })
            .populate('jobId', 'title companyName')
            .populate('recruiterId', 'companyInfo')
            .populate('applicationId')
            .sort({ createdAt: -1 });
        const formattedInterviews = interviews.map(interview => ({
            _id: interview._id,
            jobTitle: interview.jobId?.title || 'Unknown Job',
            companyName: interview.jobId?.companyName || interview.recruiterId?.companyInfo?.name || 'Unknown Company',
            interviewDate: interview.scheduledDate || new Date(),
            interviewTime: interview.startTime || '10:00 AM',
            status: interview.status,
            type: interview.mode || 'virtual',
            duration: interview.duration || 30,
            meetingLink: interview.virtualMeetingDetails?.meetingId,
            location: interview.location?.venue,
            studentEmail: user.email
        }));
        res.json(formattedInterviews);
    }
    catch (error) {
        console.error('Error fetching student interviews:', error);
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/create-from-application', auth_1.default, async (req, res) => {
    try {
        const { applicationId } = req.body;
        const user = req.user;
        const application = await Application_1.Application.findById(applicationId)
            .populate('studentId', 'firstName lastName email')
            .populate('jobId', 'title companyName');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId: user._id });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        if (application.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const interview = await InterviewSlot_1.InterviewSlot.create({
            jobId: application.jobId._id,
            recruiterId: recruiter._id,
            studentId: application.studentId._id,
            applicationId: application._id,
            status: 'scheduled',
            type: 'initial_screening',
            duration: 30,
            isActive: true,
            createdAt: new Date()
        });
        await Notification_1.Notification.create({
            userId: application.studentId._id,
            type: 'interview_scheduled',
            title: 'Interview Scheduled',
            message: `An interview has been scheduled for your application to ${application.jobId?.title || 'the position'}.`,
            data: {
                applicationId: application._id,
                interviewId: interview._id,
                jobTitle: application.jobId?.title || 'Unknown Job'
            },
            createdAt: new Date()
        });
        res.status(201).json({
            message: 'Interview created successfully',
            interview
        });
    }
    catch (error) {
        console.error('Error creating interview from application:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/my-interviews', auth_1.default, async (req, res) => {
    try {
        const user = req.user;
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId: user._id });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        const interviews = await InterviewSlot_1.InterviewSlot.find({ recruiterId: recruiter._id })
            .populate('studentId', 'firstName lastName email')
            .populate('jobId', 'title companyName')
            .sort({ createdAt: -1 });
        res.status(200).json(interviews);
    }
    catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
