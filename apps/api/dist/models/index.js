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
exports.connectDatabase = exports.MODEL_NAMES = exports.Connection = exports.InterviewSlot = exports.Invitation = exports.OTPVerification = exports.Notification = exports.Message = exports.Course = exports.GeneratedResume = exports.ResumeJobAnalysis = exports.Application = exports.Job = exports.Admin = exports.Recruiter = exports.College = exports.Student = exports.User = void 0;
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
var Student_1 = require("./Student");
Object.defineProperty(exports, "Student", { enumerable: true, get: function () { return Student_1.Student; } });
var College_1 = require("./College");
Object.defineProperty(exports, "College", { enumerable: true, get: function () { return College_1.College; } });
var Recruiter_1 = require("./Recruiter");
Object.defineProperty(exports, "Recruiter", { enumerable: true, get: function () { return Recruiter_1.Recruiter; } });
var Admin_1 = require("./Admin");
Object.defineProperty(exports, "Admin", { enumerable: true, get: function () { return Admin_1.Admin; } });
var Job_1 = require("./Job");
Object.defineProperty(exports, "Job", { enumerable: true, get: function () { return Job_1.Job; } });
var Application_1 = require("./Application");
Object.defineProperty(exports, "Application", { enumerable: true, get: function () { return Application_1.Application; } });
var ResumeJobAnalysis_1 = require("./ResumeJobAnalysis");
Object.defineProperty(exports, "ResumeJobAnalysis", { enumerable: true, get: function () { return ResumeJobAnalysis_1.ResumeJobAnalysis; } });
var GeneratedResume_1 = require("./GeneratedResume");
Object.defineProperty(exports, "GeneratedResume", { enumerable: true, get: function () { return GeneratedResume_1.GeneratedResume; } });
var Course_1 = require("./Course");
Object.defineProperty(exports, "Course", { enumerable: true, get: function () { return Course_1.Course; } });
var Message_1 = require("./Message");
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return Message_1.Message; } });
var Notification_1 = require("./Notification");
Object.defineProperty(exports, "Notification", { enumerable: true, get: function () { return Notification_1.Notification; } });
var OTPVerification_1 = require("./OTPVerification");
Object.defineProperty(exports, "OTPVerification", { enumerable: true, get: function () { return OTPVerification_1.OTPVerification; } });
var Invitation_1 = require("./Invitation");
Object.defineProperty(exports, "Invitation", { enumerable: true, get: function () { return Invitation_1.Invitation; } });
var InterviewSlot_1 = require("./InterviewSlot");
Object.defineProperty(exports, "InterviewSlot", { enumerable: true, get: function () { return InterviewSlot_1.InterviewSlot; } });
var Connection_1 = require("./Connection");
Object.defineProperty(exports, "Connection", { enumerable: true, get: function () { return __importDefault(Connection_1).default; } });
exports.MODEL_NAMES = {
    USER: 'User',
    STUDENT: 'Student',
    COLLEGE: 'College',
    RECRUITER: 'Recruiter',
    ADMIN: 'Admin',
    JOB: 'Job',
    APPLICATION: 'Application',
    COURSE: 'Course',
    MESSAGE: 'Message',
    NOTIFICATION: 'Notification',
    OTP_VERIFICATION: 'OTPVerification',
    RESUME_JOB_ANALYSIS: 'ResumeJobAnalysis',
    GENERATED_RESUME: 'GeneratedResume',
    INVITATION: 'Invitation',
    INTERVIEW_SLOT: 'InterviewSlot'
};
const connectDatabase = async (mongoUri) => {
    try {
        const mongoose = await Promise.resolve().then(() => __importStar(require('mongoose')));
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully');
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
