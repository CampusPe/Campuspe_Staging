import CareerAlertService from './career-alerts';
import { Job } from '../models/Job';

class ScheduledJobsService {
    private intervals: NodeJS.Timeout[] = [];
    private isRunning = false;

    /**
     * Initialize scheduled tasks
     */
    init(): void {
        console.log('🕐 Initializing simple scheduler...');

        // Daily job alerts at 9:00 AM IST (every 24 hours)
        this.scheduleDailyTask(9, 0, async () => {
            console.log('⏰ Running daily job alerts...');
            await this.runDailyJobAlerts();
        });

        // Weekly cleanup (every 7 days at 2:00 AM)
        this.scheduleWeeklyTask(0, 2, 0, async () => {
            console.log('🗑️ Running weekly cleanup...');
            await this.runWeeklyCleanup();
        });

        // Health check every hour
        const hourlyInterval = setInterval(async () => {
            await this.healthCheck();
        }, 60 * 60 * 1000); // 1 hour

        this.intervals.push(hourlyInterval);

        console.log('✅ Simple scheduler initialized successfully');
    }

    /**
     * Schedule a daily task at specific hour and minute
     */
    private scheduleDailyTask(hour: number, minute: number, task: () => Promise<void>): void {
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hour, minute, 0, 0);

        // If the scheduled time has already passed today, schedule for tomorrow
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const delay = scheduledTime.getTime() - now.getTime();

        setTimeout(() => {
            task();
            // Schedule the next execution (24 hours later)
            const dailyInterval = setInterval(task, 24 * 60 * 60 * 1000);
            this.intervals.push(dailyInterval);
        }, delay);
    }

    /**
     * Schedule a weekly task at specific day, hour, and minute
     */
    private scheduleWeeklyTask(day: number, hour: number, minute: number, task: () => Promise<void>): void {
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setDate(now.getDate() + (day - now.getDay() + 7) % 7);
        scheduledTime.setHours(hour, minute, 0, 0);

        // If the scheduled time has already passed this week, schedule for next week
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 7);
        }

        const delay = scheduledTime.getTime() - now.getTime();

        setTimeout(() => {
            task();
            // Schedule the next execution (7 days later)
            const weeklyInterval = setInterval(task, 7 * 24 * 60 * 60 * 1000);
            this.intervals.push(weeklyInterval);
        }, delay);
    }

    /**
     * Daily job alerts processing
     */
    private async runDailyJobAlerts(): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️ Daily job alerts already running, skipping...');
            return;
        }

        this.isRunning = true;

        try {
            console.log('🚀 Starting daily job alerts processing...');
            
            // Process daily job alerts
            await CareerAlertService.processDailyJobAlerts();
            
            console.log('✅ Daily job alerts completed successfully');
        } catch (error) {
            console.error('❌ Daily job alerts failed:', error);
            
            // Log to monitoring service
            this.logError('DAILY_JOB_ALERTS_FAILED', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Weekly cleanup of expired jobs and notifications
     */
    private async runWeeklyCleanup(): Promise<void> {
        try {
            console.log('🧹 Starting weekly cleanup...');

            // Archive expired jobs
            const expiredJobs = await Job.updateMany(
                {
                    applicationDeadline: { $lt: new Date() },
                    status: 'active'
                },
                {
                    $set: { status: 'expired' }
                }
            );

            console.log(`📝 Archived ${expiredJobs.modifiedCount} expired jobs`);

            // Clean up old notifications (older than 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const Notification = require('../models/Notification').Notification;
            const oldNotifications = await Notification.deleteMany({
                createdAt: { $lt: thirtyDaysAgo },
                deliveryStatus: { $ne: 'failed' }
            });

            console.log(`🗑️ Cleaned up ${oldNotifications.deletedCount} old notifications`);

            console.log('✅ Weekly cleanup completed successfully');
        } catch (error) {
            console.error('❌ Weekly cleanup failed:', error);
            this.logError('WEEKLY_CLEANUP_FAILED', error);
        }
    }

    /**
     * Health check for system components
     */
    private async healthCheck(): Promise<void> {
        try {
            // Check database connection
            const Job = require('../models/Job').Job;
            await Job.countDocuments({ status: 'active' });

            // Check if OpenAI API key is available
            if (!process.env.OPENAI_API_KEY) {
                console.warn('⚠️ OpenAI API key not configured - AI features will use fallback');
            }

            // Check WhatsApp service
            if (!process.env.WABB_API_KEY) {
                console.warn('⚠️ WhatsApp API key not configured - notifications will be logged only');
            }

        } catch (error) {
            console.error('❌ Health check failed:', error);
            this.logError('HEALTH_CHECK_FAILED', error);
        }
    }

    /**
     * Manual trigger for daily job alerts (for testing)
     */
    async triggerDailyJobAlerts(): Promise<void> {
        console.log('🔧 Manually triggering daily job alerts...');
        await this.runDailyJobAlerts();
    }

    /**
     * Manual trigger for weekly cleanup (for testing)
     */
    async triggerWeeklyCleanup(): Promise<void> {
        console.log('🔧 Manually triggering weekly cleanup...');
        await this.runWeeklyCleanup();
    }

    /**
     * Get scheduler status
     */
    getStatus(): object {
        return {
            isRunning: this.isRunning,
            scheduledJobs: {
                dailyJobAlerts: '9:00 AM daily',
                weeklyCleanup: '2:00 AM every Sunday',
                healthCheck: 'Every hour'
            },
            timezone: 'Asia/Kolkata',
            lastRun: new Date().toISOString()
        };
    }

    /**
     * Error logging helper
     */
    private logError(errorType: string, error: any): void {
        console.error(`SCHEDULED_JOB_ERROR: ${errorType}`, {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Here you could integrate with your monitoring service
        // e.g., Sentry, DataDog, etc.
    }
}

export default new ScheduledJobsService();
