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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedResume = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GeneratedResumeSchema = new mongoose_1.Schema({
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    resumeId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    jobTitle: { type: String },
    jobDescription: { type: String, required: true },
    jobDescriptionHash: { type: String, required: true, index: true },
    resumeData: {
        personalInfo: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            linkedin: { type: String },
            github: { type: String },
            location: { type: String }
        },
        summary: { type: String, required: true },
        skills: [{
                name: { type: String, required: true },
                level: { type: String, required: true },
                category: { type: String, required: true }
            }],
        experience: [{
                title: { type: String, required: true },
                company: { type: String, required: true },
                location: { type: String },
                startDate: { type: Date, required: true },
                endDate: { type: Date },
                description: { type: String },
                isCurrentJob: { type: Boolean, default: false }
            }],
        education: [{
                degree: { type: String, required: true },
                field: { type: String, required: true },
                institution: { type: String, required: true },
                startDate: { type: Date, required: true },
                endDate: { type: Date },
                gpa: { type: Number, min: 0, max: 10 },
                isCompleted: { type: Boolean, default: false }
            }],
        projects: [{
                name: { type: String, required: true },
                description: { type: String, required: true },
                technologies: [{ type: String }],
                link: { type: String }
            }],
        certifications: [{
                name: { type: String, required: true },
                year: { type: Number, required: true },
                organization: { type: String, required: true }
            }]
    },
    fileName: { type: String, required: true },
    filePath: { type: String },
    cloudUrl: { type: String },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    pdfBase64: { type: String },
    matchScore: { type: Number, min: 0, max: 100 },
    aiEnhancementUsed: { type: Boolean, default: false },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    suggestions: [{ type: String }],
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed', 'expired'],
        default: 'generating',
        index: true
    },
    generationType: {
        type: String,
        enum: ['ai', 'manual', 'template'],
        default: 'ai',
        index: true
    },
    downloadCount: { type: Number, default: 0 },
    whatsappSharedCount: { type: Number, default: 0 },
    whatsappSharedAt: [{ type: Date }],
    whatsappRecipients: [{
            phoneNumber: { type: String, required: true },
            sharedAt: { type: Date, required: true },
            status: {
                type: String,
                enum: ['sent', 'delivered', 'read', 'failed'],
                default: 'sent'
            }
        }],
    generatedAt: { type: Date, default: Date.now, index: true },
    lastDownloadedAt: { type: Date },
    lastSharedAt: { type: Date },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        index: true
    }
}, {
    timestamps: true
});
GeneratedResumeSchema.index({ studentId: 1, generatedAt: -1 });
GeneratedResumeSchema.index({ resumeId: 1 });
GeneratedResumeSchema.index({ jobDescriptionHash: 1, studentId: 1 });
GeneratedResumeSchema.index({ status: 1, generatedAt: -1 });
GeneratedResumeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
GeneratedResumeSchema.index({ 'whatsappRecipients.phoneNumber': 1 });
GeneratedResumeSchema.methods.markAsDownloaded = function () {
    this.downloadCount += 1;
    this.lastDownloadedAt = new Date();
    return this.save();
};
GeneratedResumeSchema.methods.markAsSharedOnWhatsApp = function (phoneNumber) {
    this.whatsappSharedCount += 1;
    this.lastSharedAt = new Date();
    this.whatsappSharedAt.push(new Date());
    this.whatsappRecipients.push({
        phoneNumber,
        sharedAt: new Date(),
        status: 'sent'
    });
    return this.save();
};
GeneratedResumeSchema.methods.updateWhatsAppStatus = function (phoneNumber, status) {
    const recipient = this.whatsappRecipients.find((r) => r.phoneNumber === phoneNumber);
    if (recipient) {
        recipient.status = status;
        return this.save();
    }
};
GeneratedResumeSchema.statics.findByStudentId = function (studentId, limit = 10) {
    return this.find({ studentId, status: 'completed' })
        .sort({ generatedAt: -1 })
        .limit(limit)
        .lean();
};
GeneratedResumeSchema.statics.findSimilarResume = function (studentId, jobDescriptionHash) {
    return this.findOne({
        studentId,
        jobDescriptionHash,
        status: 'completed',
        generatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).lean();
};
GeneratedResumeSchema.statics.getStudentStats = function (studentId) {
    return this.aggregate([
        { $match: { studentId: new mongoose_1.default.Types.ObjectId(studentId), status: 'completed' } },
        {
            $group: {
                _id: null,
                totalResumes: { $sum: 1 },
                totalDownloads: { $sum: '$downloadCount' },
                totalWhatsAppShares: { $sum: '$whatsappSharedCount' },
                avgMatchScore: { $avg: '$matchScore' },
                lastGenerated: { $max: '$generatedAt' }
            }
        }
    ]);
};
GeneratedResumeSchema.pre('save', function (next) {
    if (this.isNew) {
        if (!this.resumeId) {
            this.resumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        if (!this.jobDescriptionHash) {
            const crypto = require('crypto');
            this.jobDescriptionHash = crypto
                .createHash('md5')
                .update(this.jobDescription.toLowerCase().trim())
                .digest('hex');
        }
    }
    next();
});
exports.GeneratedResume = mongoose_1.default.model('GeneratedResume', GeneratedResumeSchema);
