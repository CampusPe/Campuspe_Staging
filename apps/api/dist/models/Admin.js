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
exports.Admin = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AdminSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    adminProfile: {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        designation: { type: String, required: true, trim: true },
        department: { type: String, trim: true },
        profilePicture: { type: String }
    },
    permissions: {
        canApproveColleges: { type: Boolean, default: true },
        canApproveRecruiters: { type: Boolean, default: true },
        canManageUsers: { type: Boolean, default: false },
        canViewAnalytics: { type: Boolean, default: true },
        canManageJobs: { type: Boolean, default: false }
    },
    activityLog: [{
            action: { type: String, required: true },
            targetType: { type: String, enum: ['college', 'recruiter', 'user', 'job'], required: true },
            targetId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
            timestamp: { type: Date, default: Date.now },
            details: { type: String }
        }],
    isActive: { type: Boolean, default: true, index: true }
}, {
    timestamps: true
});
AdminSchema.index({ userId: 1, isActive: 1 });
AdminSchema.index({ 'permissions.canApproveColleges': 1 });
AdminSchema.index({ 'permissions.canApproveRecruiters': 1 });
exports.Admin = mongoose_1.default.model('Admin', AdminSchema);
