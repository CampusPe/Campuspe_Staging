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
exports.ApplicationEnterprise = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ApplicationDocumentSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['resume', 'cover_letter', 'portfolio', 'certificate', 'transcript', 'reference_letter'],
        required: true
    },
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
});
const ApplicationTimelineSchema = new mongoose_1.Schema({
    stage: {
        type: String,
        enum: ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interview_completed',
            'technical_assessment', 'background_check', 'reference_check', 'offer_extended',
            'offer_accepted', 'offer_declined', 'rejected', 'withdrawn'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed', 'skipped'],
        required: true
    },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: String,
    metadata: mongoose_1.Schema.Types.Mixed,
    durationInStage: Number,
    automatedAction: { type: Boolean, default: false }
});
const InterviewScheduleSchema = new mongoose_1.Schema({
    round: { type: Number, required: true },
    type: {
        type: String,
        enum: ['technical', 'hr', 'managerial', 'cultural', 'case_study'],
        required: true
    },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, required: true },
    mode: {
        type: String,
        enum: ['online', 'offline', 'hybrid'],
        required: true
    },
    interviewerIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    meetingLink: String,
    location: String,
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
        default: 'scheduled'
    },
    feedback: [{
            overallRating: { type: Number, min: 1, max: 10 },
            technicalSkills: { type: Number, min: 1, max: 10 },
            communicationSkills: { type: Number, min: 1, max: 10 },
            culturalFit: { type: Number, min: 1, max: 10 },
            comments: String,
            recommendation: {
                type: String,
                enum: ['strong_hire', 'hire', 'no_hire', 'strong_no_hire']
            },
            interviewerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            submittedAt: { type: Date, default: Date.now }
        }],
    recordingUrl: String,
    notesUrl: String
});
const AssessmentResultSchema = new mongoose_1.Schema({
    assessmentId: { type: String, required: true },
    type: {
        type: String,
        enum: ['coding', 'aptitude', 'personality', 'domain_specific', 'case_study'],
        required: true
    },
    platform: { type: String, required: true },
    startedAt: { type: Date, required: true },
    completedAt: Date,
    timeSpent: { type: Number, required: true },
    maxTime: { type: Number, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentile: Number,
    skillBreakdown: [{
            skill: String,
            score: Number,
            maxScore: Number
        }],
    reportUrl: String,
    cheatingDetected: { type: Boolean, default: false },
    proctored: { type: Boolean, default: false }
});
const AIAnalysisSchema = new mongoose_1.Schema({
    resumeAnalysisId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ResumeAnalysis' },
    matchingScore: { type: Number, min: 0, max: 1, required: true },
    skillsExtracted: [String],
    experienceLevel: String,
    educationLevel: String,
    keywordMatches: [String],
    redFlags: [String],
    strengths: [String],
    improvementAreas: [String],
    personayPrediction: {
        traits: mongoose_1.Schema.Types.Mixed,
        workStyle: String,
        teamFit: Number
    },
    salaryPrediction: {
        min: Number,
        max: Number,
        confidence: Number
    },
    hiringProbability: { type: Number, min: 0, max: 1 },
    timeToHirePrediction: Number,
    lastAnalyzedAt: { type: Date, default: Date.now }
});
const ApplicationSchema = new mongoose_1.Schema({
    tenantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    jobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
        index: true
    },
    candidateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    recruiterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    appliedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    applicationSource: {
        type: String,
        enum: ['direct', 'college_portal', 'referral', 'job_board', 'career_fair', 'headhunter'],
        default: 'direct',
        index: true
    },
    referralId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    coverLetter: String,
    customResponses: [{
            question: String,
            answer: String
        }],
    currentStage: {
        type: String,
        default: 'applied',
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'withdrawn', 'rejected', 'hired', 'on_hold', 'expired'],
        default: 'active',
        index: true
    },
    timeline: [ApplicationTimelineSchema],
    documents: [ApplicationDocumentSchema],
    interviews: [InterviewScheduleSchema],
    overallInterviewRating: Number,
    interviewFeedbackSummary: String,
    assessments: [AssessmentResultSchema],
    overallAssessmentScore: Number,
    aiAnalysis: {
        type: AIAnalysisSchema,
        required: true
    },
    humanReviewRequired: {
        type: Boolean,
        default: false,
        index: true
    },
    humanReviewReason: String,
    communications: [{
            type: {
                type: String,
                enum: ['email', 'sms', 'whatsapp', 'call', 'video_call', 'in_person'],
                required: true
            },
            direction: {
                type: String,
                enum: ['inbound', 'outbound'],
                required: true
            },
            subject: String,
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            sentBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
            deliveryStatus: {
                type: String,
                enum: ['sent', 'delivered', 'read', 'failed'],
                default: 'sent'
            },
            metadata: mongoose_1.Schema.Types.Mixed
        }],
    offer: {
        extendedAt: Date,
        extendedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        salary: {
            base: Number,
            bonus: Number,
            equity: Number,
            currency: { type: String, default: 'INR' }
        },
        benefits: [String],
        startDate: Date,
        expiryDate: Date,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'negotiating', 'expired'],
            default: 'pending'
        },
        negotiations: [{
                round: Number,
                candidateRequest: String,
                companyResponse: String,
                status: {
                    type: String,
                    enum: ['pending', 'accepted', 'rejected']
                },
                timestamp: { type: Date, default: Date.now }
            }],
        acceptedAt: Date,
        declinedAt: Date,
        declineReason: String,
        contractUrl: String,
        signedContractUrl: String
    },
    backgroundCheck: {
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'failed']
        },
        provider: String,
        initiatedAt: Date,
        completedAt: Date,
        results: {
            identity: {
                type: String,
                enum: ['verified', 'failed', 'pending']
            },
            education: {
                type: String,
                enum: ['verified', 'failed', 'pending']
            },
            employment: {
                type: String,
                enum: ['verified', 'failed', 'pending']
            },
            criminal: {
                type: String,
                enum: ['clear', 'issues_found', 'pending']
            },
            credit: {
                type: String,
                enum: ['clear', 'issues_found', 'pending', 'not_required']
            }
        },
        reportUrl: String,
        issues: [String]
    },
    gdprConsent: {
        type: Boolean,
        default: false
    },
    dataRetentionUntil: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000)
    },
    eeocData: {
        ethnicity: String,
        gender: String,
        veteranStatus: String,
        disabilityStatus: String,
        providedVoluntarily: { type: Boolean, default: false }
    },
    viewedByRecruiter: {
        type: Boolean,
        default: false,
        index: true
    },
    viewedAt: Date,
    timeSpentInStages: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    totalProcessingTime: Number,
    touchpoints: {
        type: Number,
        default: 0
    },
    rejectedAt: Date,
    rejectedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
    rejectionStage: String,
    internalNotes: String,
    candidateFeedback: {
        processRating: { type: Number, min: 1, max: 5 },
        communicationRating: { type: Number, min: 1, max: 5 },
        timelinessRating: { type: Number, min: 1, max: 5 },
        overallExperience: { type: Number, min: 1, max: 5 },
        comments: String,
        wouldRecommendCompany: Boolean,
        submittedAt: { type: Date, default: Date.now }
    },
    assignedRecruiters: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    watchers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    externalApplicationId: String,
    externalData: mongoose_1.Schema.Types.Mixed,
    lastActivityAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    archivedAt: Date
}, {
    timestamps: true,
    collection: 'applications'
});
ApplicationSchema.index({ tenantId: 1, jobId: 1, status: 1 });
ApplicationSchema.index({ tenantId: 1, candidateId: 1, appliedAt: -1 });
ApplicationSchema.index({ tenantId: 1, recruiterId: 1, status: 1, appliedAt: -1 });
ApplicationSchema.index({ tenantId: 1, currentStage: 1, lastActivityAt: -1 });
ApplicationSchema.index({ tenantId: 1, 'aiAnalysis.matchingScore': -1 });
ApplicationSchema.index({ tenantId: 1, humanReviewRequired: 1, status: 1 });
ApplicationSchema.index({
    tenantId: 1,
    jobId: 1,
    status: 1,
    'aiAnalysis.matchingScore': -1
});
ApplicationSchema.methods.updateStage = function (newStage, updatedBy, notes) {
    const previousStage = this.currentStage;
    const now = new Date();
    if (previousStage && this.timeline.length > 0) {
        const lastUpdate = this.timeline[this.timeline.length - 1].timestamp;
        const timeInStage = now.getTime() - lastUpdate.getTime();
        this.timeSpentInStages[previousStage] =
            (this.timeSpentInStages[previousStage] || 0) + timeInStage;
    }
    this.timeline.push({
        stage: newStage,
        status: 'completed',
        timestamp: now,
        updatedBy,
        notes,
        durationInStage: this.timeSpentInStages[previousStage] || 0,
        automatedAction: false
    });
    this.currentStage = newStage;
    this.lastActivityAt = now;
    this.touchpoints += 1;
};
ApplicationSchema.methods.calculateProcessingTime = function () {
    if (this.timeline.length === 0)
        return 0;
    const firstEntry = this.timeline[0];
    const lastEntry = this.timeline[this.timeline.length - 1];
    return lastEntry.timestamp.getTime() - firstEntry.timestamp.getTime();
};
ApplicationSchema.methods.generateCandidateReport = function () {
    return {
        applicationId: this._id,
        jobTitle: this.jobId,
        appliedAt: this.appliedAt,
        currentStage: this.currentStage,
        status: this.status,
        matchingScore: this.aiAnalysis.matchingScore,
        interviewRating: this.overallInterviewRating,
        assessmentScore: this.overallAssessmentScore,
        timeInProcess: this.calculateProcessingTime(),
        touchpoints: this.touchpoints,
        communicationHistory: this.communications.length
    };
};
ApplicationSchema.methods.checkTenantAccess = function (tenantId) {
    return this.tenantId.equals(tenantId);
};
ApplicationSchema.methods.scheduleInterview = function (interviewData) {
    this.interviews.push({
        round: this.interviews.length + 1,
        type: interviewData.type || 'technical',
        scheduledAt: interviewData.scheduledAt || new Date(),
        duration: interviewData.duration || 60,
        mode: interviewData.mode || 'online',
        interviewerIds: interviewData.interviewerIds || [],
        status: 'scheduled'
    });
    this.updateStage('interview_scheduled', interviewData.interviewerIds?.[0] || this.recruiterId);
};
ApplicationSchema.methods.addCommunication = function (commData) {
    this.communications.push({
        type: commData.type,
        direction: commData.direction,
        subject: commData.subject,
        content: commData.content,
        timestamp: new Date(),
        sentBy: commData.sentBy,
        deliveryStatus: 'sent',
        metadata: commData.metadata
    });
    this.touchpoints += 1;
    this.lastActivityAt = new Date();
};
ApplicationSchema.pre('save', function (next) {
    if (this.isModified('currentStage') || this.isModified('status')) {
        this.lastActivityAt = new Date();
    }
    next();
});
ApplicationSchema.pre('find', function () {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    this.where({
        $or: [
            { status: { $ne: 'expired' } },
            { appliedAt: { $gte: sixMonthsAgo } }
        ]
    });
});
exports.ApplicationEnterprise = mongoose_1.default.model('ApplicationEnterprise', ApplicationSchema);
