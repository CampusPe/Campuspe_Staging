import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: 'student' | 'recruiter' | 'college' | 'admin';
  phone?: string;
  whatsappNumber?: string;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['student', 'recruiter', 'college', 'admin'],
    required: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    index: true
  },
  whatsappNumber: {
    type: String,
    trim: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for optimization
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
