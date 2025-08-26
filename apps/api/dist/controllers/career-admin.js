"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemConfig = exports.getCandidateManagement = exports.getNotificationHistory = exports.testAIAnalysis = exports.getMatchingAnalytics = exports.triggerDailyAlerts = exports.processAllActiveJobs = exports.getSystemStats = void 0;
const job_posting_1 = __importDefault(require("../services/job-posting"));
const ai_matching_1 = __importDefault(require("../services/ai-matching"));
const simple_scheduler_1 = __importDefault(require("../services/simple-scheduler"));
const mongoose_1 = require("mongoose");
const getSystemStats = async (req, res) => {
    try {
        const Job = require('../models/Job').Job;
        const Student = require('../models/Student').Student;
        const Notification = require('../models/Notification').Notification;
        const [totalJobs, activeJobs, totalStudents, placementReadyStudents, todayNotifications] = await Promise.all([
            Job.countDocuments(),
            Job.countDocuments({ status: 'active' }),
            Student.countDocuments({ isActive: true }),
            Student.countDocuments({ isActive: true, isPlacementReady: true }),
            Notification.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                },
                notificationType: 'job_match'
            })
        ]);
        const recentMatches = await Notification.find({
            notificationType: 'job_match',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).populate('relatedJobId', 'title companyName').limit(10);
        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalJobs,
                    activeJobs,
                    totalStudents,
                    placementReadyStudents,
                    todayNotifications
                },
                recentActivity: {
                    jobMatchesLast24h: recentMatches.length,
                    recentMatches: recentMatches.map((match) => ({
                        studentId: match.recipientId,
                        jobTitle: match.relatedJobId?.title || 'Unknown',
                        company: match.relatedJobId?.companyName || 'Unknown',
                        matchScore: match.metadata?.matchScore || 0,
                        timestamp: match.createdAt
                    }))
                },
                systemHealth: {
                    aiServiceActive: !!process.env.OPENAI_API_KEY,
                    whatsappServiceActive: !!process.env.WABB_API_KEY,
                    schedulerStatus: simple_scheduler_1.default.getStatus()
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get system statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getSystemStats = getSystemStats;
const processAllActiveJobs = async (req, res) => {
    try {
        const Job = require('../models/Job').Job;
        const activeJobs = await Job.find({
            status: 'active',
            applicationDeadline: { $gt: new Date() }
        }).select('_id title companyName').lean();
        setImmediate(async () => {
            const jobIds = activeJobs.map((job) => job._id);
            await job_posting_1.default.processMultipleJobs(jobIds);
        });
        res.status(200).json({
            success: true,
            message: `Processing ${activeJobs.length} active jobs in background`,
            data: {
                jobsToProcess: activeJobs.length,
                jobs: activeJobs.map((job) => ({
                    id: job._id,
                    title: job.title,
                    company: job.companyName
                }))
            }
        });
    }
    catch (error) {
        console.error('Error processing all active jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process active jobs',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.processAllActiveJobs = processAllActiveJobs;
const triggerDailyAlerts = async (req, res) => {
    try {
        setImmediate(async () => {
            await simple_scheduler_1.default.triggerDailyJobAlerts();
        });
        res.status(200).json({
            success: true,
            message: 'Daily job alerts triggered successfully'
        });
    }
    catch (error) {
        console.error('Error triggering daily alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger daily alerts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.triggerDailyAlerts = triggerDailyAlerts;
const getMatchingAnalytics = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
        const Notification = require('../models/Notification').Notification;
        const notifications = await Notification.find({
            notificationType: 'job_match',
            createdAt: { $gte: daysAgo }
        }).populate('relatedJobId', 'title companyName');
        const totalAlerts = notifications.length;
        const successfulDeliveries = notifications.filter((n) => n.deliveryStatus?.whatsapp === 'delivered' || n.deliveryStatus?.whatsapp === 'sent').length;
        const avgMatchScore = notifications.reduce((sum, n) => sum + (n.metadata?.matchScore || 0), 0) / (totalAlerts || 1);
        const dailyStats = {};
        notifications.forEach((notification) => {
            const day = notification.createdAt.toISOString().split('T')[0];
            if (!dailyStats[day]) {
                dailyStats[day] = { alerts: 0, delivered: 0 };
            }
            dailyStats[day].alerts++;
            if (notification.deliveryStatus?.whatsapp === 'delivered' ||
                notification.deliveryStatus?.whatsapp === 'sent') {
                dailyStats[day].delivered++;
            }
        });
        const companyStats = {};
        notifications.forEach((notification) => {
            const company = notification.relatedJobId?.companyName || 'Unknown';
            companyStats[company] = (companyStats[company] || 0) + 1;
        });
        const topCompanies = Object.entries(companyStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([company, count]) => ({ company, alerts: count }));
        res.status(200).json({
            success: true,
            data: {
                period: `Last ${days} days`,
                summary: {
                    totalAlerts,
                    successfulDeliveries,
                    deliveryRate: Math.round((successfulDeliveries / (totalAlerts || 1)) * 100),
                    avgMatchScore: Math.round(avgMatchScore)
                },
                dailyBreakdown: Object.entries(dailyStats).map(([date, stats]) => ({
                    date,
                    alerts: stats.alerts,
                    delivered: stats.delivered
                })),
                topCompanies
            }
        });
    }
    catch (error) {
        console.error('Error getting matching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get matching analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getMatchingAnalytics = getMatchingAnalytics;
const testAIAnalysis = async (req, res) => {
    try {
        const { text, type = 'job' } = req.body;
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required for analysis'
            });
        }
        let result;
        if (type === 'job') {
            result = await ai_matching_1.default.analyzeJobDescription(text);
        }
        else if (type === 'resume') {
            result = await ai_matching_1.default.analyzeStudentResume(text);
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Type must be either "job" or "resume"'
            });
        }
        res.status(200).json({
            success: true,
            data: {
                analysisType: type,
                result,
                processedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error testing AI analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test AI analysis',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.testAIAnalysis = testAIAnalysis;
const getNotificationHistory = async (req, res) => {
    try {
        const { recruiterId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const { Notification } = await Promise.resolve().then(() => __importStar(require('../models/Notification')));
        const { Job } = await Promise.resolve().then(() => __importStar(require('../models/Job')));
        const recruiterJobs = await Job.find({ recruiterId: new mongoose_1.Types.ObjectId(recruiterId) }).select('_id');
        const jobIds = recruiterJobs.map(job => job._id);
        const notifications = await Notification.find({
            relatedJobId: { $in: jobIds }
        })
            .populate('relatedJobId', 'title companyName')
            .populate('recipientId', 'personalInfo.firstName personalInfo.lastName personalInfo.phone')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const totalNotifications = await Notification.countDocuments({
            relatedJobId: { $in: jobIds }
        });
        const today = new Date();
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const todayCount = await Notification.countDocuments({
            relatedJobId: { $in: jobIds },
            createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
        });
        const last7DaysCount = await Notification.countDocuments({
            relatedJobId: { $in: jobIds },
            createdAt: { $gte: last7Days }
        });
        const last30DaysCount = await Notification.countDocuments({
            relatedJobId: { $in: jobIds },
            createdAt: { $gte: last30Days }
        });
        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalNotifications / Number(limit)),
                    totalNotifications,
                    hasNext: Number(page) * Number(limit) < totalNotifications
                },
                summary: {
                    today: todayCount,
                    last7Days: last7DaysCount,
                    last30Days: last30DaysCount
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting notification history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notification history',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getNotificationHistory = getNotificationHistory;
const getCandidateManagement = async (req, res) => {
    try {
        const { recruiterId } = req.params;
        const { page = 1, limit = 20, status = 'all' } = req.query;
        const { Application } = await Promise.resolve().then(() => __importStar(require('../models/Application')));
        const { Job } = await Promise.resolve().then(() => __importStar(require('../models/Job')));
        const { Notification } = await Promise.resolve().then(() => __importStar(require('../models/Notification')));
        const recruiterJobs = await Job.find({ recruiterId: new mongoose_1.Types.ObjectId(recruiterId) }).select('_id title');
        const jobIds = recruiterJobs.map(job => job._id);
        let applicationQuery = { jobId: { $in: jobIds } };
        if (status !== 'all') {
            applicationQuery.status = status;
        }
        const applications = await Application.find(applicationQuery)
            .populate('studentId', 'personalInfo academicInfo resumeInfo')
            .populate('jobId', 'title companyName')
            .sort({ appliedAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        const totalApplications = await Application.countDocuments(applicationQuery);
        const candidatesWithNotifications = await Promise.all(applications.map(async (app) => {
            const notificationCount = await Notification.countDocuments({
                recipientId: app.studentId._id,
                relatedJobId: { $in: jobIds }
            });
            return {
                ...app.toObject(),
                notificationsSent: notificationCount
            };
        }));
        const statusStats = await Application.aggregate([
            { $match: { jobId: { $in: jobIds } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        res.status(200).json({
            success: true,
            data: {
                candidates: candidatesWithNotifications,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalApplications / Number(limit)),
                    totalCandidates: totalApplications,
                    hasNext: Number(page) * Number(limit) < totalApplications
                },
                summary: {
                    totalApplications,
                    statusBreakdown: statusStats.reduce((acc, stat) => {
                        acc[stat._id] = stat.count;
                        return acc;
                    }, {})
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting candidate management data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get candidate management data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getCandidateManagement = getCandidateManagement;
const getSystemConfig = async (req, res) => {
    try {
        const config = {
            matching: {
                defaultThreshold: 0.70,
                skillMatchWeight: 0.5,
                toolMatchWeight: 0.1,
                categoryMatchWeight: 0.1,
                workModeMatchWeight: 0.1,
                semanticSimilarityWeight: 0.2
            },
            alerts: {
                dailySchedule: '9:00 AM IST',
                rateLimitDelay: 2000,
                maxRetriesPerAlert: 3
            },
            ai: {
                modelUsed: 'claude-3-haiku-20240307',
                embeddingModel: 'simple-hash-based',
                provider: 'Anthropic Claude',
                enabled: !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY)
            },
            whatsapp: {
                provider: 'WABB.in',
                enabled: !!process.env.WABB_API_KEY
            }
        };
        res.status(200).json({
            success: true,
            data: config
        });
    }
    catch (error) {
        console.error('Error getting system config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get system configuration',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getSystemConfig = getSystemConfig;
