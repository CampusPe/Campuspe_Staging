import { Types } from 'mongoose';
import { Student } from '../models/Student';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { ResumeJobAnalysis } from '../models/ResumeJobAnalysis';
import AIResumeMatchingService from './ai-resume-matching';

/**
 * Unified Job Matching Service
 * 
 * This service consolidates all matching logic to ensure consistency across:
 * 1. Resume upload matching
 * 2. Job application matching  
 * 3. Job posting auto-matching
 * 
 * Key Features:
 * - Single source of truth for match calculations
 * - Consistent 70% threshold for notifications
 * - Unified AI analysis using Claude Haiku
 * - Prevents duplicate notifications
 * - Stores all applications (regardless of match score)
 * - Only sends notifications for 70%+ matches
 */

export interface UnifiedMatchResult {
  matchScore: number;
  explanation: string;
  suggestions: string[];
  skillsMatched: string[];
  skillsGap: string[];
  shouldNotify: boolean; // true if >= 70%
  applicationId?: string;
  notificationSent?: boolean;
}

export interface StudentJobPair {
  studentId: string;
  jobId: string;
  resumeContent: string;
  jobTitle: string;
  jobDescription: string;
  companyName: string;
}

class UnifiedMatchingService {
  private readonly NOTIFICATION_THRESHOLD = 70; // Single source of truth
  private readonly notificationCache = new Set<string>(); // Prevent duplicates

  /**
   * Core matching function - used by all other services
   */
  async analyzeMatch(studentJobPair: StudentJobPair): Promise<UnifiedMatchResult> {
    console.log(`🎯 [UNIFIED MATCHING] Analyzing match for ${studentJobPair.jobTitle} at ${studentJobPair.companyName}`);

    try {
      // Use the same AI service everywhere - Claude Haiku
      const matchResult = await AIResumeMatchingService.analyzeResumeMatch(
        studentJobPair.resumeContent,
        studentJobPair.jobDescription
      );

      const shouldNotify = matchResult.matchScore >= this.NOTIFICATION_THRESHOLD;
      
      console.log(`📊 Match Score: ${matchResult.matchScore}% | Notify: ${shouldNotify ? '✅' : '❌'} (Threshold: ${this.NOTIFICATION_THRESHOLD}%)`);

      return {
        ...matchResult,
        shouldNotify,
        notificationSent: false
      };

    } catch (error) {
      console.error('Error in unified matching:', error);
      
      // Fallback response
      return {
        matchScore: 0,
        explanation: 'Analysis failed',
        suggestions: [],
        skillsMatched: [],
        skillsGap: [],
        shouldNotify: false,
        notificationSent: false
      };
    }
  }

  /**
   * 1. RESUME UPLOAD MATCHING
   * Called when student uploads resume - should NOT send notifications
   * Only updates profile and calculates potential matches
   */
  async handleResumeUpload(userId: string, analysis: any): Promise<void> {
    console.log(`📄 [RESUME UPLOAD] Processing for user ${userId}`);
    
    try {
      // Find active jobs to match against
      const activeJobs = await Job.find({ 
        status: 'active',
        isActive: true 
      }).limit(50).lean();

      console.log(`Found ${activeJobs.length} active jobs to match against`);

      const student = await Student.findOne({ userId }).lean();
      if (!student) {
        console.log('❌ Student not found');
        return;
      }

      const resumeContent = analysis.extractedDetails?.summary || 
                           student.resumeText || 
                           `Skills: ${analysis.skills?.join(', ')}`;

      let highMatchCount = 0;
      
      // Calculate matches but DON'T send notifications
      for (const job of activeJobs) {
        const studentJobPair: StudentJobPair = {
          studentId: student._id.toString(),
          jobId: job._id.toString(),
          resumeContent,
          jobTitle: job.title,
          jobDescription: job.description,
          companyName: job.companyName
        };

        const matchResult = await this.analyzeMatch(studentJobPair);
        
        if (matchResult.shouldNotify) {
          highMatchCount++;
          console.log(`🎯 High match found: ${matchResult.matchScore}% with ${job.title} at ${job.companyName} (NO NOTIFICATION SENT)`);
        }
      }

      console.log(`📊 [RESUME UPLOAD] Found ${highMatchCount} high-quality matches (70%+) - notifications will be sent when student applies`);

    } catch (error) {
      console.error('Error in resume upload matching:', error);
    }
  }

