// MongoDB Schema Models for Hiring Platform
// All models are designed with proper indexing and optimization

export { User, IUser } from './User';
export { Student, IStudent, IEducation, IExperience, ISkill, IJobPreferences } from './Student';
export { College, ICollege, IAddress, IContact, IPlacementStats } from './College';
export { Recruiter, IRecruiter, ICompanyInfo, IRecruiterProfile, IHiringInfo } from './Recruiter';
export { Admin, IAdmin } from './Admin';
export { Job, IJob, IJobRequirement, ISalaryRange, IJobLocation, IInterviewProcess } from './Job';
export { Application, IApplication, IApplicationStatus, IInterviewSchedule } from './Application';
export { ResumeJobAnalysis, IResumeJobAnalysis } from './ResumeJobAnalysis';
export { GeneratedResume, IGeneratedResume } from './GeneratedResume';
export { Course, ICourse } from './Course';
export { Message, IMessage } from './Message';
export { Notification, INotification } from './Notification';
export { OTPVerification, IOTPVerification } from './OTPVerification';
export { Invitation, IInvitation } from './Invitation';
export { InterviewSlot, IInterviewSlot } from './InterviewSlot';
export { default as Connection } from './Connection';

// Model names for reference
export const MODEL_NAMES = {
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
} as const;

// Database connection utility
export const connectDatabase = async (mongoUri: string) => {
  try {
    const mongoose = await import('mongoose');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};
