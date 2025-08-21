"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Notification_1 = require("../models/Notification");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.get('/', auth_1.default, async (req, res) => {
    try {
        const user = req.user;
        const notifications = await Notification_1.Notification.find({
            recipientId: user._id
        })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/send', auth_1.default, async (req, res) => {
    try {
        const { type, applicationId, message, studentId } = req.body;
        const user = req.user;
        let targetUserId = studentId;
        if (applicationId && !targetUserId) {
            const { Application } = require('../models/Application');
            const application = await Application.findById(applicationId).populate('studentId');
            if (application && application.studentId) {
                targetUserId = application.studentId._id;
            }
        }
        if (!targetUserId) {
            return res.status(400).json({ message: 'Target user not found' });
        }
        const notification = await Notification_1.Notification.create({
            userId: targetUserId,
            type: type || 'general',
            title: getNotificationTitle(type),
            message: message || 'You have a new notification',
            data: {
                applicationId,
                senderId: user._id,
                senderRole: user.role
            },
            createdAt: new Date()
        });
        res.status(201).json({ message: 'Notification sent successfully', notification });
    }
    catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/my-notifications', auth_1.default, async (req, res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification_1.Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json(notifications);
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.patch('/:notificationId/read', auth_1.default, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;
        const notification = await Notification_1.Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true, readAt: new Date() }, { new: true });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.status(200).json(notification);
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
function getNotificationTitle(type) {
    switch (type) {
        case 'job_selection':
        case 'application_accepted':
            return 'Application Accepted!';
        case 'application_rejected':
            return 'Application Status Update';
        case 'interview_scheduled':
            return 'Interview Scheduled';
        case 'job_match':
            return 'New Job Match Found';
        default:
            return 'Notification';
    }
}
exports.default = router;