  /**
   * 2. JOB APPLICATION MATCHING  
   * Called when student applies for job - should send notification if 70%+
   */
  async handleJobApplication(
    studentId: string, 
    jobId: string, 
    applicationId: string,
    resumeContent: string
  ): Promise<UnifiedMatchResult> {
    console.log(`📝 [JOB APPLICATION] Processing application ${applicationId}`);

    try {
      const job = await Job.findById(jobId).lean();
      if (!job) {
        throw new Error('Job not found');
      }

      const student = await Student.findById(studentId).populate('userId', 'phone whatsappNumber').lean();
      if (!student) {
        throw new Error('Student not found');
      }

      const studentJobPair: StudentJobPair = {
        studentId,
        jobId,
        resumeContent,
        jobTitle: job.title,
        jobDescription: job.description,
        companyName: job.companyName
      };

      const matchResult = await this.analyzeMatch(studentJobPair);
      matchResult.applicationId = applicationId;

      // Save resume analysis (always, regardless of score)
      await this.saveResumeAnalysis(studentJobPair, matchResult, applicationId);

      // Send notification ONLY if match is 70%+ and not already sent
      if (matchResult.shouldNotify) {
        const notificationKey = `${studentId}-${jobId}`;
        
        if (!this.notificationCache.has(notificationKey)) {
          const notificationSent = await this.sendNotification(student, job, matchResult);
          matchResult.notificationSent = notificationSent;
          
          if (notificationSent) {
            this.notificationCache.add(notificationKey);
            console.log(`✅ [JOB APPLICATION] Notification sent for ${matchResult.matchScore}% match`);
          }
        } else {
          console.log(`⚠️ [JOB APPLICATION] Notification already sent for this student-job pair`);
        }
      } else {
        console.log(`📊 [JOB APPLICATION] Match score ${matchResult.matchScore}% below notification threshold`);
      }

      return matchResult;

    } catch (error) {
      console.error('Error in job application matching:', error);
      throw error;
    }
  }

