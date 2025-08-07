import { GeneratedResume, IGeneratedResume } from '../models/GeneratedResume';
import { Student } from '../models/Student';
import { Types } from 'mongoose';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import BunnyStorageService from './bunny-storage.service';

export interface CreateGeneratedResumeData {
  studentId: string;
  jobTitle?: string;
  jobDescription: string;
  resumeData: any;
  fileName: string;
  pdfBuffer: Buffer;
  matchScore?: number;
  aiEnhancementUsed?: boolean;
  matchedSkills?: string[];
  missingSkills?: string[];
  suggestions?: string[];
  generationType?: 'ai' | 'manual' | 'template';
}

export interface WhatsAppShareResult {
  success: boolean;
  message: string;
  resumeId?: string;
  downloadUrl?: string;
  error?: string;
}

class GeneratedResumeService {
  
  /**
   * Create and store a new generated resume
   */
  async createGeneratedResume(data: CreateGeneratedResumeData): Promise<IGeneratedResume> {
    try {
      console.log('📝 Creating new generated resume for student:', data.studentId);
      
      // Generate unique resume ID
      const resumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate job description hash for duplicate detection
      const jobDescriptionHash = crypto
        .createHash('md5')
        .update(data.jobDescription.toLowerCase().trim())
        .digest('hex');
      
      // Check for similar recent resume (within last 7 days)
      const existingResume = await GeneratedResume.findSimilarResume(
        data.studentId, 
        jobDescriptionHash
      );
      
      if (existingResume) {
        console.log('🔄 Found similar resume generated recently:', existingResume.resumeId);
      }
      
      // Upload PDF to Bunny.net cloud storage
      let cloudUrl: string | undefined;
      let filePath: string | undefined;
      
      console.log('☁️ Uploading PDF to Bunny.net cloud storage...');
      
      const uploadResult = await BunnyStorageService.uploadPDF(
        data.pdfBuffer, 
        data.fileName, 
        resumeId
      );
      
      if (uploadResult.success && uploadResult.url) {
        cloudUrl = uploadResult.url;
        console.log('✅ PDF uploaded to cloud:', cloudUrl);
      } else {
        console.warn('⚠️ Cloud upload failed, falling back to local storage:', uploadResult.error);
        
        // Fallback to local storage if cloud upload fails
        const uploadsDir = path.join(__dirname, '../../uploads/generated-resumes');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        filePath = path.join(uploadsDir, `${resumeId}.pdf`);
        fs.writeFileSync(filePath, data.pdfBuffer);
        console.log('💾 PDF saved locally as fallback:', filePath);
      }
      
      // Convert PDF to base64 for quick access (optional, only for small files)
      const pdfBase64 = data.pdfBuffer.length < 1024 * 1024 ? data.pdfBuffer.toString('base64') : undefined;
      
      // Create new generated resume document
      const generatedResume = new GeneratedResume({
        studentId: new Types.ObjectId(data.studentId),
        resumeId,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        jobDescriptionHash,
        resumeData: data.resumeData,
        fileName: data.fileName,
        filePath,
        cloudUrl, // Primary storage URL (Bunny.net)
        fileSize: data.pdfBuffer.length,
        mimeType: 'application/pdf',
        pdfBase64, // Only store base64 for small files
        matchScore: data.matchScore,
        aiEnhancementUsed: data.aiEnhancementUsed || false,
        matchedSkills: data.matchedSkills || [],
        missingSkills: data.missingSkills || [],
        suggestions: data.suggestions || [],
        status: 'completed',
        generationType: data.generationType || 'ai',
        downloadCount: 0,
        whatsappSharedCount: 0,
        whatsappSharedAt: [],
        whatsappRecipients: [],
        generatedAt: new Date()
      });
      
      const savedResume = await generatedResume.save();
      console.log('✅ Generated resume saved successfully:', savedResume.resumeId);
      
      // Update student's resume history for backward compatibility
      await this.updateStudentResumeHistory(data.studentId, savedResume);
      
      return savedResume;
      
    } catch (error) {
      console.error('❌ Error creating generated resume:', error);
      throw error;
    }
  }
  
  /**
   * Get resume by ID
   */
  async getResumeById(resumeId: string): Promise<IGeneratedResume | null> {
    try {
      return await GeneratedResume.findOne({ resumeId, status: 'completed' }).lean();
    } catch (error) {
      console.error('❌ Error fetching resume by ID:', error);
      return null;
    }
  }
  
