"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const career_alerts_1 = __importDefault(require("./career-alerts"));
class SimpleScheduler {
    constructor() {
        this.intervals = [];
        this.isRunning = false;
    }
    init() {
        console.log('🕐 Initializing scheduler...');
        this.scheduleDailyAt(9, 0, async () => {
            await this.runDailyJobAlerts();
        });
        this.scheduleWeeklyAt(0, 2, 0, async () => {
            await this.runWeeklyCleanup();
        });
        const healthCheckInterval = setInterval(() => {
            this.healthCheck();
        }, 60 * 60 * 1000);
        this.intervals.push(healthCheckInterval);
        console.log('✅ Scheduler initialized');
    }
    scheduleDailyAt(hour, minute, task) {
        const scheduleNext = () => {
            const now = new Date();
            const next = new Date();
            next.setHours(hour, minute, 0, 0);
            if (next <= now) {
                next.setDate(next.getDate() + 1);
            }
            const msUntilNext = next.getTime() - now.getTime();
            const timeout = setTimeout(async () => {
                await task();
                scheduleNext();
            }, msUntilNext);
            this.intervals.push(timeout);
        };
        scheduleNext();
    }
    scheduleWeeklyAt(dayOfWeek, hour, minute, task) {
        const scheduleNext = () => {
            const now = new Date();
            const next = new Date();
            const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
            next.setDate(now.getDate() + daysUntilTarget);
            next.setHours(hour, minute, 0, 0);
            if (next <= now) {
                next.setDate(next.getDate() + 7);
            }
            const msUntilNext = next.getTime() - now.getTime();
            const timeout = setTimeout(async () => {
                await task();
                scheduleNext();
            }, msUntilNext);
            this.intervals.push(timeout);
        };
        scheduleNext();
    }
    async runDailyJobAlerts() {
        if (this.isRunning) {
            console.log('⚠️ Daily alerts already running, skipping...');
            return;
        }
        this.isRunning = true;
        try {
            console.log('🚀 Running daily job alerts...');
            await career_alerts_1.default.processDailyJobAlerts();
            console.log('✅ Daily job alerts completed');
        }
        catch (error) {
            console.error('❌ Daily job alerts failed:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    async runWeeklyCleanup() {
        try {
            console.log('🧹 Running weekly cleanup...');
            const { Job } = require('../models/Job');
            const { Notification } = require('../models/Notification');
            const expiredResult = await Job.updateMany({ applicationDeadline: { $lt: new Date() }, status: 'active' }, { $set: { status: 'expired' } });
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const cleanupResult = await Notification.deleteMany({
                createdAt: { $lt: thirtyDaysAgo },
                'deliveryStatus.whatsapp': { $in: ['sent', 'delivered'] }
            });
            console.log(`✅ Cleanup complete: ${expiredResult.modifiedCount} jobs expired, ${cleanupResult.deletedCount} notifications cleaned`);
        }
        catch (error) {
            console.error('❌ Weekly cleanup failed:', error);
        }
    }
    async healthCheck() {
        try {
            const { Job } = require('../models/Job');
            const activeJobs = await Job.countDocuments({ status: 'active' });
            console.log(`💚 Health: ${activeJobs} active jobs`);
        }
        catch (error) {
            console.error('❌ Health check failed:', error);
        }
    }
    async triggerDailyJobAlerts() {
        await this.runDailyJobAlerts();
    }
    async triggerWeeklyCleanup() {
        await this.runWeeklyCleanup();
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalCount: this.intervals.length,
            schedules: {
                dailyAlerts: '9:00 AM daily',
                weeklyCleanup: '2:00 AM Sundays',
                healthCheck: 'Every hour'
            }
        };
    }
    shutdown() {
        console.log('🛑 Shutting down scheduler...');
        this.intervals.forEach(interval => {
            if (typeof interval === 'number') {
                clearTimeout(interval);
            }
            else {
                clearInterval(interval);
            }
        });
        this.intervals = [];
        console.log('✅ Scheduler shutdown complete');
    }
}
exports.default = new SimpleScheduler();
