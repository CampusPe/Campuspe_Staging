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
exports.Course = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CourseSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    type: {
        type: String,
        required: true,
        enum: ['undergraduate', 'postgraduate', 'diploma', 'certificate']
    },
    collegeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'College',
        required: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    eligibilityCriteria: {
        type: String,
        trim: true
    },
    fees: {
        tuition: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
CourseSchema.index({ collegeId: 1, code: 1 });
CourseSchema.index({ type: 1, isActive: 1 });
exports.Course = mongoose_1.default.model('Course', CourseSchema);
