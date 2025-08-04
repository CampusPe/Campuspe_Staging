import CareerAlertService from './career-alerts';

class SchedulerService {
    private isRunning: boolean = false;
    private dailyTimer: NodeJS.Timeout | null = null;
    private weeklyTimer: NodeJS.Timeout | null = null;

    /**
     * Initialize all scheduled tasks
     */
    init() {
        console.log('🕐 Initializing Career Alert Scheduler...');
        
        // Daily job alerts
        this.scheduleDailyJobAlerts();
        
        // Weekly profile reminder
        this.scheduleWeeklyProfileReminder();
        
        console.log('✅ Career Alert Scheduler initialized');
    }

    /**
     * Schedule daily job alerts
     * Runs every 24 hours
     */
    private scheduleDailyJobAlerts() {
        const runDailyTask = async () => {
            try {
                if (this.isRunning) {
                    console.log('⏳ Daily job alert processing already running, skipping...');
                    return;
                }

                this.isRunning = true;
                console.log('🕐 Starting daily job alert processing...');
                
                await CareerAlertService.processDailyJobAlerts();
                
                console.log('✅ Daily job alert processing completed');
                
            } catch (error) {
                console.error('❌ Daily job alert processing failed:', error);
            } finally {
                this.isRunning = false;
            }
        };

        // Calculate time until next 9 AM
        const now = new Date();
        const next9AM = new Date(now);
        next9AM.setHours(9, 0, 0, 0);
        
        // If it's already past 9 AM today, schedule for 9 AM tomorrow
        if (now > next9AM) {
            next9AM.setDate(next9AM.getDate() + 1);
        }

        const msUntil9AM = next9AM.getTime() - now.getTime();
        
        // Initial delay until 9 AM, then every 24 hours
        setTimeout(() => {
            runDailyTask();
            this.dailyTimer = setInterval(runDailyTask, 24 * 60 * 60 * 1000); // 24 hours
        }, msUntil9AM);

        console.log(`📅 Daily job alerts scheduled. Next run: ${next9AM.toLocaleString()}`);
    }

    /**
     * Schedule weekly profile completion reminder
     * Runs every Sunday at 10:00 AM
     */
    private scheduleWeeklyProfileReminder() {
        const runWeeklyTask = async () => {
            try {
                console.log('📝 Starting weekly profile reminder...');
                await this.processWeeklyProfileReminder();
                console.log('✅ Weekly profile reminder completed');
            } catch (error) {
                console.error('❌ Weekly profile reminder failed:', error);
            }
        };

        // Calculate time until next Sunday 10 AM
        const now = new Date();
        const nextSunday10AM = new Date(now);
        nextSunday10AM.setDate(now.getDate() + (7 - now.getDay()));
        nextSunday10AM.setHours(10, 0, 0, 0);
        
        // If it's already past this Sunday 10 AM, schedule for next Sunday
        if (now > nextSunday10AM) {
            nextSunday10AM.setDate(nextSunday10AM.getDate() + 7);
        }

        const msUntilSunday10AM = nextSunday10AM.getTime() - now.getTime();
        
        // Initial delay until Sunday 10 AM, then every 7 days
        setTimeout(() => {
            runWeeklyTask();
            this.weeklyTimer = setInterval(runWeeklyTask, 7 * 24 * 60 * 60 * 1000); // 7 days
        }, msUntilSunday10AM);

        console.log(`📅 Weekly profile reminders scheduled. Next run: ${nextSunday10AM.toLocaleString()}`);
    }

    /**
     * Manual trigger for daily job alerts (for testing)
     */
    async triggerDailyJobAlerts() {
        try {
            if (this.isRunning) {
                throw new Error('Daily job alert processing already running');
            }

            this.isRunning = true;
            console.log('🔧 Manually triggering daily job alerts...');
            
            await CareerAlertService.processDailyJobAlerts();
            
            console.log('✅ Manual daily job alert processing completed');
            
        } catch (error) {
            console.error('❌ Manual daily job alert processing failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Process weekly profile reminders
     */
    private async processWeeklyProfileReminder() {
        try {
            const { Student } = require('../models');
            const { sendWhatsAppMessage } = require('./whatsapp');

            // Find students with incomplete profiles
            const incompleteProfiles = await Student.find({
                isActive: true,
                profileCompleteness: { $lt: 80 }
            })
            .populate('userId', 'phone whatsappNumber')
            .select('_id firstName lastName profileCompleteness userId')
            .lean();

            console.log(`Found ${incompleteProfiles.length} students with incomplete profiles`);

            for (const student of incompleteProfiles) {
                try {
                    if (!student.userId?.whatsappNumber && !student.userId?.phone) {
                        continue;
                    }

                    const phone = student.userId.whatsappNumber || student.userId.phone;
                    const message = this.createProfileReminderMessage(student);

                    await sendWhatsAppMessage(phone, message);
                    
                    // Rate limiting
                    await this.delay(3000);
                    
                } catch (error) {
                    console.error(`Error sending profile reminder to student ${student._id}:`, error);
                }
            }

            console.log(`✅ Sent profile reminders to ${incompleteProfiles.length} students`);

        } catch (error) {
            console.error('Error processing weekly profile reminders:', error);
            throw error;
        }
    }

    /**
     * Create personalized profile reminder message
     */
    private createProfileReminderMessage(student: any): string {
        const name = student.firstName || 'Student';
        const completeness = student.profileCompleteness || 0;
        
        return `Hi ${name}! 👋

📊 Your profile is ${completeness}% complete.

✨ *Complete your profile to get better job matches!*

🔧 *Quick actions:*
• Upload your latest resume
• Add your skills and projects
• Update your job preferences
• Verify your contact details

💡 Students with 80%+ complete profiles get 3x more job matches!

📱 Type "profile" to update your details now.

Best regards,
*Team CampusPe* 🚀`;
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            dailyTimerActive: this.dailyTimer !== null,
            weeklyTimerActive: this.weeklyTimer !== null,
            uptime: process.uptime()
        };
    }

    /**
     * Stop all scheduled tasks
     */
    stopAll() {
        console.log('🛑 Stopping all scheduled tasks...');
        
        if (this.dailyTimer) {
            clearInterval(this.dailyTimer);
            this.dailyTimer = null;
            console.log('Stopped daily timer');
        }
        
        if (this.weeklyTimer) {
            clearInterval(this.weeklyTimer);
            this.weeklyTimer = null;
            console.log('Stopped weekly timer');
        }
        
        console.log('✅ All scheduled tasks stopped');
    }

    /**
     * Helper methods
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default new SchedulerService();
