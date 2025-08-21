"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const ai_matching_1 = __importDefault(require("./ai-matching"));
const career_alerts_1 = __importDefault(require("./career-alerts"));
class JobPostingService {
    async createIntelligentJob(jobData) {
        try {
            console.log(`🤖 Creating intelligent job: ${jobData.title}`);
            const job = new models_1.Job({
                ...jobData,
                status: 'active',
                postedAt: new Date(),
                lastModified: new Date(),
                views: 0,
                applications: []
            });
            const savedJob = await job.save();
            console.log(`✅ Job created with ID: ${savedJob._id}`);
            try {
                const aiAnalysis = await ai_matching_1.default.analyzeJobDescription(jobData.description);
                const enhancedJob = await models_1.Job.findByIdAndUpdate(savedJob._id, {
                    $set: {
                        'aiGeneratedDescription': aiAnalysis.role_summary,
                        'aiSkills': aiAnalysis.skills,
                        'aiTools': aiAnalysis.tools,
                        'aiCategory': aiAnalysis.category,
                        'aiWorkMode': aiAnalysis.work_mode,
                        'matchingKeywords': [...aiAnalysis.skills, ...aiAnalysis.tools],
                        'metadata.aiAnalysis': aiAnalysis,
                        'metadata.category': aiAnalysis.category,
                        'metadata.jobFunction': aiAnalysis.job_function
                    }
                }, { new: true });
                console.log(`🧠 AI Analysis completed:`, {
                    category: aiAnalysis.category,
                    workMode: aiAnalysis.work_mode,
                    skillsExtracted: aiAnalysis.skills.length,
                    toolsExtracted: aiAnalysis.tools.length
                });
                await ai_matching_1.default.createJobEmbedding(savedJob._id, savedJob.toObject());
                console.log(`🚀 Triggering automatic AI matching for job: ${savedJob._id}`);
                this.triggerJobMatchingAsync(savedJob._id);
                return enhancedJob;
            }
            catch (aiError) {
                console.error('AI analysis failed, continuing with basic job creation:', aiError);
                this.triggerJobMatchingAsync(savedJob._id);
                return savedJob;
            }
        }
        catch (error) {
            console.error('Error creating intelligent job:', error);
            throw error;
        }
    }
    async publishJob(jobId) {
        try {
            console.log(`📢 Publishing job: ${jobId}`);
            const job = await models_1.Job.findByIdAndUpdate(jobId, {
                $set: {
                    status: 'active',
                    postedAt: new Date(),
                    lastModified: new Date()
                }
            }, { new: true });
            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }
            console.log(`✅ Job published: ${job.title} at ${job.companyName}`);
            this.triggerJobMatchingAsync(jobId);
        }
        catch (error) {
            console.error(`Error publishing job ${jobId}:`, error);
            throw error;
        }
    }
    async triggerJobMatchingAsync(jobId) {
        setImmediate(async () => {
            try {
                console.log(`🔍 Starting background matching for job: ${jobId}`);
                await career_alerts_1.default.processNewJobPosting(jobId);
                console.log(`✅ Background matching completed for job: ${jobId}`);
            }
            catch (error) {
                console.error(`❌ Background matching failed for job ${jobId}:`, error);
                this.logMatchingError(jobId, error);
            }
        });
    }
    async updateJobAndRetriggerMatching(jobId, updateData) {
        try {
            console.log(`📝 Updating job: ${jobId}`);
            const job = await models_1.Job.findByIdAndUpdate(jobId, {
                $set: {
                    ...updateData,
                    lastModified: new Date()
                }
            }, { new: true });
            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }
            if (updateData.description) {
                try {
                    const aiAnalysis = await ai_matching_1.default.analyzeJobDescription(updateData.description);
                    await models_1.Job.findByIdAndUpdate(jobId, {
                        $set: {
                            'aiGeneratedDescription': aiAnalysis.role_summary,
                            'matchingKeywords': [...aiAnalysis.skills, ...aiAnalysis.tools],
                            'metadata.aiAnalysis': aiAnalysis
                        }
                    });
                    await ai_matching_1.default.createJobEmbedding(jobId, job.toObject());
                    console.log(`🧠 AI re-analysis completed for updated job`);
                }
                catch (aiError) {
                    console.error('AI re-analysis failed:', aiError);
                }
            }
            if (job.status === 'active') {
                this.triggerJobMatchingAsync(jobId);
            }
            return job;
        }
        catch (error) {
            console.error(`Error updating job ${jobId}:`, error);
            throw error;
        }
    }
    async processMultipleJobs(jobIds) {
        console.log(`🔄 Processing ${jobIds.length} jobs for matching...`);
        for (let i = 0; i < jobIds.length; i++) {
            const jobId = jobIds[i];
            try {
                await career_alerts_1.default.processNewJobPosting(jobId);
                if (i < jobIds.length - 1) {
                    await this.delay(10000);
                }
            }
            catch (error) {
                console.error(`Error processing job ${jobId} in bulk:`, error);
            }
        }
        console.log(`✅ Completed bulk job processing`);
    }
    async getJobMatchingStats(jobId) {
        try {
            const matches = await ai_matching_1.default.findMatchingStudents(jobId, 0.50);
            const highMatches = matches.filter(m => m.finalMatchScore >= 0.70);
            const mediumMatches = matches.filter(m => m.finalMatchScore >= 0.50 && m.finalMatchScore < 0.70);
            const skillDistribution = this.analyzeSkillDistribution(matches);
            const avgMatchScore = matches.length > 0
                ? matches.reduce((sum, m) => sum + m.finalMatchScore, 0) / matches.length
                : 0;
            return {
                jobId,
                totalCandidates: matches.length,
                highMatches: highMatches.length,
                mediumMatches: mediumMatches.length,
                averageMatchScore: Math.round(avgMatchScore * 100) / 100,
                skillDistribution,
                topCandidates: highMatches.slice(0, 10).map(match => ({
                    studentId: match.studentId,
                    matchScore: Math.round(match.finalMatchScore * 100),
                    matchedSkills: match.matchedSkills,
                    matchedTools: match.matchedTools
                }))
            };
        }
        catch (error) {
            console.error(`Error getting job matching stats for ${jobId}:`, error);
            throw error;
        }
    }
    analyzeSkillDistribution(matches) {
        const skillCounts = {};
        matches.forEach(match => {
            match.matchedSkills.forEach((skill) => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });
        const sortedSkills = Object.entries(skillCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [skill, count]) => {
            obj[skill] = count;
            return obj;
        }, {});
        return sortedSkills;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    logMatchingError(jobId, error) {
        console.error('MATCHING_ERROR', {
            jobId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
}
exports.default = new JobPostingService();
