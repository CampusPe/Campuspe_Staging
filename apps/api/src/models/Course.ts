import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICourse extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  duration: number; // in years
  type: 'undergraduate' | 'postgraduate' | 'diploma' | 'certificate';
  collegeId: Types.ObjectId;
  department: string;
  eligibilityCriteria?: string;
  fees?: {
    tuition: number;
    other: number;
    currency: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>({
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
    type: Schema.Types.ObjectId,
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

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
