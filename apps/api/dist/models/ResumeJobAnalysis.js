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
exports.ResumeJobAnalysis = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ResumeJobAnalysisSchema = new mongoose_1.Schema({
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    jobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
        index: true
    },
    matchScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    explanation: {
        type: String,
        required: true
    },
    suggestions: [{
            type: String
        }],
    skillsMatched: [{
            type: String
        }],
    skillsGap: [{
            type: String
        }],
    resumeText: {
        type: String,
        required: true
    },
    resumeVersion: {
        type: Number,
        default: 1
    },
    jobTitle: {
        type: String,
        required: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    applicationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Application'
    },
    dateApplied: {
        type: Date
    },
    improvementsGenerated: {
        type: Boolean,
        default: false
    },
    improvementsSuggestions: [{
            section: { type: String },
            currentText: { type: String },
            suggestedText: { type: String },
            reason: { type: String }
        }],
    isActive: {
        type: Boolean,
        default: true
    },
    analyzedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
ResumeJobAnalysisSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
ResumeJobAnalysisSchema.index({ studentId: 1, matchScore: -1 });
ResumeJobAnalysisSchema.index({ jobId: 1, matchScore: -1 });
ResumeJobAnalysisSchema.index({ analyzedAt: -1 });
ResumeJobAnalysisSchema.index({ dateApplied: -1 });
ResumeJobAnalysisSchema.index({
    studentId: 1,
    isActive: 1,
    matchScore: -1
});
ResumeJobAnalysisSchema.index({
    jobId: 1,
    dateApplied: 1,
    matchScore: -1
});
exports.ResumeJobAnalysis = mongoose_1.default.model('ResumeJobAnalysis', ResumeJobAnalysisSchema);
