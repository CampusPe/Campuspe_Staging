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
exports.JobEnterprise = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const JobRequirementSchema = new mongoose_1.Schema({
    skill: { type: String, required: true },
    level: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced', 'expert'],
        required: true
    },
    mandatory: { type: Boolean, default: true },
    category: {
        type: String,
        enum: ['technical', 'soft', 'language', 'certification'],
        required: true
    },
    weight: { type: Number, min: 0, max: 1, default: 0.5 }
});
const SalaryRangeSchema = new mongoose_1.Schema({
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    negotiable: { type: Boolean, default: true },
    equityComponent: { type: Number, min: 0, max: 100 },
    bonusStructure: mongoose_1.Schema.Types.Mixed
});
const JobLocationSchema = new mongoose_1.Schema({
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    isRemote: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false },
    timezone: String,
    officeAddress: String,
    coordinates: {
        lat: Number,
        lng: Number
    }
});
const InterviewProcessSchema = new mongoose_1.Schema({
    rounds: [{
            name: { type: String, required: true },
            type: {
                type: String,
                enum: ['technical', 'hr', 'managerial', 'cultural', 'case_study'],
                required: true
            },
            duration: { type: String, required: true },
            mode: {
                type: String,
                enum: ['online', 'offline', 'hybrid'],
                required: true
            },
            weightage: { type: Number, min: 0, max: 1, default: 0.25 }
        }],
    totalDuration: String,
    additionalInfo: String,
    assessmentLinks: [String]
});
const AIJobFeaturesSchema = new mongoose_1.Schema({
    jobVector: [Number],
    skillsVector: [Number],
    matchingScore: { type: Number, min: 0, max: 1 },
    aiGeneratedSummary: String,
    keywordDensity: mongoose_1.Schema.Types.Mixed,
    competitiveAnalysis: {
        similarJobsCount: Number,
        salaryPercentile: Number,
        demandScore: Number
    }
});
const JobSchema = new mongoose_1.Schema({
    tenantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        index: 'text'
    },
    description: {
        type: String,
        required: true,
        maxlength: 10000,
        index: 'text'
    },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance', 'apprenticeship'],
        required: true,
        index: true
    },
    department: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        index: true
    },
    subCategory: String,
    recruiterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        index: true
    },
    hiringManagerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    locations: [JobLocationSchema],
    workMode: {
        type: String,
        enum: ['remote', 'onsite', 'hybrid'],
        required: true,
        index: true
    },
    timeZoneRequirement: String,
    travelRequirement: String,
    requirements: [JobRequirementSchema],
    requiredSkills: {
        type: [String],
        index: true
    },
    preferredSkills: [String],
    experienceLevel: {
        type: String,
        enum: ['entry', 'mid', 'senior', 'lead', 'executive', 'director'],
        required: true,
        index: true
    },
    minExperience: {
        type: Number,
        required: true,
        min: 0,
        index: true
    },
    maxExperience: {
        type: Number,
        min: 0
    },
    educationRequirements: [{
            degree: { type: String, required: true },
            field: String,
            minimumGrade: Number,
            mandatory: { type: Boolean, default: true },
            alternatives: [String]
        }],
    certificationRequirements: [String],
    salary: {
        type: SalaryRangeSchema,
        required: true
    },
    benefits: [String],
    workLifeBalance: {
        flexibleHours: { type: Boolean, default: false },
        paidTimeOff: String,
        healthInsurance: { type: Boolean, default: false },
        retirementPlan: { type: Boolean, default: false },
        learningBudget: Number
    },
    applicationDeadline: {
        type: Date,
        required: true,
        index: true
    },
    expectedJoiningDate: Date,
    totalPositions: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    filledPositions: {
        type: Number,
        default: 0,
        min: 0
    },
    reservedPositions: [{
            category: String,
            count: Number
        }],
    targetColleges: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'College',
            index: true
        }],
    targetCourses: [String],
    diversityPreferences: [String],
    accessibilitySupport: [String],
    allowDirectApplications: {
        type: Boolean,
        default: true
    },
    requiresReferral: {
        type: Boolean,
        default: false
    },
    interviewProcess: InterviewProcessSchema,
    assessmentRequired: {
        type: Boolean,
        default: false
    },
    backgroundCheckRequired: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'closed', 'expired', 'cancelled', 'filled'],
        default: 'draft',
        index: true
    },
    isUrgent: {
        type: Boolean,
        default: false,
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    },
    featuredUntil: Date,
    autoCloseDate: Date,
    aiFeatures: {
        type: AIJobFeaturesSchema,
        default: {}
    },
    matchingKeywords: {
        type: [String],
        index: true
    },
    searchableText: {
        type: String,
        index: 'text'
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    uniqueViews: {
        type: Number,
        default: 0,
        min: 0
    },
    applications: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Application'
        }],
    shortlistedCandidates: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    interviewsScheduled: {
        type: Number,
        default: 0
    },
    offersExtended: {
        type: Number,
        default: 0
    },
    conversionRate: Number,
    averageTimeToHire: Number,
    eeocCompliant: {
        type: Boolean,
        default: true
    },
    dataRetentionPeriod: {
        type: Number,
        default: 24
    },
    gdprCompliant: {
        type: Boolean,
        default: true
    },
    externalJobBoards: [{
            platform: String,
            jobId: String,
            postedAt: Date,
            status: {
                type: String,
                enum: ['active', 'paused', 'expired'],
                default: 'active'
            }
        }],
    collaborators: [{
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            role: {
                type: String,
                enum: ['viewer', 'editor', 'approver'],
                required: true
            },
            permissions: [String]
        }],
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'needs_revision'],
        default: 'pending',
        index: true
    },
    approvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    version: {
        type: Number,
        default: 1
    },
    parentJobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Job'
    },
    postedAt: Date,
    lastModified: {
        type: Date,
        default: Date.now
    },
    lastViewedAt: Date,
    archivedAt: Date
}, {
    timestamps: true,
    collection: 'jobs'
});
JobSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
JobSchema.index({ tenantId: 1, recruiterId: 1, status: 1 });
JobSchema.index({ tenantId: 1, experienceLevel: 1, workMode: 1 });
JobSchema.index({ tenantId: 1, 'salary.min': 1, 'salary.max': 1 });
JobSchema.index({ tenantId: 1, targetColleges: 1, status: 1 });
JobSchema.index({ matchingKeywords: 1, status: 1 });
JobSchema.index({ title: 'text', description: 'text', searchableText: 'text' });
JobSchema.index({ 'locations.coordinates': '2dsphere' });
JobSchema.index({ 'aiFeatures.jobVector': 1 });
JobSchema.index({ 'aiFeatures.skillsVector': 1 });
JobSchema.methods.calculateMatchScore = function (candidateProfile) {
    let score = 0;
    let totalWeight = 0;
    this.requirements.forEach((req) => {
        const hasSkill = candidateProfile.skills?.some((skill) => skill.toLowerCase().includes(req.skill.toLowerCase()));
        if (hasSkill) {
            score += req.weight;
        }
        totalWeight += req.weight;
    });
    if (candidateProfile.experience >= this.minExperience) {
        score += 0.3;
    }
    totalWeight += 0.3;
    if (this.workMode === 'remote' ||
        this.locations.some((loc) => candidateProfile.location?.city?.toLowerCase() === loc.city.toLowerCase())) {
        score += 0.2;
    }
    totalWeight += 0.2;
    return totalWeight > 0 ? score / totalWeight : 0;
};
JobSchema.methods.generateJobVector = async function () {
    const text = `${this.title} ${this.description} ${this.requiredSkills.join(' ')}`;
    return new Array(384).fill(0).map(() => Math.random());
};
JobSchema.methods.updateAnalytics = function (event, data) {
    switch (event) {
        case 'view':
            this.views += 1;
            this.lastViewedAt = new Date();
            break;
        case 'unique_view':
            this.uniqueViews += 1;
            break;
        case 'application':
            this.applications.push(data.applicationId);
            break;
        case 'interview_scheduled':
            this.interviewsScheduled += 1;
            break;
        case 'offer_extended':
            this.offersExtended += 1;
            break;
    }
    this.lastModified = new Date();
};
JobSchema.methods.checkTenantAccess = function (tenantId) {
    return this.tenantId.equals(tenantId);
};
JobSchema.pre('save', function (next) {
    this.searchableText = [
        this.title,
        this.description,
        this.companyName,
        this.department,
        this.category,
        this.requiredSkills.join(' '),
        this.preferredSkills.join(' '),
        this.locations.map(loc => `${loc.city} ${loc.state}`).join(' ')
    ].join(' ').toLowerCase();
    next();
});
JobSchema.pre('find', function () {
    this.where({
        $or: [
            { autoCloseDate: { $exists: false } },
            { autoCloseDate: { $gte: new Date() } },
            { status: { $in: ['closed', 'expired', 'filled'] } }
        ]
    });
});
exports.JobEnterprise = mongoose_1.default.model('JobEnterprise', JobSchema);
