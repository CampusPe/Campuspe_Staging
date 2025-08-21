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
exports.Job = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const JobRequirementSchema = new mongoose_1.Schema({
    skill: { type: String, required: true, trim: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], required: true },
    mandatory: { type: Boolean, default: false },
    category: { type: String, enum: ['technical', 'soft', 'language', 'certification'], required: true }
});
const SalaryRangeSchema = new mongoose_1.Schema({
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    negotiable: { type: Boolean, default: false }
});
const JobLocationSchema = new mongoose_1.Schema({
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    isRemote: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false }
});
const InterviewProcessSchema = new mongoose_1.Schema({
    rounds: [{ type: String, required: true }],
    duration: { type: String, required: true },
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], required: true },
    additionalInfo: { type: String }
});
const EducationRequirementSchema = new mongoose_1.Schema({
    degree: { type: String, required: true },
    field: { type: String },
    minimumGrade: { type: Number },
    mandatory: { type: Boolean, default: false }
});
const JobSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance'],
        required: true,
        index: true
    },
    department: { type: String, required: true, trim: true },
    recruiterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
    companyName: { type: String, required: true, trim: true, index: true },
    locations: [JobLocationSchema],
    workMode: {
        type: String,
        enum: ['remote', 'onsite', 'hybrid'],
        required: true,
        index: true
    },
    requirements: [JobRequirementSchema],
    experienceLevel: {
        type: String,
        enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
        required: true,
        index: true
    },
    minExperience: { type: Number, required: true, min: 0 },
    maxExperience: { type: Number, min: 0 },
    educationRequirements: [EducationRequirementSchema],
    salary: { type: SalaryRangeSchema, required: true },
    benefits: [{ type: String }],
    applicationDeadline: { type: Date, required: true, index: true },
    expectedJoiningDate: { type: Date },
    totalPositions: { type: Number, required: true, min: 1 },
    filledPositions: { type: Number, default: 0, min: 0 },
    targetColleges: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'College' }],
    targetCourses: [{ type: String }],
    allowDirectApplications: { type: Boolean, default: true },
    interviewProcess: { type: InterviewProcessSchema, required: true },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'closed', 'expired'],
        default: 'draft',
        index: true
    },
    isUrgent: { type: Boolean, default: false, index: true },
    featuredUntil: { type: Date },
    aiGeneratedDescription: { type: String },
    matchingKeywords: [{ type: String }],
    views: { type: Number, default: 0 },
    applications: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Application' }],
    postedAt: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now }
}, {
    timestamps: true
});
JobSchema.index({ title: 'text', description: 'text', 'requirements.skill': 'text' });
JobSchema.index({ status: 1, postedAt: -1 });
JobSchema.index({ 'locations.city': 1, 'locations.state': 1 });
JobSchema.index({ jobType: 1, experienceLevel: 1 });
JobSchema.index({ applicationDeadline: 1, status: 1 });
JobSchema.index({ 'requirements.skill': 1 });
JobSchema.index({ targetColleges: 1, status: 1 });
JobSchema.index({ companyName: 1, status: 1 });
JobSchema.index({ workMode: 1, status: 1 });
JobSchema.index({
    status: 1,
    'locations.city': 1,
    jobType: 1,
    experienceLevel: 1
});
JobSchema.pre('save', function (next) {
    this.lastModified = new Date();
    next();
});
exports.Job = mongoose_1.default.model('Job', JobSchema);
