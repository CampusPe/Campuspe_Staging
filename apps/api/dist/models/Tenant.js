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
exports.Tenant = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TenantSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    domain: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: 'Invalid domain format'
        },
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'pending_verification', 'archived'],
        default: 'pending_verification',
        index: true
    },
    subscriptionTier: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free',
        index: true
    },
    maxStudents: {
        type: Number,
        default: 1000,
        min: 0
    },
    maxRecruiters: {
        type: Number,
        default: 100,
        min: 0
    },
    aiFeaturesEnabled: {
        type: Boolean,
        default: true
    },
    semanticSearchEnabled: {
        type: Boolean,
        default: true
    },
    autoMatchingEnabled: {
        type: Boolean,
        default: true
    },
    dataRegion: {
        type: String,
        default: 'IN',
        maxlength: 50
    },
    encryptionKeyId: {
        type: String,
        maxlength: 255
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    collection: 'tenants'
});
TenantSchema.index({ status: 1, subscriptionTier: 1 });
TenantSchema.index({ domain: 'hashed' });
TenantSchema.virtual('isActive').get(function () {
    return this.status === 'active';
});
TenantSchema.pre('save', function (next) {
    if (this.isModified('domain')) {
        this.domain = this.domain.toLowerCase().trim();
    }
    next();
});
exports.Tenant = mongoose_1.default.model('Tenant', TenantSchema);
