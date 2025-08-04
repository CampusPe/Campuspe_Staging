import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IContact {
  name: string;
  designation: string;
  email: string;
  phone: string;
}

export interface IPlacementStats {
  year: number;
  totalStudents: number;
  placedStudents: number;
  averagePackage: number;
  highestPackage: number;
  topRecruiters: string[];
}

export interface ICollege extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  shortName?: string;
  domainCode: string; // Unique code for student registration
  website?: string;
  logo?: string;
  
  // Contact Information
  address: IAddress;
  primaryContact: IContact;
  placementContact?: IContact;
  
  // Academic Information
  establishedYear: number;
  affiliation: string; // University affiliation
  accreditation: string[];
  
  // Courses & Programs
  courses: Types.ObjectId[]; // Reference to Course model
  offeredPrograms: string[]; // Simple array for matching
  departments: string[];
  
  // Student & Recruiter Management
  students: Types.ObjectId[]; // Reference to Student model
  approvedRecruiters: Types.ObjectId[]; // Reference to Recruiter model
  pendingRecruiters: Types.ObjectId[]; // Recruiters awaiting approval
  
  // Placement Information
  placementStats: IPlacementStats[];
  isPlacementActive: boolean;
  placementCriteria?: {
    minimumCGPA: number;
    allowedBranches: string[];
    noOfBacklogs: number;
  };
  
  // Verification & Status
  isVerified: boolean;
  verificationDocuments: string[];
  isActive: boolean;
  
  // Admin Approval System
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: Types.ObjectId; // Admin who approved
  approvedAt?: Date;
  rejectionReason?: string;
  resubmissionNotes?: string;
  submittedDocuments?: string[]; // Additional documents uploaded for approval
  
  // Settings
  allowDirectApplications: boolean; // Students can apply directly or need approval
  whatsappGroupId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'India' }
});

const ContactSchema = new Schema({
  name: { type: String, required: true },
  designation: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true }
});

const PlacementStatsSchema = new Schema({
  year: { type: Number, required: true },
  totalStudents: { type: Number, required: true },
  placedStudents: { type: Number, required: true },
  averagePackage: { type: Number, required: true },
  highestPackage: { type: Number, required: true },
  topRecruiters: [{ type: String }]
});

const CollegeSchema = new Schema<ICollege>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true, index: true },
  shortName: { type: String, trim: true },
  domainCode: { type: String, required: true, unique: true, uppercase: true, index: true },
  website: { type: String, trim: true },
  logo: { type: String },
  
  // Contact Information
  address: { type: AddressSchema, required: true },
  primaryContact: { type: ContactSchema, required: true },
  placementContact: { type: ContactSchema },
  
  // Academic Information
  establishedYear: { type: Number, required: true },
  affiliation: { type: String, required: true },
  accreditation: [{ type: String }],
  
  // Courses & Programs
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  departments: [{ type: String, required: true }],
  
  // Student & Recruiter Management
  students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  approvedRecruiters: [{ type: Schema.Types.ObjectId, ref: 'Recruiter' }],
  pendingRecruiters: [{ type: Schema.Types.ObjectId, ref: 'Recruiter' }],
  
  // Placement Information
  placementStats: [PlacementStatsSchema],
  isPlacementActive: { type: Boolean, default: true, index: true },
  placementCriteria: {
    minimumCGPA: { type: Number, default: 6.0 },
    allowedBranches: [{ type: String }],
    noOfBacklogs: { type: Number, default: 0 }
  },
  
  // Verification & Status
  isVerified: { type: Boolean, default: false },
  verificationDocuments: [{ type: String }],
  isActive: { type: Boolean, default: true },
  
  // Admin Approval System
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending',
    index: true 
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  resubmissionNotes: { type: String },
  submittedDocuments: [{ type: String }],
  
  // Settings
  allowDirectApplications: { type: Boolean, default: false },
  whatsappGroupId: { type: String }
}, {
  timestamps: true
});

// Indexes for optimization
CollegeSchema.index({ domainCode: 1, isActive: 1 });
CollegeSchema.index({ 'address.city': 1, 'address.state': 1 });
CollegeSchema.index({ name: 'text', shortName: 'text' });
CollegeSchema.index({ departments: 1 });
CollegeSchema.index({ isVerified: 1, isActive: 1 });

export const College = mongoose.model<ICollege>('College', CollegeSchema);