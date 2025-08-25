import express from 'express';
import authMiddleware from '../middleware/auth';
import GeneratedResumeService from '../services/generated-resume.service';
import { GeneratedResume } from '../models/GeneratedResume';

const router = express.Router();

/**
 * Get resume history for authenticated user - Enhanced version
 * GET /api/generated-resume/history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const userId = (req as any).user._id;
    
    console.log('📋 Fetching resume history for user:', userId);
    
    // Find student by userId
    const { Student } = require('../models');
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      console.log('❌ Student profile not found for user:', userId);
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    console.log('✅ Student found:', student._id);
    
    try {
      // Get resume history from GeneratedResume collection (primary source)
      const resumeHistory = await GeneratedResumeService.getStudentResumeHistory(
        student._id.toString(), 
        parseInt(limit as string)
      );
      
      console.log(`📊 Found ${resumeHistory.length} resumes in GeneratedResume collection`);
      
      // Get student stats
      const stats = await GeneratedResumeService.getStudentStats(student._id.toString());
      
      console.log('📈 Student stats from GeneratedResume:', stats);
      
      // If GeneratedResume collection is empty, fallback to Student.aiResumeHistory
      let fallbackData = [];
      if (resumeHistory.length === 0) {
        console.log('🔄 GeneratedResume collection empty, checking Student.aiResumeHistory...');
        
        const studentWithHistory = await Student.findById(student._id, 'aiResumeHistory').lean();
        if (studentWithHistory?.aiResumeHistory?.length > 0) {
          console.log(`📚 Found ${studentWithHistory.aiResumeHistory.length} resumes in Student.aiResumeHistory`);
          
          // Convert Student.aiResumeHistory format to GeneratedResume format for compatibility
          fallbackData = studentWithHistory.aiResumeHistory
            .sort((a: any, b: any) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
          .slice(0, 10)
          .map((item: any) => ({
              resumeId: item.id,
              jobTitle: item.jobTitle,
              jobDescription: item.jobDescription,
              resumeData: item.resumeData,
              cloudUrl: item.pdfUrl,
              matchScore: item.matchScore,
              generatedAt: item.generatedAt,
              status: 'completed',
              downloadCount: 0,
              whatsappSharedCount: 0,
              fileName: `${item.id}.pdf`,
              fileSize: 0,
              mimeType: 'application/pdf'
            }));
        }
      }
      
      const finalResumeData = resumeHistory.length > 0 ? resumeHistory : fallbackData;
      
      res.json({
        success: true,
        data: {
          resumes: finalResumeData,
          stats: stats || {
            totalResumes: finalResumeData.length,
            totalDownloads: 0,
            totalWhatsAppShares: 0,
            avgMatchScore: fallbackData.length > 0 ? 
              fallbackData.reduce((sum: any, r: any) => sum + (r.matchScore || 0), 0) / fallbackData.length : 0,
            lastGenerated: finalResumeData.length > 0 ? finalResumeData[0].generatedAt : null
          },
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: finalResumeData.length
          },
          source: resumeHistory.length > 0 ? 'GeneratedResume' : 'Student.aiResumeHistory'
        }
      });
      
    } catch (serviceError) {
      console.error('❌ GeneratedResumeService error:', serviceError);
      
      // Fallback to Student.aiResumeHistory if service fails
      console.log('🔄 Falling back to Student.aiResumeHistory due to service error...');
      
      const studentWithHistory = await Student.findById(student._id, 'aiResumeHistory').lean();
      const aiResumeHistory = studentWithHistory?.aiResumeHistory || [];
      
      const fallbackData = aiResumeHistory
        .sort((a: any, b: any) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
        .slice(0, parseInt(limit as string))
        .map((item: any) => ({
          resumeId: item.id,
          jobTitle: item.jobTitle,
          jobDescription: item.jobDescription,
          resumeData: item.resumeData,
          cloudUrl: item.pdfUrl,
          matchScore: item.matchScore,
          generatedAt: item.generatedAt,
          status: 'completed',
          downloadCount: 0,
          whatsappSharedCount: 0,
          fileName: `${item.id}.pdf`,
          fileSize: 0,
          mimeType: 'application/pdf'
        }));
      
      res.json({
        success: true,
        data: {
          resumes: fallbackData,
          stats: {
            totalResumes: fallbackData.length,
            totalDownloads: 0,
            totalWhatsAppShares: 0,
            avgMatchScore: fallbackData.length > 0 ? 
              fallbackData.reduce((sum: any, r: any) => sum + (r.matchScore || 0), 0) / fallbackData.length : 0,
            lastGenerated: fallbackData.length > 0 ? fallbackData[0].generatedAt : null
          },
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: fallbackData.length
          },
          source: 'Student.aiResumeHistory (fallback)'
        }
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error fetching resume history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Download resume PDF
 * GET /api/generated-resume/:resumeId/download
 */
