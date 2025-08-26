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
exports.Recruiter = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CompanyInfoSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, index: true },
    industry: { type: String, required: true, index: true },
    website: { type: String, trim: true },
    logo: { type: String },
    description: { type: String },
    size: {
        type: String,
        enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
        required: true,
        index: true
    },
    foundedYear: { type: Number },
    headquarters: {
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true, default: 'India' }
    }
});
const RecruiterProfileSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    profilePicture: { type: String }
});
const HiringInfoSchema = new mongoose_1.Schema({
    preferredColleges: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'College' }],
    preferredCourses: [{ type: String }],
    hiringSeasons: [{ type: String, enum: ['summer', 'winter', 'continuous'] }],
    averageHires: { type: Number, default: 0 },
    workLocations: [{ type: String }],
    remoteWork: { type: Boolean, default: false },
    internshipOpportunities: { type: Boolean, default: false }
});
const RecruiterSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyInfo: { type: CompanyInfoSchema, required: true },
    recruiterProfile: { type: RecruiterProfileSchema, required: true },
    hiringInfo: { type: HiringInfoSchema, required: true },
    isVerified: { type: Boolean, default: false, index: true },
    verificationDocuments: [{ type: String }],
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
        index: true
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    resubmissionNotes: { type: String },
    submittedDocuments: [{ type: String }],
    jobsPosted: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Job' }],
    approvedColleges: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'College' }],
    pendingColleges: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'College' }],
    whatsappNumber: { type: String, trim: true },
    preferredContactMethod: {
        type: String,
        enum: ['email', 'phone', 'whatsapp'],
        default: 'email'
    },
    isActive: { type: Boolean, default: true, index: true },
    lastActiveDate: { type: Date, default: Date.now },
    autoApproveApplications: { type: Boolean, default: false },
    allowWhatsappContact: { type: Boolean, default: true }
}, {
    timestamps: true
});
RecruiterSchema.index({ 'companyInfo.name': 1, isActive: 1 });
RecruiterSchema.index({ 'companyInfo.industry': 1, isVerified: 1 });
RecruiterSchema.index({ 'companyInfo.headquarters.city': 1, 'companyInfo.headquarters.state': 1 });
RecruiterSchema.index({ verificationStatus: 1, isActive: 1 });
RecruiterSchema.index({ 'hiringInfo.preferredColleges': 1 });
RecruiterSchema.index({
    'companyInfo.name': 'text',
    'companyInfo.description': 'text',
    'companyInfo.industry': 'text'
});
exports.Recruiter = mongoose_1.default.model('Recruiter', RecruiterSchema);
