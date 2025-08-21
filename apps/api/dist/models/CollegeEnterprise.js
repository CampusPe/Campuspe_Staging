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
exports.CollegeEnterprise = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CollegeContactSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['placement_officer', 'director', 'dean', 'hod', 'admin', 'faculty'],
        required: true
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    department: String,
    designation: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    linkedUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
});
const CollegeDepartmentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
    head: { type: String, required: true },
    email: { type: String, lowercase: true },
    phone: String,
    establishedYear: Number,
    accreditations: [String],
    studentCount: { type: Number, default: 0 },
    facultyCount: { type: Number, default: 0 },
    courses: [{
            name: { type: String, required: true },
            duration: { type: Number, required: true },
            degree: {
                type: String,
                enum: ['diploma', 'bachelor', 'master', 'doctorate'],
                required: true
            },
            specialization: String,
            totalSeats: { type: Number, required: true },
            currentBatch: Number,
            passingPercentage: Number
        }]
});
const CollegeRankingsSchema = new mongoose_1.Schema({
    source: { type: String, required: true },
    rank: { type: Number, required: true },
    category: { type: String, required: true },
    year: { type: Number, required: true },
    score: Number,
    maxScore: Number
});
const PlacementStatsSchema = new mongoose_1.Schema({
    academicYear: { type: String, required: true },
    totalStudents: { type: Number, required: true },
    totalPlaced: { type: Number, required: true },
    placementPercentage: { type: Number, required: true },
    averagePackage: { type: Number, required: true },
    medianPackage: { type: Number, required: true },
    highestPackage: { type: Number, required: true },
    lowestPackage: { type: Number, required: true },
    topRecruiters: [String],
    departmentWiseStats: [{
            department: String,
            totalStudents: Number,
            placed: Number,
            averagePackage: Number,
            highestPackage: Number
        }],
    packageRanges: [{
            range: String,
            count: Number,
            percentage: Number
        }]
});
const CollegeInfrastructureSchema = new mongoose_1.Schema({
    campusArea: Number,
    totalBuildings: Number,
    laboratories: Number,
    libraries: Number,
    hostels: {
        boys: Number,
        girls: Number,
        totalCapacity: Number
    },
    sportsComplexes: Number,
    auditoriums: Number,
    conferenceHalls: Number,
    wifi: { type: Boolean, default: false },
    powerBackup: { type: Boolean, default: false },
    medicalFacilities: { type: Boolean, default: false },
    transportFacility: { type: Boolean, default: false },
    canteen: { type: Boolean, default: false },
    gymnasium: { type: Boolean, default: false },
    playground: { type: Boolean, default: false }
});
const AccreditationSchema = new mongoose_1.Schema({
    body: { type: String, required: true },
    status: {
        type: String,
        enum: ['accredited', 'reaccredited', 'pending', 'expired', 'not_accredited'],
        required: true
    },
    grade: String,
    validFrom: Date,
    validUntil: Date,
    certificateUrl: String,
    lastReviewDate: Date,
    nextReviewDate: Date
});
const CollegeSchema = new mongoose_1.Schema({
    tenantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        index: 'text'
    },
    shortName: {
        type: String,
        trim: true,
        maxlength: 20
    },
    establishedYear: {
        type: Number,
        required: true,
        min: 1800,
        max: new Date().getFullYear()
    },
    type: {
        type: String,
        enum: ['government', 'private', 'deemed', 'autonomous', 'central', 'state'],
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: ['engineering', 'medical', 'management', 'arts_science', 'law', 'pharmacy', 'mixed'],
        required: true,
        index: true
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true, index: true },
        state: { type: String, required: true, index: true },
        country: { type: String, required: true, default: 'India' },
        pincode: { type: String, required: true },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    contacts: [CollegeContactSchema],
    website: {
        type: String,
        validate: {
            validator: function (v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'Website must be a valid URL'
        }
    },
    socialMedia: {
        facebook: String,
        twitter: String,
        linkedin: String,
        instagram: String,
        youtube: String
    },
    universityAffiliation: String,
    principalName: { type: String, required: true },
    principalEmail: { type: String, lowercase: true },
    principalPhone: String,
    registrationNumber: String,
    departments: [CollegeDepartmentSchema],
    totalStudents: { type: Number, default: 0, min: 0 },
    totalFaculty: { type: Number, default: 0, min: 0 },
    studentFacultyRatio: { type: Number, default: 0 },
    accreditations: [AccreditationSchema],
    rankings: [CollegeRankingsSchema],
    autonomousStatus: { type: Boolean, default: false },
    nbaAccredited: { type: Boolean, default: false },
    naacGrade: {
        type: String,
        enum: ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D']
    },
    aicteApproved: { type: Boolean, default: false },
    ugcRecognized: { type: Boolean, default: false },
    infrastructure: CollegeInfrastructureSchema,
    placementCell: {
        isActive: { type: Boolean, default: true },
        officerName: { type: String, required: true },
        officerEmail: { type: String, required: true, lowercase: true },
        officerPhone: String,
        establishedYear: Number,
        websiteUrl: String,
        brochureUrl: String
    },
    placementStats: [PlacementStatsSchema],
    recruitmentPreferences: {
        allowedJobTypes: [{
                type: String,
                enum: ['full-time', 'part-time', 'internship', 'contract']
            }],
        minimumPackage: Number,
        preferredCompanies: [String],
        blacklistedCompanies: [String],
        recruitmentCalendar: [{
                season: {
                    type: String,
                    enum: ['summer', 'winter', 'campus']
                },
                startDate: Date,
                endDate: Date,
                description: String
            }],
        eligibilityCriteria: {
            minimumCGPA: { type: Number, min: 0, max: 10 },
            allowBacklogs: { type: Boolean, default: true },
            maxBacklogs: Number,
            allowCurrentBacklogs: { type: Boolean, default: false }
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: 'free'
        },
        startDate: { type: Date, default: Date.now },
        endDate: Date,
        maxStudents: { type: Number, default: 100 },
        maxJobs: { type: Number, default: 10 },
        maxRecruiters: { type: Number, default: 5 },
        features: [String],
        isActive: { type: Boolean, default: true },
        paymentStatus: {
            type: String,
            enum: ['paid', 'pending', 'overdue', 'cancelled'],
            default: 'paid'
        },
        lastPaymentDate: Date,
        nextBillingDate: Date,
        billingAmount: Number,
        currency: { type: String, default: 'INR' }
    },
    settings: {
        allowDirectApplications: { type: Boolean, default: true },
        requireApprovalForApplications: { type: Boolean, default: false },
        autoShareStudentProfiles: { type: Boolean, default: false },
        allowBulkApplications: { type: Boolean, default: true },
        notificationPreferences: {
            newJobs: { type: Boolean, default: true },
            applications: { type: Boolean, default: true },
            interviews: { type: Boolean, default: true },
            offers: { type: Boolean, default: true },
            deadlines: { type: Boolean, default: true }
        },
        branding: {
            logoUrl: String,
            primaryColor: String,
            secondaryColor: String,
            customDomain: String
        }
    },
    analytics: {
        totalJobsPosted: { type: Number, default: 0 },
        totalApplications: { type: Number, default: 0 },
        totalPlacements: { type: Number, default: 0 },
        averageTimeToPlacement: { type: Number, default: 0 },
        topRecruitingCompanies: [String],
        platformUsage: {
            activeStudents: { type: Number, default: 0 },
            activeRecruiters: { type: Number, default: 0 },
            lastActivityDate: { type: Date, default: Date.now }
        },
        conversionRates: {
            applicationToInterview: { type: Number, default: 0 },
            interviewToOffer: { type: Number, default: 0 },
            offerToAcceptance: { type: Number, default: 0 }
        }
    },
    verification: {
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected', 'suspended'],
            default: 'pending',
            index: true
        },
        verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
        verificationDocuments: [{
                type: String,
                url: String,
                uploadedAt: { type: Date, default: Date.now },
                verified: { type: Boolean, default: false }
            }],
        rejectionReason: String
    },
    integrations: {
        smsProvider: {
            provider: String,
            apiKey: String,
            isActive: { type: Boolean, default: false }
        },
        emailProvider: {
            provider: String,
            apiKey: String,
            fromEmail: String,
            isActive: { type: Boolean, default: false }
        },
        paymentGateway: {
            provider: String,
            merchantId: String,
            isActive: { type: Boolean, default: false }
        },
        lmsIntegration: {
            provider: String,
            apiEndpoint: String,
            apiKey: String,
            isActive: { type: Boolean, default: false }
        }
    },
    biMetrics: {
        studentSatisfactionScore: Number,
        recruiterSatisfactionScore: Number,
        platformEngagementScore: Number,
        digitalReadinessScore: Number,
        lastCalculatedAt: Date
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'onboarding', 'trial', 'churned'],
        default: 'onboarding',
        index: true
    },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingSteps: [{
            step: String,
            completed: { type: Boolean, default: false },
            completedAt: Date,
            completedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
        }],
    administrators: [{
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
            role: {
                type: String,
                enum: ['super_admin', 'admin', 'placement_officer', 'faculty', 'viewer'],
                required: true
            },
            permissions: [String],
            addedAt: { type: Date, default: Date.now },
            addedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            isActive: { type: Boolean, default: true }
        }],
    externalIds: {
        aicteeId: String,
        ugcId: String,
        naacId: String,
        nbaId: String,
        universityRollNumber: String
    },
    archivedAt: Date,
    archiveReason: String,
    lastLoginAt: Date,
    lastActivityAt: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true,
    collection: 'colleges'
});
CollegeSchema.index({ name: 'text', 'address.city': 'text' });
CollegeSchema.index({ type: 1, category: 1, 'address.state': 1 });
CollegeSchema.index({ 'verification.status': 1, status: 1 });
CollegeSchema.index({ 'subscription.plan': 1, 'subscription.endDate': 1 });
CollegeSchema.index({ establishedYear: 1, type: 1 });
CollegeSchema.index({ 'address.coordinates': '2dsphere' });
CollegeSchema.methods.calculatePlacementRate = function (year) {
    let stats = this.placementStats;
    if (year) {
        stats = stats.filter((stat) => stat.academicYear === year);
    }
    if (stats.length === 0)
        return 0;
    const latestStats = stats.sort((a, b) => b.academicYear.localeCompare(a.academicYear))[0];
    return latestStats.placementPercentage;
};
CollegeSchema.methods.getActiveStudentCount = async function () {
    const User = mongoose_1.default.model('User');
    return await User.countDocuments({
        tenantId: this.tenantId,
        role: 'student',
        status: 'active'
    });
};
CollegeSchema.methods.checkSubscriptionValidity = function () {
    if (!this.subscription.isActive)
        return false;
    if (this.subscription.paymentStatus !== 'paid')
        return false;
    if (this.subscription.endDate && this.subscription.endDate < new Date())
        return false;
    return true;
};
CollegeSchema.methods.generateAnalyticsReport = function (dateRange) {
    return {
        collegeId: this._id,
        collegeName: this.name,
        reportGeneratedAt: new Date(),
        dateRange,
        metrics: {
            totalStudents: this.totalStudents,
            totalFaculty: this.totalFaculty,
            studentFacultyRatio: this.studentFacultyRatio,
            placementRate: this.calculatePlacementRate(),
            analytics: this.analytics,
            biMetrics: this.biMetrics
        },
        subscription: {
            plan: this.subscription.plan,
            status: this.subscription.paymentStatus,
            validUntil: this.subscription.endDate
        }
    };
};
CollegeSchema.methods.updateBIMetrics = async function () {
    this.biMetrics.lastCalculatedAt = new Date();
    const daysSinceLastActivity = Math.floor((Date.now() - this.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24));
    this.biMetrics.platformEngagementScore = Math.max(0, 100 - daysSinceLastActivity * 2);
    let digitalScore = 0;
    if (this.integrations.smsProvider?.isActive)
        digitalScore += 25;
    if (this.integrations.emailProvider?.isActive)
        digitalScore += 25;
    if (this.integrations.paymentGateway?.isActive)
        digitalScore += 25;
    if (this.integrations.lmsIntegration?.isActive)
        digitalScore += 25;
    this.biMetrics.digitalReadinessScore = digitalScore;
    await this.save();
};
CollegeSchema.pre('save', function (next) {
    if (this.totalStudents > 0 && this.totalFaculty > 0) {
        this.studentFacultyRatio = Math.round((this.totalStudents / this.totalFaculty) * 100) / 100;
    }
    this.lastActivityAt = new Date();
    next();
});
CollegeSchema.virtual('primaryContact').get(function () {
    return this.contacts.find((contact) => contact.isPrimary) ||
        this.contacts.find((contact) => contact.type === 'placement_officer');
});
exports.CollegeEnterprise = mongoose_1.default.model('CollegeEnterprise', CollegeSchema);
