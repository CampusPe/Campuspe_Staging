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
const GeneratedResume_1 = require("../models/GeneratedResume");
const Student_1 = require("../models/Student");
const mongoose_1 = require("mongoose");
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const bunny_storage_service_1 = __importDefault(require("./bunny-storage.service"));
const resume_url_utils_1 = require("../utils/resume-url.utils");
class GeneratedResumeService {
    async createGeneratedResume(data) {
        try {
            console.log('📝 Creating new generated resume for student:', data.studentId);
            const resumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const jobDescriptionHash = crypto
                .createHash('md5')
                .update(data.jobDescription.toLowerCase().trim())
                .digest('hex');
            const existingResume = await GeneratedResume_1.GeneratedResume.findSimilarResume(data.studentId, jobDescriptionHash);
            if (existingResume) {
                console.log('🔄 Found similar resume generated recently:', existingResume.resumeId);
            }
            let cloudUrl;
            let filePath;
            console.log('☁️ Uploading PDF to Bunny.net cloud storage with retry logic...');
            const uploadResult = await bunny_storage_service_1.default.uploadPDFWithRetry(data.pdfBuffer, data.fileName, resumeId, 3);
            if (uploadResult.success && uploadResult.url) {
                cloudUrl = uploadResult.url;
                console.log('✅ PDF uploaded to cloud:', cloudUrl);
            }
            else {
                console.warn('⚠️ Cloud upload failed after retries, storing only in database:', uploadResult.error);
            }
            const pdfBase64 = data.pdfBuffer.length < 1024 * 1024 ? data.pdfBuffer.toString('base64') : undefined;
            const transformedResumeData = this.transformResumeDataForSchema(data.resumeData);
            const generatedResume = new GeneratedResume_1.GeneratedResume({
                studentId: new mongoose_1.Types.ObjectId(data.studentId),
                resumeId,
                jobTitle: data.jobTitle,
                jobDescription: data.jobDescription,
                jobDescriptionHash,
                resumeData: transformedResumeData,
                fileName: data.fileName,
                filePath,
                cloudUrl,
                fileSize: data.pdfBuffer.length,
                mimeType: 'application/pdf',
                pdfBase64,
                matchScore: data.matchScore,
                aiEnhancementUsed: data.aiEnhancementUsed || false,
                matchedSkills: data.matchedSkills || [],
                missingSkills: data.missingSkills || [],
                suggestions: data.suggestions || [],
                status: 'completed',
                generationType: data.generationType || 'ai',
                downloadCount: 0,
                whatsappSharedCount: 0,
                whatsappSharedAt: [],
                whatsappRecipients: [],
                generatedAt: new Date()
            });
            const savedResume = await generatedResume.save();
            console.log('✅ Generated resume saved successfully:', savedResume.resumeId);
            await this.updateStudentResumeHistory(data.studentId, savedResume);
            return savedResume;
        }
        catch (error) {
            console.error('❌ Error creating generated resume:', error);
            throw error;
        }
    }
    async getResumeById(resumeId) {
        try {
            return await GeneratedResume_1.GeneratedResume.findOne({ resumeId, status: 'completed' }).lean();
        }
        catch (error) {
            console.error('❌ Error fetching resume by ID:', error);
            return null;
        }
    }
    async getStudentResumeHistory(studentId, limit = 10) {
        try {
            return await GeneratedResume_1.GeneratedResume.findByStudentId(studentId, limit);
        }
        catch (error) {
            console.error('❌ Error fetching student resume history:', error);
            return [];
        }
    }
    async downloadResume(resumeId) {
        try {
            const resume = await GeneratedResume_1.GeneratedResume.findOne({ resumeId, status: 'completed' });
            if (!resume) {
                return { success: false, error: 'Resume not found' };
            }
            let pdfBuffer;
            if (resume.pdfBase64) {
                console.log('📄 Serving PDF from base64 cache');
                pdfBuffer = Buffer.from(resume.pdfBase64, 'base64');
            }
            else if (resume.cloudUrl) {
                console.log('☁️ Downloading PDF from cloud storage:', resume.cloudUrl);
                try {
                    const axios = require('axios');
                    const response = await axios.get(resume.cloudUrl, { responseType: 'arraybuffer' });
                    pdfBuffer = Buffer.from(response.data);
                }
                catch (cloudError) {
                    console.warn('⚠️ Cloud download failed, trying local fallback:', cloudError instanceof Error ? cloudError.message : 'Unknown error');
                }
            }
            if (!pdfBuffer && resume.filePath && fs.existsSync(resume.filePath)) {
                console.log('💾 Serving PDF from local storage');
                pdfBuffer = fs.readFileSync(resume.filePath);
            }
            if (!pdfBuffer) {
                return { success: false, error: 'Resume file not accessible from any source' };
            }
            await resume.markAsDownloaded();
            return {
                success: true,
                pdfBuffer,
                fileName: resume.fileName
            };
        }
        catch (error) {
            console.error('❌ Error downloading resume:', error);
            return { success: false, error: 'Failed to download resume' };
        }
    }
    async shareResumeOnWhatsApp(resumeId, phoneNumber) {
        try {
            const resume = await GeneratedResume_1.GeneratedResume.findOne({ resumeId, status: 'completed' });
            if (!resume) {
                return { success: false, message: 'Resume not found' };
            }
            const downloadUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
            await resume.markAsSharedOnWhatsApp(phoneNumber);
            const { sendWhatsAppMessage } = require('./whatsapp');
            const message = `🎉 *Your Resume is Ready!*\n\n📄 *File:* ${resume.fileName}\n📅 *Generated:* ${resume.generatedAt.toLocaleDateString()}\n🎯 *Job Match Score:* ${resume.matchScore || 'N/A'}%\n\n📥 *Download:* ${downloadUrl}\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
            const whatsappResult = await sendWhatsAppMessage(phoneNumber, message);
            if (whatsappResult.success) {
                return {
                    success: true,
                    message: 'Resume shared successfully on WhatsApp',
                    resumeId,
                    downloadUrl
                };
            }
            else {
                return {
                    success: false,
                    message: `Failed to send WhatsApp message: ${whatsappResult.message}`,
                    error: whatsappResult.message
                };
            }
        }
        catch (error) {
            console.error('❌ Error sharing resume on WhatsApp:', error);
            return {
                success: false,
                message: 'Failed to share resume on WhatsApp',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getStudentStats(studentId) {
        try {
            const stats = await GeneratedResume_1.GeneratedResume.getStudentStats(studentId);
            return stats[0] || {
                totalResumes: 0,
                totalDownloads: 0,
                totalWhatsAppShares: 0,
                avgMatchScore: 0,
                lastGenerated: null
            };
        }
        catch (error) {
            console.error('❌ Error fetching student stats:', error);
            return null;
        }
    }
    async cleanupExpiredResumes() {
        try {
            console.log('🧹 Starting cleanup of expired resumes...');
            const expiredResumes = await GeneratedResume_1.GeneratedResume.find({
                expiresAt: { $lte: new Date() },
                status: { $ne: 'expired' }
            }).lean();
            let deleted = 0;
            let errors = 0;
            for (const resume of expiredResumes) {
                try {
                    if (resume.filePath && fs.existsSync(resume.filePath)) {
                        fs.unlinkSync(resume.filePath);
                    }
                    await GeneratedResume_1.GeneratedResume.findByIdAndUpdate(resume._id, {
                        status: 'expired',
                        pdfBase64: undefined,
                        filePath: undefined
                    });
                    deleted++;
                }
                catch (error) {
                    console.error(`❌ Error cleaning up resume ${resume.resumeId}:`, error);
                    errors++;
                }
            }
            console.log(`✅ Cleanup completed: ${deleted} expired, ${errors} errors`);
            return { deleted, errors };
        }
        catch (error) {
            console.error('❌ Error during cleanup:', error);
            return { deleted: 0, errors: 1 };
        }
    }
    async updateStudentResumeHistory(studentId, generatedResume) {
        try {
            const student = await Student_1.Student.findById(studentId);
            if (!student)
                return;
            const historyItem = {
                id: generatedResume.resumeId,
                jobDescription: generatedResume.jobDescription.substring(0, 500),
                jobTitle: generatedResume.jobTitle,
                resumeData: generatedResume.resumeData,
                pdfUrl: resume_url_utils_1.ResumeUrlUtils.getPrimaryDownloadUrl(generatedResume.cloudUrl, generatedResume.resumeId, 'generated-resume'),
                cloudUrl: generatedResume.cloudUrl,
                generatedAt: generatedResume.generatedAt,
                matchScore: generatedResume.matchScore
            };
            resume_url_utils_1.ResumeUrlUtils.logUrlUsage(generatedResume.resumeId, historyItem.pdfUrl, 'Student Resume History');
            if (!student.aiResumeHistory) {
                student.aiResumeHistory = [];
            }
            student.aiResumeHistory.push(historyItem);
            if (student.aiResumeHistory.length > 5) {
                student.aiResumeHistory = student.aiResumeHistory.slice(-5);
            }
            await student.save();
            console.log('✅ Updated student resume history for backward compatibility');
        }
        catch (error) {
            console.error('❌ Error updating student resume history:', error);
        }
    }
    async searchResumes(criteria) {
        try {
            const query = {};
            if (criteria.studentId)
                query.studentId = new mongoose_1.Types.ObjectId(criteria.studentId);
            if (criteria.jobTitle)
                query.jobTitle = new RegExp(criteria.jobTitle, 'i');
            if (criteria.dateFrom || criteria.dateTo) {
                query.generatedAt = {};
                if (criteria.dateFrom)
                    query.generatedAt.$gte = criteria.dateFrom;
                if (criteria.dateTo)
                    query.generatedAt.$lte = criteria.dateTo;
            }
            if (criteria.minMatchScore)
                query.matchScore = { $gte: criteria.minMatchScore };
            if (criteria.generationType)
                query.generationType = criteria.generationType;
            if (criteria.status)
                query.status = criteria.status;
            return await GeneratedResume_1.GeneratedResume.find(query)
                .sort({ generatedAt: -1 })
                .limit(criteria.limit || 20)
                .skip(criteria.skip || 0)
                .lean();
        }
        catch (error) {
            console.error('❌ Error searching resumes:', error);
            return [];
        }
    }
    async getResumeAnalytics(resumeId) {
        try {
            const resume = await GeneratedResume_1.GeneratedResume.findOne({ resumeId }).lean();
            if (!resume)
                return null;
            return {
                resumeId: resume.resumeId,
                studentId: resume.studentId,
                jobTitle: resume.jobTitle,
                generatedAt: resume.generatedAt,
                downloadCount: resume.downloadCount,
                whatsappSharedCount: resume.whatsappSharedCount,
                matchScore: resume.matchScore,
                status: resume.status,
                fileSize: resume.fileSize,
                whatsappRecipients: resume.whatsappRecipients?.length || 0,
                lastDownloaded: resume.lastDownloadedAt,
                lastShared: resume.lastSharedAt
            };
        }
        catch (error) {
            console.error('❌ Error getting resume analytics:', error);
            return null;
        }
    }
    transformResumeDataForSchema(resumeData) {
        try {
            console.log('🔄 [GeneratedResumeService] Transforming resume data for schema compatibility...');
            const sourceData = resumeData.resumeData || resumeData;
            const transformed = {
                personalInfo: {
                    firstName: sourceData.personalInfo?.firstName || sourceData.firstName || 'Unknown',
                    lastName: sourceData.personalInfo?.lastName || sourceData.lastName || 'User',
                    email: sourceData.personalInfo?.email || sourceData.email || '',
                    phone: sourceData.personalInfo?.phone || sourceData.phone || '',
                    address: sourceData.personalInfo?.address || sourceData.address || '',
                    linkedin: sourceData.personalInfo?.linkedin || sourceData.linkedin || '',
                    website: sourceData.personalInfo?.website || sourceData.website || ''
                },
                summary: sourceData.summary || sourceData.professionalSummary || '',
                skills: [],
                experience: [],
                education: [],
                projects: [],
                certifications: [],
                languages: []
            };
            if (sourceData.skills && Array.isArray(sourceData.skills)) {
                transformed.skills = sourceData.skills.map((skill) => {
                    if (typeof skill === 'string') {
                        return {
                            name: skill,
                            level: 'Intermediate',
                            category: 'Technical'
                        };
                    }
                    return {
                        name: skill.name || skill.skill || skill,
                        level: skill.level || 'Intermediate',
                        category: skill.category || 'Technical'
                    };
                });
            }
            if (sourceData.experience && Array.isArray(sourceData.experience)) {
                transformed.experience = sourceData.experience.map((exp) => ({
                    title: exp.title || exp.position || '',
                    company: exp.company || '',
                    location: exp.location || '',
                    startDate: new Date(),
                    endDate: exp.endDate ? new Date(exp.endDate) : null,
                    description: Array.isArray(exp.description)
                        ? exp.description.join(' ')
                        : (exp.description || ''),
                    isCurrentJob: exp.isCurrentJob || false
                }));
            }
            if (sourceData.education && Array.isArray(sourceData.education)) {
                transformed.education = sourceData.education.map((edu) => ({
                    degree: edu.degree || '',
                    field: edu.field || edu.fieldOfStudy || edu.degree || '',
                    institution: edu.institution || edu.school || '',
                    startDate: new Date(),
                    endDate: edu.endDate ? new Date(edu.endDate) : null,
                    gpa: edu.gpa ? parseFloat(edu.gpa) : null,
                    isCompleted: edu.isCompleted !== false
                }));
            }
            if (sourceData.projects && Array.isArray(sourceData.projects)) {
                transformed.projects = sourceData.projects.map((proj) => ({
                    name: proj.name || proj.title || '',
                    description: proj.description || '',
                    technologies: proj.technologies || [],
                    link: proj.link || proj.url || ''
                }));
            }
            if (sourceData.certifications && Array.isArray(sourceData.certifications)) {
                transformed.certifications = sourceData.certifications.map((cert) => ({
                    name: cert.name || cert.title || '',
                    issuer: cert.issuer || cert.organization || '',
                    date: cert.date || cert.issueDate || '',
                    link: cert.link || cert.url || ''
                }));
            }
            if (sourceData.languages && Array.isArray(sourceData.languages)) {
                transformed.languages = sourceData.languages.map((lang) => {
                    if (typeof lang === 'string') {
                        return {
                            name: lang,
                            proficiency: 'Fluent'
                        };
                    }
                    return {
                        name: lang.name || lang.language || lang,
                        proficiency: lang.proficiency || lang.level || 'Fluent'
                    };
                });
            }
            console.log('✅ [GeneratedResumeService] Resume data transformation completed');
            console.log('📊 [GeneratedResumeService] Transformed data structure:', {
                personalInfo: !!transformed.personalInfo.firstName,
                skillsCount: transformed.skills.length,
                experienceCount: transformed.experience.length,
                educationCount: transformed.education.length
            });
            return transformed;
        }
        catch (error) {
            console.error('❌ [GeneratedResumeService] Error transforming resume data:', error);
            return {
                personalInfo: {
                    firstName: 'Unknown',
                    lastName: 'User',
                    email: '',
                    phone: '',
                    address: '',
                    linkedin: '',
                    website: ''
                },
                summary: '',
                skills: [],
                experience: [],
                education: [],
                projects: [],
                certifications: [],
                languages: []
            };
        }
    }
}
exports.default = new GeneratedResumeService();
