"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const interview_slots_1 = require("../controllers/interview-slots");
const auth_1 = __importDefault(require("../middleware/auth"));
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const router = express_1.default.Router();
router.post('/jobs/:jobId/interview-slots', auth_1.default, (0, roleMiddleware_1.roleMiddleware)(['recruiter']), interview_slots_1.createInterviewSlots);
router.post('/interview-slots/:slotId/publish', auth_1.default, (0, roleMiddleware_1.roleMiddleware)(['recruiter']), interview_slots_1.publishInterviewSlot);
router.get('/jobs/:jobId/interview-slots', auth_1.default, interview_slots_1.getJobInterviewSlots);
router.post('/interview-slots/:slotId/confirm/:studentId', auth_1.default, (0, roleMiddleware_1.roleMiddleware)(['student']), interview_slots_1.confirmAttendance);
router.post('/interview-slots/:slotId/attendance/:studentId', auth_1.default, (0, roleMiddleware_1.roleMiddleware)(['recruiter', 'admin']), interview_slots_1.markAttendance);
router.get('/interview-slots/upcoming', auth_1.default, interview_slots_1.getUpcomingInterviewSlots);
router.get('/student/assignments', auth_1.default, (0, roleMiddleware_1.roleMiddleware)(['student']), async (req, res) => {
    try {
        const studentId = req.user?.studentId || req.user?.id;
        if (!studentId) {
            return res.status(401).json({ message: 'Student not found' });
        }
        res.status(200).json([]);
    }
    catch (error) {
        console.error('Error fetching student interview assignments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get("/my-interviews", auth_1.default, async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        const { Application } = require('../models/Application');
        const applications = await Application.find({
            recruiterId: recruiter._id,
            currentStatus: { $in: ['interview_scheduled', 'interview_completed'] }
        })
            .populate('studentId', 'firstName lastName email phoneNumber')
            .populate('jobId', 'title companyName')
            .sort({ 'interviews.0.scheduledAt': 1 });
        const interviews = applications.flatMap((app) => app.interviews?.map((interview) => ({
            _id: interview._id || new (require('mongoose')).Types.ObjectId(),
            jobId: app.jobId._id,
            jobTitle: app.jobId.title,
            applicationId: app._id,
            studentId: app.studentId._id,
            studentName: `${app.studentId.firstName} ${app.studentId.lastName}`,
            studentEmail: app.studentId.email,
            interviewDate: interview.scheduledAt,
            interviewTime: interview.scheduledAt,
            duration: interview.duration || 60,
            type: interview.mode === 'online' ? 'online' : 'offline',
            meetingLink: interview.meetingLink,
            location: interview.location,
            status: interview.status,
            feedback: interview.feedback,
            interviewerName: interview.interviewers?.join(', ') || '',
            round: 1,
            notes: interview.feedback
        })) || []);
        res.status(200).json(interviews);
    }
    catch (error) {
        console.error('Error fetching recruiter interviews:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