  /**
   * Get student's resume history
   */
  async getStudentResumeHistory(studentId: string, limit = 10): Promise<IGeneratedResume[]> {
    try {
      return await GeneratedResume.findByStudentId(studentId, limit);
    } catch (error) {
      console.error('❌ Error fetching student resume history:', error);
      return [];
    }
  }
  
  /**
   * Download resume and track analytics
   */
  async downloadResume(resumeId: string): Promise<{ success: boolean; pdfBuffer?: Buffer; fileName?: string; error?: string }> {
    try {
      const resume = await GeneratedResume.findOne({ resumeId, status: 'completed' });
      
      if (!resume) {
        return { success: false, error: 'Resume not found' };
      }
      
      // Try to get PDF from different sources (priority order)
      let pdfBuffer: Buffer | undefined;
      
      // 1. Try base64 cache first (fastest)
      if (resume.pdfBase64) {
        console.log('📄 Serving PDF from base64 cache');
        pdfBuffer = Buffer.from(resume.pdfBase64, 'base64');
      }
      // 2. Try cloud storage URL
      else if (resume.cloudUrl) {
        console.log('☁️ Downloading PDF from cloud storage:', resume.cloudUrl);
        try {
          const axios = require('axios');
          const response = await axios.get(resume.cloudUrl, { responseType: 'arraybuffer' });
          pdfBuffer = Buffer.from(response.data);
        } catch (cloudError) {
          console.warn('⚠️ Cloud download failed, trying local fallback:', cloudError instanceof Error ? cloudError.message : 'Unknown error');
          // Fall through to local file attempt
        }
      }
      
      // 3. Try local file fallback
      if (!pdfBuffer && resume.filePath && fs.existsSync(resume.filePath)) {
        console.log('💾 Serving PDF from local storage');
        pdfBuffer = fs.readFileSync(resume.filePath);
      }
      
      if (!pdfBuffer) {
        return { success: false, error: 'Resume file not accessible from any source' };
      }
      
      // Update download analytics
      await resume.markAsDownloaded();
      
      return {
        success: true,
        pdfBuffer,
        fileName: resume.fileName
      };
      
    } catch (error) {
      console.error('❌ Error downloading resume:', error);
      return { success: false, error: 'Failed to download resume' };
    }
  }
  
