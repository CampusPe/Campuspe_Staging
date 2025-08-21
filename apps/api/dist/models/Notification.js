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
exports.Notification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const NotificationSchema = new mongoose_1.Schema({
    recipientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientType: { type: String, enum: ['student', 'recruiter', 'college'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    notificationType: {
        type: String,
        enum: ['job_match', 'application_status', 'interview_reminder', 'college_approval', 'new_applicant', 'system', 'promotional'],
        required: true,
        index: true
    },
    channels: {
        platform: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false },
        push: { type: Boolean, default: false }
    },
    deliveryStatus: {
        platform: { type: String, enum: ['pending', 'sent', 'read', 'failed'], default: 'pending' },
        email: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' },
        whatsapp: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'], default: 'pending' },
        push: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' }
    },
    relatedJobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job', index: true },
    relatedApplicationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Application', index: true },
    relatedCollegeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'College', index: true },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    isUrgent: { type: Boolean, default: false, index: true },
    actionRequired: { type: Boolean, default: false },
    actionUrl: { type: String },
    actionText: { type: String },
    personalizationData: { type: mongoose_1.Schema.Types.Mixed },
    templateId: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    readAt: { type: Date },
    clickedAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    expiresAt: { type: Date }
}, {
    timestamps: true
});
NotificationSchema.index({ recipientId: 1, recipientType: 1 });
NotificationSchema.index({ notificationType: 1, recipientType: 1 });
NotificationSchema.index({ scheduledAt: 1, 'deliveryStatus.platform': 1 });
NotificationSchema.index({ priority: 1, isUrgent: 1 });
NotificationSchema.index({ relatedJobId: 1, notificationType: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({
    recipientId: 1,
    'deliveryStatus.platform': 1,
    createdAt: -1
});
NotificationSchema.index({
    'deliveryStatus.whatsapp': 1,
    retryCount: 1,
    maxRetries: 1
});
exports.Notification = mongoose_1.default.model('Notification', NotificationSchema);
