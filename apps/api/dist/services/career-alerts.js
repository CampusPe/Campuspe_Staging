"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const whatsapp_1 = require("./whatsapp");
const ai_matching_1 = __importDefault(require("./ai-matching"));
class CareerAlertService {
    async sendJobMatchAlert(alertData) {
        try {
            const { studentId, jobId, matchScore, matchedSkills, matchedTools, jobTitle, companyName, workMode, studentName, studentPhone, jobUrl, jobData } = alertData;
            if (!studentPhone) {
                console.warn(`No phone number found for student ${studentId}`);
                return;
            }
            let matchPercentage;
            if (matchScore <= 1.0) {
                matchPercentage = Math.round(matchScore * 100);
            }
            else {
                matchPercentage = Math.round(matchScore);
            }
            if (matchPercentage < 70) {
                console.log(`Match score ${matchPercentage}% below threshold for student ${studentName}`);
                return;
            }
            const topSkills = matchedSkills.slice(0, 3).join(', ');
            const topTools = matchedTools.length > 0 ? `, ${matchedTools.slice(0, 2).join(', ')}` : '';
            const personalizedMessage = `Your skills in ${topSkills}${topTools} make you an excellent fit for this role.`;
            let salaryInfo = 'Competitive';
            if (jobData && jobData.salary && jobData.salary.min && jobData.salary.max) {
                const currency = jobData.salary.currency === 'INR' ? '₹' : jobData.salary.currency;
                const minLPA = Math.round(jobData.salary.min / 100000);
                const maxLPA = Math.round(jobData.salary.max / 100000);
                salaryInfo = `${currency}${minLPA}-${maxLPA} LPA`;
            }
            let locationInfo = workMode || 'Remote';
            if (jobData && jobData.locations && jobData.locations.length > 0) {
                const location = jobData.locations[0];
                if (location.city && location.state) {
                    locationInfo = `${location.city}, ${location.state}`;
                }
                if (location.isRemote) {
                    locationInfo = 'Remote';
                }
                else if (location.hybrid) {
                    locationInfo = `${locationInfo} (Hybrid)`;
                }
            }
            const webhookData = {
                jobTitle: jobTitle,
                company: companyName,
                location: locationInfo,
                salary: salaryInfo,
                matchScore: matchPercentage.toString(),
                personalizedMessage: personalizedMessage,
                jobLink: jobUrl || `https://campuspe.com/jobs/${jobId}`
            };
            const result = await (0, whatsapp_1.sendJobMatchNotification)(studentPhone, webhookData);
            if (result.success) {
                await this.saveNotificationRecord({
                    studentId,
                    jobId,
                    message: JSON.stringify(webhookData),
                    matchScore,
                    deliveryStatus: 'sent'
                });
                console.log(`✅ Job match notification sent successfully to ${studentName} (${studentPhone}) - ${matchPercentage}% match`);
            }
            else {
                console.error(`❌ Failed to send job match notification to ${studentName}:`, result.message);
                await this.saveNotificationRecord({
                    studentId,
                    jobId,
                    message: JSON.stringify(webhookData),
                    matchScore,
                    deliveryStatus: 'failed',
                    errorMessage: result.message
                });
            }
        }
        catch (error) {
            console.error('Error sending job match alert:', error);
            throw error;
        }
    }
    async processNewJobPosting(jobId) {
        try {
            console.log(`🔍 Processing new job posting: ${jobId}`);
            const Job = require('../models/Job').Job;
            const Student = require('../models/Student').Student;
            const job = await Job.findById(jobId).lean();
            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }
            const students = await Student.find({
                isActive: true
            }).populate('userId', 'phone whatsappNumber').lean();
            console.log(`Found ${students.length} total active students to check for matches`);
            const matches = [];
            const CentralizedMatchingService = require('./centralized-matching').default;
            let processedCount = 0;
            let matchCount = 0;
            for (const student of students) {
                try {
                    processedCount++;
                    if (!student.userId) {
                        console.warn(`Student ${student._id} has no user data`);
                        continue;
                    }
                    const matchResult = await CentralizedMatchingService.getOrCalculateMatch(student._id, jobId);
                    if (!matchResult) {
                        console.warn(`No match result for student ${student._id}`);
                        continue;
                    }
                    console.log(`Student ${student.firstName} ${student.lastName}: ${matchResult.matchScore}% match score${matchResult.cached ? ' (cached)' : ''}`);
                    if (matchResult.matchScore >= 70) {
                        matchCount++;
                        const studentPhone = student.userId.whatsappNumber || student.userId.phone;
                        if (!studentPhone) {
                            console.warn(`No phone number for student ${student._id} (${student.firstName} ${student.lastName})`);
                            continue;
                        }
                        matches.push({
                            studentId: student._id,
                            jobId: jobId,
                            finalMatchScore: matchResult.matchScore,
                            matchedSkills: matchResult.skillsMatched || matchResult.matchedSkills || [],
                            matchedTools: matchResult.matchedTools || [],
                            studentName: `${student.firstName} ${student.lastName}`,
                            studentPhone: studentPhone,
                            matchScore: matchResult.matchScore
                        });
                        console.log(`✅ Student ${student.firstName} ${student.lastName} matched with ${matchResult.matchScore}% score${matchResult.cached ? ' (cached)' : ''}`);
                    }
                    else {
                        console.log(`❌ Student ${student.firstName} ${student.lastName} scored ${matchResult.matchScore}% (below 70% threshold)`);
                    }
                    if (processedCount % 20 === 0) {
                        console.log(`📈 Progress: ${processedCount}/${students.length} students processed, ${matchCount} matches found`);
                    }
                }
                catch (studentError) {
                    console.error(`Error processing student ${student._id}:`, studentError);
                }
            }
            console.log(`Found ${matches.length} high-match students (≥70%) for job ${jobId}`);
            if (matches.length === 0) {
                console.log(`⚠️ No students found with 70%+ match for job "${job.title}" at ${job.companyName}`);
                return;
            }
            console.log(`📱 Sending WhatsApp notifications to ${matches.length} matched students...`);
            let sentCount = 0;
            let failedCount = 0;
            for (const match of matches) {
                try {
                    const alertData = {
                        studentId: match.studentId,
                        jobId: match.jobId,
                        matchScore: match.finalMatchScore,
                        matchedSkills: match.matchedSkills,
                        matchedTools: match.matchedTools,
                        jobTitle: job.title,
                        companyName: job.companyName,
                        workMode: job.workMode,
                        studentName: match.studentName,
                        studentPhone: match.studentPhone,
                        jobUrl: `${process.env.FRONTEND_URL || 'https://campuspe.com'}/jobs/${jobId}`,
                        jobData: job
                    };
                    await this.sendJobMatchAlert(alertData);
                    sentCount++;
                    await this.delay(2000);
                }
                catch (studentError) {
                    console.error(`Error processing alert for student ${match.studentId}:`, studentError);
                    failedCount++;
                }
            }
            console.log(`✅ Completed job ${job.title} at ${job.companyName}:`);
            console.log(`   📊 ${processedCount} students analyzed`);
            console.log(`   🎯 ${matches.length} students matched (≥70%)`);
            console.log(`   📱 ${sentCount} WhatsApp notifications sent`);
            console.log(`   ❌ ${failedCount} notifications failed`);
        }
        catch (error) {
            console.error(`Error processing job posting ${jobId}:`, error);
            throw error;
        }
    }
    async processDailyJobAlerts() {
        try {
            console.log('🕐 Starting daily job alert processing...');
            const Job = require('../models/Job').Job;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const recentJobs = await Job.find({
                status: 'active',
                createdAt: { $gte: yesterday }
            }).select('_id title companyName').lean();
            console.log(`Found ${recentJobs.length} recent jobs to process`);
            for (const job of recentJobs) {
                try {
                    await this.processNewJobPosting(job._id);
                    await this.delay(5000);
                }
                catch (jobError) {
                    console.error(`Error processing job ${job._id}:`, jobError);
                }
            }
            console.log('✅ Daily job alert processing completed');
        }
        catch (error) {
            console.error('Error in daily job alert processing:', error);
            throw error;
        }
    }
    async processStudentProfileUpdate(studentId) {
        try {
            console.log(`👤 Processing profile update for student: ${studentId}`);
            const Job = require('../models/Job').Job;
            const Student = require('../models/Student').Student;
            const activeJobs = await Job.find({
                status: 'active',
                applicationDeadline: { $gt: new Date() }
            }).select('_id title companyName').lean();
            const student = await Student.findById(studentId)
                .populate('userId', 'phone whatsappNumber')
                .lean();
            if (!student || !student.userId) {
                console.warn(`Student ${studentId} not found`);
                return;
            }
            let alertsSent = 0;
            for (const job of activeJobs) {
                try {
                    const match = await ai_matching_1.default.calculateAdvancedMatch(studentId, job._id);
                    if (match.finalMatchScore >= 0.70) {
                        const studentPhone = student.userId.whatsappNumber || student.userId.phone;
                        if (studentPhone) {
                            const alertData = {
                                studentId,
                                jobId: job._id,
                                matchScore: match.finalMatchScore,
                                matchedSkills: match.matchedSkills,
                                matchedTools: match.matchedTools,
                                jobTitle: job.title,
                                companyName: job.companyName,
                                workMode: 'hybrid',
                                studentName: `${student.firstName} ${student.lastName}`,
                                studentPhone,
                                jobUrl: `${process.env.FRONTEND_URL || 'https://campuspe.com'}/jobs/${job._id}`
                            };
                            await this.sendJobMatchAlert(alertData);
                            alertsSent++;
                            await this.delay(2000);
                        }
                    }
                }
                catch (matchError) {
                    console.error(`Error calculating match for job ${job._id}:`, matchError);
                }
            }
            console.log(`✅ Sent ${alertsSent} job alerts for student profile update`);
        }
        catch (error) {
            console.error(`Error processing student profile update ${studentId}:`, error);
            throw error;
        }
    }
    createPersonalizedMessage(data) {
        const { studentName, matchPercentage, jobTitle, companyName, workMode, skills, jobUrl } = data;
        const greeting = this.getTimeBasedGreeting();
        const workModeEmoji = workMode === 'Remote' ? '🏠' : workMode === 'Hybrid' ? '🔄' : '🏢';
        return `${greeting} ${studentName}! 🎯

🚀 *PERFECT MATCH FOUND!*

You have a *${matchPercentage}%* match for:
📋 *${jobTitle}* at *${companyName}*
${workModeEmoji} Work Mode: ${workMode}

✨ *Top matched skills:* ${skills}

🔗 *Apply Now:* ${jobUrl}

💡 *Quick Actions:*
• Type "profile" to update your profile
• Type "jobs" to see more opportunities
• Type "applications" to track your applications

Best of luck! 🍀
*- Team CampusPe*`;
    }
    getTimeBasedGreeting() {
        const hour = new Date().getHours();
        if (hour < 12)
            return 'Good Morning';
        if (hour < 17)
            return 'Good Afternoon';
        if (hour < 21)
            return 'Good Evening';
        return 'Hi';
    }
    async saveNotificationRecord(data) {
        try {
            const notification = new models_1.Notification({
                recipientId: data.studentId,
                recipientType: 'student',
                title: 'New Job Match Alert',
                message: data.message,
                notificationType: 'job_match',
                channels: {
                    platform: false,
                    email: false,
                    whatsapp: true,
                    push: false
                },
                deliveryStatus: {
                    whatsapp: data.deliveryStatus
                },
                relatedJobId: data.jobId,
                priority: 'high',
                actionRequired: true,
                actionUrl: `/jobs/${data.jobId}`,
                actionText: 'Apply Now',
                metadata: {
                    matchScore: data.matchScore,
                    alertType: 'career_opportunity',
                    errorMessage: data.errorMessage
                }
            });
            await notification.save();
        }
        catch (error) {
            console.error('Error saving notification record:', error);
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.default = new CareerAlertService();
