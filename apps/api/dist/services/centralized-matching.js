"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Student_1 = require("../models/Student");
const Job_1 = require("../models/Job");
const ResumeJobAnalysis_1 = require("../models/ResumeJobAnalysis");
const ai_resume_matching_1 = __importDefault(require("./ai-resume-matching"));
const ai_matching_1 = __importDefault(require("./ai-matching"));
class CentralizedMatchingService {
    constructor() {
        this.CACHE_EXPIRY_HOURS = 24;
        this.DEFAULT_THRESHOLD = 0.3;
    }
    async getStudentJobMatches(studentId, options = {}) {
        const startTime = Date.now();
        const objStudentId = new mongoose_1.Types.ObjectId(studentId);
        const { threshold = this.DEFAULT_THRESHOLD, limit = 20, forceRefresh = false, includeApplied = false } = options;
        console.log(`🔍 [CENTRALIZED MATCHING] Getting matches for student ${studentId}`);
        console.log(`   📊 Threshold: ${Math.round(threshold * 100)}%, Limit: ${limit}, Refresh: ${forceRefresh}`);
        try {
            const student = await Student_1.Student.findById(objStudentId).lean();
            if (!student) {
                throw new Error('Student not found');
            }
            const jobQuery = {
                status: 'active',
                applicationDeadline: { $gt: new Date() }
            };
            if (!includeApplied) {
                const { Application } = require('../models/Application');
                const appliedJobIds = await Application.find({
                    studentId: objStudentId
                }).distinct('jobId');
                if (appliedJobIds.length > 0) {
                    jobQuery._id = { $nin: appliedJobIds };
                }
            }
            const activeJobs = await Job_1.Job.find(jobQuery).lean();
            console.log(`   💼 Found ${activeJobs.length} active jobs to analyze`);
            const matches = [];
            for (const job of activeJobs) {
                try {
                    const match = await this.getOrCalculateMatch(objStudentId, job._id, forceRefresh);
                    if (match && match.finalMatchScore >= threshold) {
                        match.jobTitle = job.title;
                        match.companyName = job.companyName || 'Unknown Company';
                        match.workMode = job.workMode || 'Not specified';
                        matches.push(match);
                    }
                }
                catch (matchError) {
                    console.error(`❌ Error calculating match for job ${job._id}:`, matchError);
                }
            }
            matches.sort((a, b) => b.finalMatchScore - a.finalMatchScore);
            const limitedMatches = matches.slice(0, limit);
            const processingTime = Date.now() - startTime;
            console.log(`✅ [CENTRALIZED MATCHING] Completed: ${limitedMatches.length}/${matches.length} matches (${processingTime}ms)`);
            return {
                studentId: objStudentId,
                matches: limitedMatches,
                totalJobs: activeJobs.length,
                matchCount: matches.length,
                threshold,
                processingTime
            };
        }
        catch (error) {
            console.error('❌ [CENTRALIZED MATCHING] Error:', error);
            throw error;
        }
    }
    async getOrCalculateMatch(studentId, jobId, forceRefresh = false) {
        if (!forceRefresh) {
            const cachedMatch = await this.getCachedMatch(studentId, jobId);
            if (cachedMatch) {
                return cachedMatch;
            }
        }
        console.log(`🧮 [CENTRALIZED MATCHING] Calculating new match: Student ${studentId} x Job ${jobId}`);
        return await this.calculateAndStoreMatch(studentId, jobId);
    }
    async getCachedMatch(studentId, jobId) {
        const cacheExpiry = new Date();
        cacheExpiry.setHours(cacheExpiry.getHours() - this.CACHE_EXPIRY_HOURS);
        try {
            const cachedAnalysis = await ResumeJobAnalysis_1.ResumeJobAnalysis.findOne({
                studentId,
                jobId,
                isActive: true,
                analyzedAt: { $gt: cacheExpiry }
            }).lean();
            if (cachedAnalysis) {
                console.log(`💾 [CACHE HIT] Using cached match: ${cachedAnalysis.matchScore}%`);
                return {
                    studentId,
                    jobId,
                    matchScore: cachedAnalysis.matchScore,
                    explanation: cachedAnalysis.explanation,
                    suggestions: cachedAnalysis.suggestions,
                    skillsMatched: cachedAnalysis.skillsMatched,
                    skillsGap: cachedAnalysis.skillsGap,
                    finalMatchScore: cachedAnalysis.matchScore / 100,
                    skillMatch: 0,
                    toolMatch: 0,
                    categoryMatch: 0,
                    workModeMatch: 0,
                    semanticSimilarity: 0,
                    matchedSkills: cachedAnalysis.skillsMatched,
                    matchedTools: [],
                    jobTitle: cachedAnalysis.jobTitle,
                    companyName: cachedAnalysis.companyName,
                    workMode: 'Unknown',
                    cached: true,
                    analyzedAt: cachedAnalysis.analyzedAt
                };
            }
        }
        catch (error) {
            console.error('Error checking cache:', error);
        }
        return null;
    }
    async calculateAndStoreMatch(studentId, jobId) {
        try {
            const [student, job] = await Promise.all([
                Student_1.Student.findById(studentId).lean(),
                Job_1.Job.findById(jobId).lean()
            ]);
            if (!student || !job) {
                console.error(`Missing data: Student ${!student ? 'not found' : 'found'}, Job ${!job ? 'not found' : 'found'}`);
                return null;
            }
            const resumeContent = this.buildResumeContent(student);
            const advancedMatch = await ai_matching_1.default.calculateAdvancedMatch(studentId, jobId);
            const aiAnalysis = await ai_resume_matching_1.default.analyzeResumeMatch(resumeContent, job.description);
            const finalMatchScore = Math.max(advancedMatch.finalMatchScore, aiAnalysis.matchScore / 100);
            const analysisData = {
                studentId,
                jobId,
                matchScore: Math.round(finalMatchScore * 100),
                explanation: aiAnalysis.explanation,
                suggestions: aiAnalysis.suggestions,
                skillsMatched: [...new Set([...advancedMatch.matchedSkills, ...aiAnalysis.skillsMatched])],
                skillsGap: aiAnalysis.skillsGap,
                resumeText: resumeContent,
                resumeVersion: 1,
                jobTitle: job.title,
                jobDescription: job.description,
                companyName: job.companyName || 'Unknown Company',
                isActive: true,
                analyzedAt: new Date()
            };
            await ResumeJobAnalysis_1.ResumeJobAnalysis.findOneAndUpdate({ studentId, jobId }, analysisData, { upsert: true, new: true });
            console.log(`💾 [STORED] Match analysis: ${Math.round(finalMatchScore * 100)}% for ${job.title}`);
            return {
                studentId,
                jobId,
                matchScore: Math.round(finalMatchScore * 100),
                explanation: aiAnalysis.explanation,
                suggestions: aiAnalysis.suggestions,
                skillsMatched: analysisData.skillsMatched,
                skillsGap: aiAnalysis.skillsGap,
                finalMatchScore,
                skillMatch: advancedMatch.skillMatch,
                toolMatch: advancedMatch.toolMatch,
                categoryMatch: advancedMatch.categoryMatch,
                workModeMatch: advancedMatch.workModeMatch,
                semanticSimilarity: advancedMatch.semanticSimilarity,
                matchedSkills: advancedMatch.matchedSkills,
                matchedTools: advancedMatch.matchedTools,
                jobTitle: job.title,
                companyName: analysisData.companyName,
                workMode: job.workMode || 'Not specified',
                cached: false,
                analyzedAt: new Date()
            };
        }
        catch (error) {
            console.error('❌ Error calculating match:', error);
            return null;
        }
    }
    buildResumeContent(student) {
        let content = '';
        if (student.firstName && student.lastName) {
            content += `${student.firstName} ${student.lastName}\n\n`;
        }
        if (student.skills && Array.isArray(student.skills)) {
            content += 'Skills: ' + student.skills.map((skill) => typeof skill === 'string' ? skill : skill.name).join(', ') + '\n\n';
        }
        if (student.experience && Array.isArray(student.experience)) {
            content += 'Experience:\n';
            student.experience.forEach((exp) => {
                content += `${exp.title || exp.position} at ${exp.company}. ${exp.description || ''}\n`;
            });
            content += '\n';
        }
        if (student.education && Array.isArray(student.education)) {
            content += 'Education:\n';
            student.education.forEach((edu) => {
                content += `${edu.degree} in ${edu.field} from ${edu.institution}\n`;
            });
        }
        if (student.resumeText) {
            content = student.resumeText;
        }
        return content || 'No resume information available';
    }
    async getStoredMatches(studentId, options = {}) {
        const { threshold = 0, limit = 50, sortBy = 'matchScore', includeInactive = false } = options;
        const query = { studentId };
        if (!includeInactive) {
            query.isActive = true;
        }
        if (threshold > 0) {
            query.matchScore = { $gte: Math.round(threshold * 100) };
        }
        return await ResumeJobAnalysis_1.ResumeJobAnalysis.find(query)
            .sort(sortBy === 'matchScore' ? '-matchScore' : '-analyzedAt')
            .limit(limit)
            .populate('jobId', 'title companyName workMode status')
            .lean();
    }
    async invalidateStudentCache(studentId) {
        console.log(`🗑️ [CACHE INVALIDATE] Clearing matches for student ${studentId}`);
        await ResumeJobAnalysis_1.ResumeJobAnalysis.updateMany({ studentId }, { isActive: false });
    }
    async invalidateJobCache(jobId) {
        console.log(`🗑️ [CACHE INVALIDATE] Clearing matches for job ${jobId}`);
        await ResumeJobAnalysis_1.ResumeJobAnalysis.updateMany({ jobId }, { isActive: false });
    }
    async getMatchStatistics(studentId) {
        const stats = await ResumeJobAnalysis_1.ResumeJobAnalysis.aggregate([
            { $match: { studentId, isActive: true } },
            {
                $group: {
                    _id: null,
                    totalMatches: { $sum: 1 },
                    averageScore: { $avg: '$matchScore' },
                    maxScore: { $max: '$matchScore' },
                    highMatches: {
                        $sum: { $cond: [{ $gte: ['$matchScore', 70] }, 1, 0] }
                    },
                    mediumMatches: {
                        $sum: { $cond: [{ $and: [{ $gte: ['$matchScore', 40] }, { $lt: ['$matchScore', 70] }] }, 1, 0] }
                    },
                    lowMatches: {
                        $sum: { $cond: [{ $lt: ['$matchScore', 40] }, 1, 0] }
                    }
                }
            }
        ]);
        return stats[0] || {
            totalMatches: 0,
            averageScore: 0,
            maxScore: 0,
            highMatches: 0,
            mediumMatches: 0,
            lowMatches: 0
        };
    }
}
exports.default = new CentralizedMatchingService();