  /**
   * 3. JOB POSTING MATCHING
   * Called when recruiter posts job - should send notifications to 70%+ matches
   */
  async handleJobPosting(jobId: string): Promise<void> {
    console.log(`🏢 [JOB POSTING] Processing new job ${jobId}`);

    try {
      const job = await Job.findById(jobId).lean();
      if (!job) {
        console.log('❌ Job not found');
        return;
      }

      // Find all active students
      const students = await Student.find({ 
        isActive: true,
        resumeText: { $exists: true, $ne: null }
      }).populate('userId', 'phone whatsappNumber').lean();

      console.log(`📊 Found ${students.length} active students to analyze`);

      let notificationsSent = 0;
      let totalMatches = 0;

      for (const student of students) {
        try {
          const resumeContent = student.resumeText || 
                               `Skills: ${student.skills?.map((s: any) => s.name || s).join(', ')}`;

          const studentJobPair: StudentJobPair = {
            studentId: student._id.toString(),
            jobId: jobId,
            resumeContent,
            jobTitle: job.title,
            jobDescription: job.description,
            companyName: job.companyName
          };

          const matchResult = await this.analyzeMatch(studentJobPair);
          totalMatches++;

          if (matchResult.shouldNotify) {
            const notificationKey = `${student._id}-${jobId}`;
            
            if (!this.notificationCache.has(notificationKey)) {
              const notificationSent = await this.sendNotification(student, job, matchResult);
              
              if (notificationSent) {
                this.notificationCache.add(notificationKey);
                notificationsSent++;
                console.log(`✅ Notification sent to ${student.firstName} ${student.lastName} - ${matchResult.matchScore}% match`);
              }
            }
          }

          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (studentError) {
          console.error(`Error processing student ${student._id}:`, studentError);
        }
      }

      console.log(`🎉 [JOB POSTING] Processed ${totalMatches} students, sent ${notificationsSent} notifications`);

    } catch (error) {
      console.error('Error in job posting matching:', error);
    }
  }

  /**
   * Save resume analysis to database
   */
  private async saveResumeAnalysis(
    studentJobPair: StudentJobPair, 
    matchResult: UnifiedMatchResult,
    applicationId?: string
  ): Promise<void> {
    try {
      const analysis = new ResumeJobAnalysis({
        studentId: new Types.ObjectId(studentJobPair.studentId),
        jobId: new Types.ObjectId(studentJobPair.jobId),
        applicationId: applicationId ? new Types.ObjectId(applicationId) : undefined,
        matchScore: matchResult.matchScore,
        explanation: matchResult.explanation,
        suggestions: matchResult.suggestions,
        skillsMatched: matchResult.skillsMatched,
        skillsGap: matchResult.skillsGap,
        resumeText: studentJobPair.resumeContent.substring(0, 1000),
        jobTitle: studentJobPair.jobTitle,
        jobDescription: studentJobPair.jobDescription.substring(0, 1000),
        companyName: studentJobPair.companyName,
        dateApplied: applicationId ? new Date() : undefined,
        isActive: true,
        analyzedAt: new Date()
      });

      await analysis.save();
      console.log(`💾 Resume analysis saved for ${studentJobPair.jobTitle}`);

    } catch (error) {
      console.error('Error saving resume analysis:', error);
    }
  }

  /**
   * Send WhatsApp notification
   */
  private async sendNotification(student: any, job: any, matchResult: UnifiedMatchResult): Promise<boolean> {
    try {
      const userDetails = student.userId as any;
      const phoneNumber = userDetails?.whatsappNumber || userDetails?.phone;

      if (!phoneNumber) {
        console.log(`📞 No phone number for ${student.firstName} ${student.lastName}`);
        return false;
      }

      const { sendJobMatchNotification } = require('./whatsapp');

      // Format salary information
      let salaryInfo = 'Competitive';
      if (job.salary && job.salary.min && job.salary.max) {
        const currency = job.salary.currency === 'INR' ? '₹' : job.salary.currency;
        const minLPA = Math.round(job.salary.min / 100000);
        const maxLPA = Math.round(job.salary.max / 100000);
        salaryInfo = `${currency}${minLPA}-${maxLPA} LPA`;
      }

      // Format location information
      let locationInfo: string = job.workMode || 'Remote';
      if (job.locations && job.locations.length > 0) {
        const location = job.locations[0];
        if (location.city && location.state) {
          locationInfo = `${location.city}, ${location.state}`;
        }
        if (location.isRemote) {
          locationInfo = 'Remote';
        } else if (location.hybrid) {
          locationInfo = `${locationInfo} (Hybrid)`;
        }
      }

      const messageData = {
        jobTitle: job.title,
        company: job.companyName,
        location: locationInfo,
        salary: salaryInfo,
        matchScore: matchResult.matchScore.toString(),
        personalizedMessage: `🎉 Great match! You're a ${matchResult.matchScore}% fit for this role.`,
        jobLink: `https://campuspe.com/jobs/${job._id}`
      };

      const result = await sendJobMatchNotification(phoneNumber, messageData);

      if (result.success) {
        // Save notification record
        const { Notification } = require('../models');
        await new Notification({
          recipientId: student._id,
          recipientType: 'student',
          title: `🎯 Job Match: ${job.title}`,
          message: `${matchResult.matchScore}% match at ${job.companyName}`,
          notificationType: 'job_match',
          channels: { whatsapp: true },
          deliveryStatus: { whatsapp: 'sent' },
          relatedJobId: job._id,
          priority: 'high',
          metadata: {
            matchScore: matchResult.matchScore,
            autoSent: true,
            triggerReason: 'high_match_score',
            unifiedMatching: true
          }
        }).save();

        return true;
      }

      return false;

    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Check if notification was already sent for this student-job pair
   */
  async wasNotificationSent(studentId: string, jobId: string): Promise<boolean> {
    try {
      const { Notification } = require('../models');
      const existingNotification = await Notification.findOne({
        recipientId: studentId,
        relatedJobId: jobId,
        notificationType: 'job_match',
        'deliveryStatus.whatsapp': 'sent'
      });

      return !!existingNotification;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Clear notification cache (for testing)
   */
  clearCache(): void {
    this.notificationCache.clear();
    console.log('🧹 Notification cache cleared');
  }
}

export default new UnifiedMatchingService();
