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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const UserSchema = new mongoose_1.Schema({
    tenantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    emailVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;
        },
        minlength: 8
    },
    phone: {
        type: String,
        trim: true,
        sparse: true,
        index: true
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    whatsappNumber: {
        type: String,
        trim: true,
        index: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    name: {
        type: String,
        trim: true
    },
    profilePicture: {
        type: String,
        trim: true
    },
    firstNameEncrypted: Buffer,
    lastNameEncrypted: Buffer,
    dateOfBirthEncrypted: Buffer,
    role: {
        type: String,
        enum: ['student', 'recruiter', 'college'],
        required: true
    },
    permissions: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending_verification', 'deleted'],
        default: 'pending_verification',
        index: true
    },
    lastLoginAt: {
        type: Date,
        index: true
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockedUntil: Date,
    consentGiven: {
        type: Boolean,
        default: false
    },
    consentDate: Date,
    deletionRequestedAt: Date,
    anonymizedAt: Date,
    profileVector: [Number],
    matchingPreferences: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    lastLogin: {
        type: Date,
        index: true
    }
}, {
    timestamps: true,
    collection: 'users'
});
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { status: { $ne: 'deleted' } } });
UserSchema.index({ tenantId: 1, role: 1 }, { partialFilterExpression: { status: 'active' } });
UserSchema.index({ phone: 1 }, { sparse: true, partialFilterExpression: { phoneVerified: true } });
UserSchema.methods.encryptField = function (value) {
    const algorithm = 'aes-256-gcm';
    const key = process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32);
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipher(algorithm, key);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return Buffer.from(encrypted, 'hex');
};
UserSchema.methods.decryptField = function (encryptedValue) {
    const algorithm = 'aes-256-gcm';
    const key = process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32);
    const decipher = crypto_1.default.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedValue.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
UserSchema.methods.checkTenantAccess = function (tenantId) {
    if (this.role === 'super_admin')
        return true;
    if (this.role === 'recruiter')
        return true;
    return this.tenantId?.equals(tenantId) || false;
};
UserSchema.methods.incrementFailedLogins = function () {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
        this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
};
UserSchema.methods.resetFailedLogins = function () {
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
    this.lastLoginAt = new Date();
};
UserSchema.pre('save', function (next) {
    if (['college_admin', 'placement_officer'].includes(this.role) && !this.tenantId) {
        return next(new Error('Tenant ID required for this role'));
    }
    next();
});
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ createdAt: -1 });
exports.User = mongoose_1.default.model('User', UserSchema);
