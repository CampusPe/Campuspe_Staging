import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobRequirement {
  skill: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  mandatory: boolean;
  category: 'technical' | 'soft' | 'language' | 'certification';
}

export interface ISalaryRange {
  min: number;
  max: number;
  currency: string;
  negotiable: boolean;
}

export interface IJobLocation {
  city: string;
  state: string;
  country: string;
  isRemote: boolean;
  hybrid: boolean;
}

export interface IInterviewProcess {
  rounds: string[];
  duration: string;
  mode: 'online' | 'offline' | 'hybrid';
  additionalInfo?: string;
}

export interface IJob extends Document {
  _id: Types.ObjectId;
  
  // Basic Information
  title: string;
  description: string;
  jobType: 'full-time' | 'part-time' | 'internship' | 'contract' | 'freelance';
  department: string;
  
  // Company & Recruiter
  recruiterId: Types.ObjectId;
  companyName: string;
  
  // Location & Work Mode
  locations: IJobLocation[];
  workMode: 'remote' | 'onsite' | 'hybrid';
  
  // Requirements
  requirements: IJobRequirement[];
  requiredSkills: string[]; // Simple array for matching
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  minExperience: number; // in years
  maxExperience?: number;
  
  // Education Requirements
  educationRequirements: {
    degree: string;
    field?: string;
    minimumGrade?: number;
    mandatory: boolean;
  }[];
  
  // Compensation
  salary: ISalaryRange;
  benefits: string[];
  
  // Application Details
  applicationDeadline: Date;
  expectedJoiningDate?: Date;
  totalPositions: number;
  filledPositions: number;
  
  // Targeting
  targetColleges: Types.ObjectId[];
  targetCourses: string[];
  allowDirectApplications: boolean;
  
  // Interview & Selection
  interviewProcess: IInterviewProcess;
  
  // Status & Metadata
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired';
  isUrgent: boolean;
  featuredUntil?: Date;
  
  // AI & Matching
  aiGeneratedDescription?: string;
  matchingKeywords: string[];
  
  // Analytics
  views: number;
  applications: Types.ObjectId[];
  
  // Timestamps
  postedAt: Date;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobRequirementSchema = new Schema({
  skill: { type: String, required: true, trim: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], required: true },
  mandatory: { type: Boolean, default: false },
  category: { type: String, enum: ['technical', 'soft', 'language', 'certification'], required: true }
});

const SalaryRangeSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  negotiable: { type: Boolean, default: false }
});

const JobLocationSchema = new Schema({
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  isRemote: { type: Boolean, default: false },
  hybrid: { type: Boolean, default: false }
});

const InterviewProcessSchema = new Schema({
  rounds: [{ type: String, required: true }],
  duration: { type: String, required: true },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], required: true },
  additionalInfo: { type: String }
});

const EducationRequirementSchema = new Schema({
  degree: { type: String, required: true },
  field: { type: String },
  minimumGrade: { type: Number },
  mandatory: { type: Boolean, default: false }
});

const JobSchema = new Schema<IJob>({
  // Basic Information
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, required: true },
  jobType: { 
    type: String, 
    enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance'], 
    required: true,
    index: true 
  },
  department: { type: String, required: true, trim: true },
  
  // Company & Recruiter
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
  companyName: { type: String, required: true, trim: true, index: true },
  
  // Location & Work Mode
  locations: [JobLocationSchema],
  workMode: { 
    type: String, 
    enum: ['remote', 'onsite', 'hybrid'], 
    required: true,
    index: true 
  },
  
  // Requirements
  requirements: [JobRequirementSchema],
  experienceLevel: { 
    type: String, 
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'], 
    required: true,
    index: true 
  },
  minExperience: { type: Number, required: true, min: 0 },
  maxExperience: { type: Number, min: 0 },
  
  // Education Requirements
  educationRequirements: [EducationRequirementSchema],
  
  // Compensation
  salary: { type: SalaryRangeSchema, required: true },
  benefits: [{ type: String }],
  
  // Application Details
  applicationDeadline: { type: Date, required: true, index: true },
  expectedJoiningDate: { type: Date },
  totalPositions: { type: Number, required: true, min: 1 },
  filledPositions: { type: Number, default: 0, min: 0 },
  
  // Targeting
  targetColleges: [{ type: Schema.Types.ObjectId, ref: 'College' }],
  targetCourses: [{ type: String }],
  allowDirectApplications: { type: Boolean, default: true },
  
  // Interview & Selection
  interviewProcess: { type: InterviewProcessSchema, required: true },
  
  // Status & Metadata
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'closed', 'expired'], 
    default: 'draft',
    index: true 
  },
  isUrgent: { type: Boolean, default: false, index: true },
  featuredUntil: { type: Date },
  
  // AI & Matching
  aiGeneratedDescription: { type: String },
  matchingKeywords: [{ type: String }],
  
  // Analytics
  views: { type: Number, default: 0 },
  applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
  
  // Timestamps
  postedAt: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for optimization
JobSchema.index({ title: 'text', description: 'text', 'requirements.skill': 'text' });
JobSchema.index({ status: 1, postedAt: -1 });
JobSchema.index({ 'locations.city': 1, 'locations.state': 1 });
JobSchema.index({ jobType: 1, experienceLevel: 1 });
JobSchema.index({ applicationDeadline: 1, status: 1 });
JobSchema.index({ 'requirements.skill': 1 });
JobSchema.index({ targetColleges: 1, status: 1 });
JobSchema.index({ companyName: 1, status: 1 });
JobSchema.index({ workMode: 1, status: 1 });

// Compound indexes for complex queries
JobSchema.index({ 
  status: 1, 
  'locations.city': 1, 
  jobType: 1, 
  experienceLevel: 1 
});

// Middleware to update lastModified
JobSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

export const Job = mongoose.model<IJob>('Job', JobSchema);