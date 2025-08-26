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
exports.Invitation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InvitationSchema = new mongoose_1.Schema({
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    collegeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    recruiterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'negotiating', 'expired'],
        default: 'pending',
        index: true
    },
    invitationMessage: { type: String },
    proposedDates: [{
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            isFlexible: { type: Boolean, default: false },
            preferredTimeSlots: [{ type: String }]
        }],
    campusVisitWindow: {
        confirmedStartDate: { type: Date },
        confirmedEndDate: { type: Date },
        visitMode: {
            type: String,
            enum: ['physical', 'virtual', 'hybrid'],
            default: 'physical'
        },
        maxStudents: { type: Number }
    },
    tpoResponse: {
        responseDate: { type: Date },
        responseMessage: { type: String },
        counterProposal: {
            alternativeDates: [{
                    startDate: { type: Date },
                    endDate: { type: Date },
                    note: { type: String }
                }],
            additionalRequirements: { type: String }
        }
    },
    negotiationHistory: [{
            timestamp: { type: Date, default: Date.now },
            actor: {
                type: String,
                enum: ['recruiter', 'tpo'],
                required: true
            },
            action: {
                type: String,
                enum: ['proposed', 'accepted', 'declined', 'counter_proposed', 'resent'],
                required: true
            },
            details: { type: String, required: true },
            proposedDates: [{
                    startDate: { type: Date },
                    endDate: { type: Date }
                }]
        }],
    sentAt: { type: Date, default: Date.now, index: true },
    respondedAt: { type: Date },
    expiresAt: { type: Date, required: true, index: true },
    remindersSent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});
InvitationSchema.index({ jobId: 1, collegeId: 1 }, { unique: true });
InvitationSchema.index({ status: 1, expiresAt: 1 });
InvitationSchema.index({ sentAt: -1 });
InvitationSchema.index({ 'campusVisitWindow.confirmedStartDate': 1 });
InvitationSchema.methods.acceptInvitation = function (visitWindow, tpoMessage) {
    this.status = 'accepted';
    this.respondedAt = new Date();
    this.campusVisitWindow = visitWindow;
    this.tpoResponse = {
        responseDate: new Date(),
        responseMessage: tpoMessage
    };
    this.negotiationHistory.push({
        timestamp: new Date(),
        actor: 'tpo',
        action: 'accepted',
        details: tpoMessage || 'Invitation accepted'
    });
    return this.save();
};
InvitationSchema.methods.declineInvitation = function (reason) {
    this.status = 'declined';
    this.respondedAt = new Date();
    this.tpoResponse = {
        responseDate: new Date(),
        responseMessage: reason
    };
    this.negotiationHistory.push({
        timestamp: new Date(),
        actor: 'tpo',
        action: 'declined',
        details: reason || 'Invitation declined'
    });
    return this.save();
};
InvitationSchema.methods.proposeCounterDates = function (alternativeDates, message) {
    this.status = 'negotiating';
    this.respondedAt = new Date();
    this.tpoResponse = {
        responseDate: new Date(),
        responseMessage: message,
        counterProposal: {
            alternativeDates,
            additionalRequirements: message
        }
    };
    this.negotiationHistory.push({
        timestamp: new Date(),
        actor: 'tpo',
        action: 'counter_proposed',
        details: message || 'Counter proposal submitted',
        proposedDates: alternativeDates
    });
    return this.save();
};
InvitationSchema.statics.findExpired = function () {
    return this.find({
        status: 'pending',
        expiresAt: { $lt: new Date() },
        isActive: true
    });
};
InvitationSchema.statics.findByCollege = function (collegeId) {
    return this.find({ collegeId, isActive: true })
        .populate('jobId', 'title companyName salary applicationDeadline')
        .populate('recruiterId', 'companyInfo.name recruiterProfile')
        .sort({ sentAt: -1 });
};
InvitationSchema.statics.findByJob = function (jobId) {
    return this.find({ jobId, isActive: true })
        .populate('collegeId', 'name address.city')
        .sort({ sentAt: -1 });
};
exports.Invitation = mongoose_1.default.model('Invitation', InvitationSchema);