router.get('/:resumeId/download', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = (req as any).user._id;
    
    console.log('📥 Download request for resume:', resumeId, 'by user:', userId);
    
    // Find student by userId
    const { Student } = require('../models');
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    // Verify ownership
    const resume = await GeneratedResume.findOne({ 
      resumeId, 
      studentId: student._id,
      status: 'completed' 
    }).lean();
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    const result = await GeneratedResumeService.downloadResume(resumeId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.pdfBuffer);
    
  } catch (error: any) {
    console.error('❌ Error downloading resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download resume',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Public download link (for WhatsApp sharing)
 * GET /api/generated-resume/download-public/:resumeId
 */
router.get('/download-public/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    console.log('🔗 Public download request for resume:', resumeId);
    
    const result = await GeneratedResumeService.downloadResume(resumeId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${result.fileName}"`);
    res.send(result.pdfBuffer);
    
  } catch (error: any) {
    console.error('❌ Error downloading resume publicly:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download resume',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Share resume on WhatsApp
 * POST /api/generated-resume/:resumeId/share-whatsapp
 */
router.post('/:resumeId/share-whatsapp', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { phoneNumber } = req.body;
    const userId = (req as any).user._id;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    console.log('📱 WhatsApp share request for resume:', resumeId, 'to:', phoneNumber);
    
    // Find student by userId
    const { Student } = require('../models');
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    // Verify ownership
    const resume = await GeneratedResume.findOne({ 
      resumeId, 
      studentId: student._id,
      status: 'completed' 
    }).lean();
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    const result = await GeneratedResumeService.shareResumeOnWhatsApp(resumeId, phoneNumber);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          resumeId: result.resumeId,
          downloadUrl: result.downloadUrl
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error sharing resume on WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share resume on WhatsApp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * WABB Send Document endpoint for WhatsApp integration
 */
router.post('/wabb-send-document', async (req, res) => {
  try {
    console.log('📱 WABB Send Document Request:', req.body);
    const { resumeId, number } = req.body;
    
    if (!resumeId || !number) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID and phone number are required',
        required: ['resumeId', 'number']
      });
    }
    
    console.log('🔍 Looking for resume:', resumeId);
    
    // Find resume by resumeId
    let resume = await GeneratedResume.findOne({
      resumeId,
      status: 'completed'
    }).populate('studentId', 'name email').lean();
    
    console.log('📄 Resume found by resumeId field:', resume ? 'YES' : 'NO');
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or not completed'
      });
    }
    
    // Generate public download URL
    const downloadUrl = `${process.env.API_BASE_URL || 'https://campuspe-api-staging.azurewebsites.net'}/api/generated-resume/download-public/${resumeId}`;
    
    // Send to WhatsApp using WABB service
    const { sendWhatsAppMessage } = require('../services/whatsapp');
    
    const message = `🎉 *Your Resume is Ready!*\n\n📄 *File:* ${resume.fileName}\n📅 *Generated:* ${new Date(resume.generatedAt).toLocaleDateString()}\n🎯 *Job Match Score:* ${resume.matchScore || 'N/A'}%\n\n📥 *Download:* ${downloadUrl}\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
    
    const whatsappResult = await sendWhatsAppMessage(number, message);
    
    if (whatsappResult.success) {
      // Mark as shared
      await resume.markAsSharedOnWhatsApp(number);
      
      res.json({
        success: true,
        message: 'Resume shared successfully on WhatsApp',
        data: {
          resumeId,
          downloadUrl,
          whatsappResult
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to send WhatsApp message: ${whatsappResult.message}`
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error in WABB send document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send document via WhatsApp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Debug endpoint to check database contents (no auth for testing)
 */
router.get('/debug-db', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking database contents');
    
    // Get total count
    const totalCount = await GeneratedResume.countDocuments();
    console.log('📊 Total GeneratedResume documents:', totalCount);
    
    // Get all resumes with minimal data
    const allResumes = await GeneratedResume.find({}, {
      _id: 1,
      resumeId: 1,
      status: 1,
      fileName: 1,
      createdAt: 1
    }).limit(10).lean();
    
    console.log('📄 Sample resumes:', allResumes);
    
    // Get status distribution
    const statusCounts = await GeneratedResume.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📊 Status distribution:', statusCounts);
    
    res.json({
      success: true,
      data: {
        totalCount,
        sampleResumes: allResumes,
        statusDistribution: statusCounts
      }
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug query failed',
      error: (error as Error).message
    });
  }
});

export default router;
