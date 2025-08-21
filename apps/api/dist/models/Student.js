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
exports.Student = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EducationSchema = new mongoose_1.Schema({
    degree: { type: String, required: true },
    field: { type: String, required: true },
    institution: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    gpa: { type: Number, min: 0, max: 10 },
    isCompleted: { type: Boolean, default: false }
});
const ExperienceSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String },
    isCurrentJob: { type: Boolean, default: false }
});
const SkillSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], required: true },
    category: { type: String, enum: ['technical', 'soft', 'language'], required: true }
});
const JobPreferencesSchema = new mongoose_1.Schema({
    jobTypes: [{ type: String }],
    preferredLocations: [{ type: String }],
    expectedSalary: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: 'INR' }
    },
    workMode: { type: String, enum: ['remote', 'onsite', 'hybrid', 'any'], default: 'any' },
    availableFrom: { type: Date }
});
const StudentSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    profilePicture: { type: String },
    email: { type: String, trim: true, lowercase: true },
    phoneNumber: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    collegeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'College', required: false, index: true },
    studentId: { type: String, required: true, trim: true },
    enrollmentYear: { type: Number, required: true },
    graduationYear: { type: Number },
    currentSemester: { type: Number },
    education: [EducationSchema],
    experience: [ExperienceSchema],
    skills: [SkillSchema],
    resumeFile: { type: String },
    resumeText: { type: String },
    resumeScore: { type: Number, min: 0, max: 100 },
    resumeAnalysis: {
        skills: [String],
        category: String,
        experienceLevel: String,
        summary: String,
        uploadDate: Date,
        fileName: String,
        originalFileName: String,
        resumeText: String,
        extractedDetails: {
            personalInfo: {
                name: String,
                summary: String
            },
            experience: [{
                    title: String,
                    company: String,
                    duration: String,
                    startDate: Date,
                    endDate: Date,
                    isCurrentJob: Boolean,
                    description: String,
                    location: String
                }],
            education: [{
                    degree: String,
                    field: String,
                    institution: String,
                    startDate: Date,
                    endDate: Date,
                    year: Number,
                    isCompleted: Boolean
                }],
            contactInfo: {
                email: String,
                phone: String,
                linkedin: String,
                github: String,
                address: String
            },
            projects: [{
                    name: String,
                    description: String,
                    technologies: [String]
                }],
            certifications: [{
                    name: String,
                    year: Number,
                    organization: String
                }],
            languages: [{
                    name: String,
                    proficiency: String
                }]
        },
        analysisQuality: String,
        confidence: Number,
        originalSkillsDetected: Number,
        skillsFiltered: Number
    },
    aiResumeHistory: [{
            id: { type: String, required: true },
            jobDescription: { type: String, required: true },
            jobTitle: String,
            resumeData: { type: mongoose_1.Schema.Types.Mixed },
            pdfUrl: String,
            generatedAt: { type: Date, default: Date.now },
            matchScore: Number
        }],
    jobMatches: [{
            jobId: String,
            jobTitle: String,
            company: String,
            matchPercentage: Number,
            matchedSkills: [String],
            location: String,
            salary: String
        }],
    lastJobMatchUpdate: Date,
    jobPreferences: { type: JobPreferencesSchema, required: true },
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true, index: true },
    isPlacementReady: { type: Boolean, default: false, index: true }
}, {
    timestamps: true
});
StudentSchema.index({ collegeId: 1, isActive: 1 });
StudentSchema.index({ 'skills.name': 1 });
StudentSchema.index({ 'skills.category': 1 });
StudentSchema.index({ enrollmentYear: 1, graduationYear: 1 });
StudentSchema.index({ isPlacementReady: 1, isActive: 1 });
StudentSchema.index({ userId: 1 });
StudentSchema.index({ 'jobPreferences.jobTypes': 1, isPlacementReady: 1 });
StudentSchema.index({ 'jobPreferences.preferredLocations': 1, isPlacementReady: 1 });
exports.Student = mongoose_1.default.model('Student', StudentSchema);
