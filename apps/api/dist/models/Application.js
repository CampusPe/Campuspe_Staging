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
exports.Application = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ApplicationStatusSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interview_completed', 'selected', 'rejected', 'withdrawn'],
        required: true
    },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String }
});
const InterviewScheduleSchema = new mongoose_1.Schema({
    round: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, required: true },
    mode: { type: String, enum: ['online', 'offline', 'phone'], required: true },
    location: { type: String },
    meetingLink: { type: String },
    interviewers: [{ type: String }],
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
    feedback: { type: String },
    rating: { type: Number, min: 1, max: 10 }
});
const ApplicationSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    recruiterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
    collegeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'College', index: true },
    coverLetter: { type: String },
    resumeFile: { type: String },
    portfolioLinks: [{ type: String }],
    currentStatus: {
        type: String,
        enum: ['applied', 'screening', 'shortlisted', 'interview_scheduled', 'interview_completed', 'selected', 'rejected', 'withdrawn'],
        default: 'applied',
        index: true
    },
    statusHistory: [ApplicationStatusSchema],
    interviews: [InterviewScheduleSchema],
    collegeApprovalRequired: { type: Boolean, default: false },
    collegeApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
    collegeApprovalDate: { type: Date },
    collegeApprovalNotes: { type: String },
    matchScore: { type: Number, min: 0, max: 100 },
    skillsMatchPercentage: { type: Number, min: 0, max: 100 },
    whatsappNotificationSent: { type: Boolean, default: false },
    whatsappNotificationSentAt: { type: Date },
    emailNotificationSent: { type: Boolean, default: false },
    lastContactedAt: { type: Date },
    recruiterViewed: { type: Boolean, default: false, index: true },
    recruiterViewedAt: { type: Date },
    shortlistReason: { type: String },
    rejectionReason: { type: String },
    offerDetails: {
        salary: { type: Number },
        currency: { type: String, default: 'INR' },
        joiningDate: { type: Date },
        location: { type: String },
        additionalBenefits: [{ type: String }]
    },
    studentFeedback: {
        rating: { type: Number, min: 1, max: 5 },
        comments: { type: String },
        wouldRecommend: { type: Boolean }
    },
    source: { type: String, enum: ['platform', 'whatsapp', 'direct', 'referral'], default: 'platform' },
    appliedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});
ApplicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ jobId: 1, currentStatus: 1 });
ApplicationSchema.index({ recruiterId: 1, currentStatus: 1 });
ApplicationSchema.index({ collegeId: 1, currentStatus: 1 });
ApplicationSchema.index({ appliedAt: -1 });
ApplicationSchema.index({ 'interviews.scheduledAt': 1 });
ApplicationSchema.index({
    studentId: 1,
    currentStatus: 1,
    appliedAt: -1
});
ApplicationSchema.index({
    recruiterId: 1,
    recruiterViewed: 1,
    currentStatus: 1
});
ApplicationSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});
exports.Application = mongoose_1.default.model('Application', ApplicationSchema);