  /**
   * Share resume on WhatsApp
   */
  async shareResumeOnWhatsApp(resumeId: string, phoneNumber: string): Promise<WhatsAppShareResult> {
    try {
      const resume = await GeneratedResume.findOne({ resumeId, status: 'completed' });
      
      if (!resume) {
        return { success: false, message: 'Resume not found' };
      }
      
      // Generate public download URL
      const downloadUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
      
      // Mark as shared on WhatsApp
      await resume.markAsSharedOnWhatsApp(phoneNumber);
      
      // Send to WhatsApp using your existing service
      const { sendWhatsAppMessage } = require('./whatsapp');
      
      const message = `🎉 *Your Resume is Ready!*\n\n📄 *File:* ${resume.fileName}\n📅 *Generated:* ${resume.generatedAt.toLocaleDateString()}\n🎯 *Job Match Score:* ${resume.matchScore || 'N/A'}%\n\n📥 *Download:* ${downloadUrl}\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
      
      const whatsappResult = await sendWhatsAppMessage(phoneNumber, message);
      
      if (whatsappResult.success) {
        return {
          success: true,
          message: 'Resume shared successfully on WhatsApp',
          resumeId,
          downloadUrl
        };
      } else {
        return {
          success: false,
          message: `Failed to send WhatsApp message: ${whatsappResult.message}`,
          error: whatsappResult.message
        };
      }
      
    } catch (error) {
      console.error('❌ Error sharing resume on WhatsApp:', error);
      return {
        success: false,
        message: 'Failed to share resume on WhatsApp',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get student statistics
   */
  async getStudentStats(studentId: string): Promise<any> {
    try {
      const stats = await GeneratedResume.getStudentStats(studentId);
      return stats[0] || {
        totalResumes: 0,
        totalDownloads: 0,
        totalWhatsAppShares: 0,
        avgMatchScore: 0,
        lastGenerated: null
      };
    } catch (error) {
      console.error('❌ Error fetching student stats:', error);
      return null;
    }
  }
  
  /**
   * Cleanup expired resumes
   */
  async cleanupExpiredResumes(): Promise<{ deleted: number; errors: number }> {
    try {
      console.log('🧹 Starting cleanup of expired resumes...');
      
      const expiredResumes = await GeneratedResume.find({
        expiresAt: { $lte: new Date() },
        status: { $ne: 'expired' }
      }).lean();
      
      let deleted = 0;
      let errors = 0;
      
      for (const resume of expiredResumes) {
        try {
          // Delete physical file
          if (resume.filePath && fs.existsSync(resume.filePath)) {
            fs.unlinkSync(resume.filePath);
          }
          
          // Mark as expired instead of deleting (for analytics)
          await GeneratedResume.findByIdAndUpdate(resume._id, {
            status: 'expired',
            pdfBase64: undefined, // Remove base64 to save space
            filePath: undefined
          });
          
          deleted++;
        } catch (error) {
          console.error(`❌ Error cleaning up resume ${resume.resumeId}:`, error);
          errors++;
        }
      }
      
      console.log(`✅ Cleanup completed: ${deleted} expired, ${errors} errors`);
      return { deleted, errors };
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return { deleted: 0, errors: 1 };
    }
  }
  
  /**
   * Update student's aiResumeHistory for backward compatibility
   */
  private async updateStudentResumeHistory(studentId: string, generatedResume: IGeneratedResume): Promise<void> {
    try {
      const student = await Student.findById(studentId);
      if (!student) return;
      
      const historyItem = {
        id: generatedResume.resumeId,
        jobDescription: generatedResume.jobDescription.substring(0, 500),
        jobTitle: generatedResume.jobTitle,
        resumeData: generatedResume.resumeData,
        pdfUrl: `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${generatedResume.resumeId}`,
        generatedAt: generatedResume.generatedAt,
        matchScore: generatedResume.matchScore
      };
      
      // Initialize aiResumeHistory if it doesn't exist
      if (!student.aiResumeHistory) {
        student.aiResumeHistory = [];
      }
      
      // Add new resume to history
      student.aiResumeHistory.push(historyItem);
      
      // Keep only last 5 resumes
      if (student.aiResumeHistory.length > 5) {
        student.aiResumeHistory = student.aiResumeHistory.slice(-5);
      }
      
      await student.save();
      console.log('✅ Updated student resume history for backward compatibility');
      
    } catch (error) {
      console.error('❌ Error updating student resume history:', error);
      // Don't throw error as this is for backward compatibility
    }
  }
  
  /**
   * Search resumes by criteria
   */
  async searchResumes(criteria: {
    studentId?: string;
    jobTitle?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minMatchScore?: number;
    generationType?: string;
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<IGeneratedResume[]> {
    try {
      const query: any = {};
      
      if (criteria.studentId) query.studentId = new Types.ObjectId(criteria.studentId);
      if (criteria.jobTitle) query.jobTitle = new RegExp(criteria.jobTitle, 'i');
      if (criteria.dateFrom || criteria.dateTo) {
        query.generatedAt = {};
        if (criteria.dateFrom) query.generatedAt.$gte = criteria.dateFrom;
        if (criteria.dateTo) query.generatedAt.$lte = criteria.dateTo;
      }
      if (criteria.minMatchScore) query.matchScore = { $gte: criteria.minMatchScore };
      if (criteria.generationType) query.generationType = criteria.generationType;
      if (criteria.status) query.status = criteria.status;
      
      return await GeneratedResume.find(query)
        .sort({ generatedAt: -1 })
        .limit(criteria.limit || 20)
        .skip(criteria.skip || 0)
        .lean();
        
    } catch (error) {
      console.error('❌ Error searching resumes:', error);
      return [];
    }
  }
  
  /**
   * Get resume analytics
   */
  async getResumeAnalytics(resumeId: string): Promise<any> {
    try {
      const resume = await GeneratedResume.findOne({ resumeId }).lean();
      if (!resume) return null;
      
      return {
        resumeId: resume.resumeId,
        studentId: resume.studentId,
        jobTitle: resume.jobTitle,
        generatedAt: resume.generatedAt,
        downloadCount: resume.downloadCount,
        whatsappSharedCount: resume.whatsappSharedCount,
        matchScore: resume.matchScore,
        status: resume.status,
        fileSize: resume.fileSize,
        whatsappRecipients: resume.whatsappRecipients?.length || 0,
        lastDownloaded: resume.lastDownloadedAt,
        lastShared: resume.lastSharedAt
      };
    } catch (error) {
      console.error('❌ Error getting resume analytics:', error);
      return null;
    }
  }
}

export default new GeneratedResumeService();
