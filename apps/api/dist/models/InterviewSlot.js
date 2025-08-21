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
exports.InterviewSlot = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InterviewSlotSchema = new mongoose_1.Schema({
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    recruiterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
    collegeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    scheduledDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true, min: 15, max: 180 },
    totalCapacity: { type: Number, required: true, min: 1 },
    availableSlots: { type: Number, required: true, min: 0 },
    assignedCandidates: [{
            studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
            timeSlot: { type: String, required: true },
            status: {
                type: String,
                enum: ['assigned', 'confirmed', 'attended', 'no_show', 'cancelled'],
                default: 'assigned',
                index: true
            },
            assignedAt: { type: Date, default: Date.now },
            confirmedAt: { type: Date },
            notes: { type: String }
        }],
    waitlistCandidates: [{
            studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
            addedAt: { type: Date, default: Date.now },
            priority: { type: Number, required: true, min: 1 },
            notes: { type: String }
        }],
    mode: {
        type: String,
        enum: ['physical', 'virtual', 'hybrid'],
        required: true,
        index: true
    },
    location: {
        venue: { type: String },
        address: { type: String },
        room: { type: String },
        landmarks: { type: String }
    },
    virtualMeetingDetails: {
        platform: { type: String },
        meetingId: { type: String },
        passcode: { type: String },
        joinUrl: { type: String }
    },
    eligibilityCriteria: {
        minCGPA: { type: Number },
        requiredSkills: [{ type: String }],
        courses: [{ type: String, required: true }],
        graduationYear: { type: Number, required: true },
        maxBacklogs: { type: Number, default: 0 }
    },
    autoAssignmentSettings: {
        isEnabled: { type: Boolean, default: true },
        assignmentAlgorithm: {
            type: String,
            enum: ['score_based', 'first_come_first_serve', 'random'],
            default: 'score_based'
        },
        minimumScore: { type: Number, min: 0, max: 100 },
        preferredColleges: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'College' }]
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'],
        default: 'draft',
        index: true
    },
    publishedAt: { type: Date },
    completedAt: { type: Date },
    interviewers: [{
            name: { type: String, required: true },
            designation: { type: String, required: true },
            email: { type: String, required: true },
            phoneNumber: { type: String }
        }],
    notifications: [{
            sent: { type: Boolean, default: false },
            sentAt: { type: Date },
            type: {
                type: String,
                enum: ['assignment', 'reminder_24h', 'reminder_2h', 'confirmation'],
                required: true
            },
            recipients: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Student' }]
        }],
    candidateInstructions: {
        preInterviewInstructions: { type: String },
        documentsRequired: [{ type: String }],
        dresscode: { type: String },
        additionalNotes: { type: String }
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    lastModifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true, index: true }
}, {
    timestamps: true
});
InterviewSlotSchema.index({ jobId: 1, scheduledDate: 1 });
InterviewSlotSchema.index({ recruiterId: 1, status: 1 });
InterviewSlotSchema.index({ collegeId: 1, scheduledDate: 1 });
InterviewSlotSchema.index({ status: 1, scheduledDate: 1 });
InterviewSlotSchema.index({ 'assignedCandidates.studentId': 1, 'assignedCandidates.status': 1 });
InterviewSlotSchema.methods.assignCandidate = function (studentId, autoGenerate = true) {
    if (this.availableSlots <= 0) {
        throw new Error('No available slots');
    }
    const existingAssignment = this.assignedCandidates.find((candidate) => candidate.studentId.toString() === studentId);
    if (existingAssignment) {
        throw new Error('Candidate already assigned');
    }
    let timeSlot = '';
    if (autoGenerate) {
        const assignedSlots = this.assignedCandidates.map((c) => c.timeSlot);
        timeSlot = this.generateNextAvailableTimeSlot(assignedSlots);
    }
    this.assignedCandidates.push({
        studentId: new mongoose_1.default.Types.ObjectId(studentId),
        timeSlot,
        status: 'assigned',
        assignedAt: new Date()
    });
    this.availableSlots -= 1;
    return this.save();
};
InterviewSlotSchema.methods.addToWaitlist = function (studentId) {
    const nextPriority = Math.max(...this.waitlistCandidates.map((c) => c.priority), 0) + 1;
    this.waitlistCandidates.push({
        studentId: new mongoose_1.default.Types.ObjectId(studentId),
        addedAt: new Date(),
        priority: nextPriority
    });
    return this.save();
};
InterviewSlotSchema.methods.generateNextAvailableTimeSlot = function (assignedSlots) {
    const startTime = this.startTime;
    const endTime = this.endTime;
    const duration = this.duration;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
        const slotStart = minutesToTime(current);
        const slotEnd = minutesToTime(current + duration);
        const timeSlot = `${slotStart}-${slotEnd}`;
        if (!assignedSlots.includes(timeSlot)) {
            return timeSlot;
        }
    }
    throw new Error('No available time slots');
};
InterviewSlotSchema.methods.confirmAttendance = function (studentId) {
    const candidate = this.assignedCandidates.find((c) => c.studentId.toString() === studentId);
    if (!candidate) {
        throw new Error('Candidate not found in assigned list');
    }
    candidate.status = 'confirmed';
    candidate.confirmedAt = new Date();
    return this.save();
};
InterviewSlotSchema.methods.markAttended = function (studentId) {
    const candidate = this.assignedCandidates.find((c) => c.studentId.toString() === studentId);
    if (!candidate) {
        throw new Error('Candidate not found in assigned list');
    }
    candidate.status = 'attended';
    return this.save();
};
InterviewSlotSchema.methods.markNoShow = function (studentId) {
    const candidate = this.assignedCandidates.find((c) => c.studentId.toString() === studentId);
    if (!candidate) {
        throw new Error('Candidate not found in assigned list');
    }
    candidate.status = 'no_show';
    if (this.waitlistCandidates.length > 0) {
        const nextCandidate = this.waitlistCandidates.sort((a, b) => a.priority - b.priority)[0];
        this.assignCandidate(nextCandidate.studentId.toString());
        this.waitlistCandidates = this.waitlistCandidates.filter((c) => c.studentId.toString() !== nextCandidate.studentId.toString());
    }
    else {
        this.availableSlots += 1;
    }
    return this.save();
};
InterviewSlotSchema.statics.findByJob = function (jobId) {
    return this.find({ jobId, isActive: true })
        .populate('assignedCandidates.studentId', 'firstName lastName email collegeId')
        .populate('waitlistCandidates.studentId', 'firstName lastName email collegeId')
        .sort({ scheduledDate: 1 });
};
InterviewSlotSchema.statics.findUpcoming = function (days = 7) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    return this.find({
        scheduledDate: { $gte: today, $lte: futureDate },
        status: { $in: ['published', 'in_progress'] },
        isActive: true
    }).sort({ scheduledDate: 1 });
};
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
exports.InterviewSlot = mongoose_1.default.model('InterviewSlot', InterviewSlotSchema);
