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
exports.OTPVerification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const OTPVerificationSchema = new mongoose_1.Schema({
    email: {
        type: String,
        sparse: true,
        trim: true,
        index: true
    },
    phoneNumber: {
        type: String,
        sparse: true,
        trim: true,
        index: true
    },
    whatsappNumber: {
        type: String,
        sparse: true,
        trim: true,
        index: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['student', 'college', 'recruiter'],
        index: true
    },
    otp: {
        type: String,
        required: true,
        length: 6
    },
    otpExpiry: {
        type: Date,
        required: true,
        index: { expires: 0 }
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    sessionId: {
        type: String,
        sparse: true
    },
    azureMessageId: {
        type: String,
        sparse: true
    },
    verifiedAt: {
        type: Date,
        sparse: true
    }
}, {
    timestamps: true
});
OTPVerificationSchema.index({ email: 1, userType: 1, isVerified: 1 });
OTPVerificationSchema.index({ phoneNumber: 1, userType: 1, isVerified: 1 });
OTPVerificationSchema.index({ whatsappNumber: 1, userType: 1, isVerified: 1 });
OTPVerificationSchema.index({ userType: 1, createdAt: -1 });
OTPVerificationSchema.index({ sessionId: 1 }, { sparse: true });
OTPVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });
OTPVerificationSchema.pre('save', function (next) {
    if (this.userType === 'student') {
        if (!this.phoneNumber) {
            return next(new Error('Phone number is required for student verification'));
        }
    }
    else if (this.userType === 'college' || this.userType === 'recruiter') {
        if (!this.email) {
            return next(new Error('Email is required for college/recruiter verification'));
        }
    }
    next();
});
exports.OTPVerification = mongoose_1.default.model('OTPVerification', OTPVerificationSchema);
