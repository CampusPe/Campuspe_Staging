"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Application_1 = require("../models/Application");
const auth_1 = __importDefault(require("../middleware/auth"));
const entityAccess_1 = require("../middleware/entityAccess");
const router = express_1.default.Router();
router.get('/my-applications', auth_1.default, entityAccess_1.checkRecruiterAccess, async (req, res) => {
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
        const applications = await Application_1.Application.find({ recruiterId: recruiter._id })
            .populate('studentId', 'firstName lastName email phoneNumber')
            .populate('jobId', 'title companyName location')
            .sort({ appliedAt: -1 });
        res.status(200).json(applications);
    }
    catch (error) {
        console.error('Error fetching recruiter applications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.patch('/:applicationId/status', auth_1.default, entityAccess_1.checkRecruiterAccess, async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        const application = await Application_1.Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        if (application.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        application.currentStatus = status;
        application.statusHistory.push({
            status,
            updatedAt: new Date(),
            updatedBy: userId,
            notes: `Status updated to ${status}`
        });
        await application.save();
        res.status(200).json(application);
    }
    catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.delete('/:applicationId', auth_1.default, entityAccess_1.checkRecruiterAccess, async (req, res) => {
    try {
        const { applicationId } = req.params;
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { Recruiter } = require('../models/Recruiter');
        const recruiter = await Recruiter.findOne({ userId });
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter profile not found' });
        }
        const application = await Application_1.Application.findById(applicationId)
            .populate('studentId', 'email firstName lastName')
            .populate('jobId', 'title companyName');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        if (application.recruiterId.toString() !== recruiter._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        try {
            const { Notification } = require('../models/Notification');
            await Notification.create({
                userId: application.studentId._id,
                type: 'application_rejected',
                title: 'Application Status Update',
                message: `Your application has been rejected and removed from our system.`,
                data: {
                    applicationId: application._id,
                    jobTitle: application.jobId?.title || 'Unknown Job'
                },
                createdAt: new Date()
            });
        }
        catch (notificationError) {
            console.error('Error sending notification:', notificationError);
        }
        await Application_1.Application.findByIdAndDelete(applicationId);
        res.status(200).json({ message: 'Application rejected and deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
