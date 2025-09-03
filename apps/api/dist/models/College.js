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
exports.College = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AddressSchema = new mongoose_1.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' }
});
const ContactSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
});
const PlacementStatsSchema = new mongoose_1.Schema({
    year: { type: Number, required: true },
    totalStudents: { type: Number, required: true },
    placedStudents: { type: Number, required: true },
    averagePackage: { type: Number, required: true },
    highestPackage: { type: Number, required: true },
    topRecruiters: [{ type: String }]
});
const CollegeSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true, index: true },
    shortName: { type: String, trim: true },
    domainCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    website: { type: String, trim: true },
    logo: { type: String },
    address: { type: AddressSchema, required: true },
    primaryContact: { type: ContactSchema, required: true },
    placementContact: { type: ContactSchema },
    establishedYear: { type: Number, required: true },
    affiliation: { type: String, required: true },
    recognizedBy: { type: String, trim: true },
    collegeType: { type: String, trim: true },
    aboutCollege: { type: String, trim: true },
    accreditation: [{ type: String }],
    courses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Course' }],
    offeredPrograms: [{ type: String }],
    departments: [{ type: String, required: true }],
    students: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Student' }],
    approvedRecruiters: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Recruiter' }],
    pendingRecruiters: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Recruiter' }],
    placementStats: [PlacementStatsSchema],
    isPlacementActive: { type: Boolean, default: true, index: true },
    placementCriteria: {
        minimumCGPA: { type: Number, default: 6.0 },
        allowedBranches: [{ type: String }],
        noOfBacklogs: { type: Number, default: 0 }
    },
    isVerified: { type: Boolean, default: false },
    verificationDocuments: [{ type: String }],
    isActive: { type: Boolean, default: true },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'reverify', 'deactivated'],
        default: 'pending',
        index: true
    },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    resubmissionNotes: { type: String },
    submittedDocuments: [{ type: String }],
    notifications: [{
            subject: { type: String, required: true },
            message: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            isRead: { type: Boolean, default: false },
            type: {
                type: String,
                enum: ['admin_message', 'admin_broadcast', 'system'],
                default: 'admin_message'
            }
        }],
    allowDirectApplications: { type: Boolean, default: false },
    whatsappGroupId: { type: String }
}, {
    timestamps: true
});
CollegeSchema.index({ domainCode: 1, isActive: 1 });
CollegeSchema.index({ 'address.city': 1, 'address.state': 1 });
CollegeSchema.index({ name: 'text', shortName: 'text' });
CollegeSchema.index({ departments: 1 });
CollegeSchema.index({ isVerified: 1, isActive: 1 });
exports.College = mongoose_1.default.model('College', CollegeSchema);
