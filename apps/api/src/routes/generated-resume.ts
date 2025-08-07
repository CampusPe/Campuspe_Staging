import express from 'express';
import axios from 'axios';
import authMiddleware from '../middleware/auth';
import GeneratedResumeService from '../services/generated-resume.service';
import { GeneratedResume } from '../models/GeneratedResume';

const router = express.Router();

/**
 * Debug endpoint to check database contents (no auth for testing)
 * GET /api/generated-resume/debug-db
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

/**
 * Get resume history for authenticated user
 * GET /api/generated-resume/history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const userId = (req as any).user._id;
    
    // Find student by userId
    const { Student } = require('../models');
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    const resumeHistory = await GeneratedResumeService.getStudentResumeHistory(
      student._id.toString(), 
      parseInt(limit as string)
    );
    
    // Get student stats
    const stats = await GeneratedResumeService.getStudentStats(student._id.toString());
    
    res.json({
      success: true,
      data: {
        resumes: resumeHistory,
        stats,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: resumeHistory.length
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching resume history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get specific resume details
 * GET /api/generated-resume/:resumeId
 */
router.get('/:resumeId', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = (req as any).user._id;
    
    // Find student by userId
    const { Student } = require('../models');
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    // Find resume and verify ownership
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
    
    res.json({
      success: true,
      data: resume
    });
    
  } catch (error: any) {
    console.error('Error fetching resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume',
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
    console.error('Error downloading resume:', error);
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
    console.error('Error downloading resume publicly:', error);
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
        message: result.message,
        error: result.error
      });
    }
    
  } catch (error: any) {
    console.error('Error sharing resume on WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share resume on WhatsApp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get resume analytics
 * GET /api/generated-resume/:resumeId/analytics
 */
router.get('/:resumeId/analytics', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = (req as any).user._id;
    
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
      studentId: student._id 
    }).lean();
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    const analytics = await GeneratedResumeService.getResumeAnalytics(resumeId);
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics not found'
      });
    }
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error: any) {
    console.error('Error fetching resume analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Delete resume
 * DELETE /api/generated-resume/:resumeId
 */
router.delete('/:resumeId', authMiddleware, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = (req as any).user._id;
    
    // Find student by userId
    const { Student } = require('../models');
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    // Find and verify ownership
    const resume = await GeneratedResume.findOne({ 
      resumeId, 
      studentId: student._id 
    });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    // Mark as expired instead of hard delete
    resume.status = 'expired';
    resume.pdfBase64 = undefined; // Remove base64 to save space
    await resume.save();
    
    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Search resumes
 * GET /api/generated-resume/search
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user._id;
    const { 
      jobTitle, 
      dateFrom, 
      dateTo, 
      minMatchScore, 
      generationType, 
      status = 'completed',
      limit = 20,
      page = 1 
    } = req.query;
    
    // Find student by userId
    const { Student } = require('../models');
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    const searchCriteria = {
      studentId: student._id.toString(),
      jobTitle: jobTitle as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      minMatchScore: minMatchScore ? parseInt(minMatchScore as string) : undefined,
      generationType: generationType as string,
      status: status as string,
      limit: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string)
    };
    
    const resumes = await GeneratedResumeService.searchResumes(searchCriteria);
    
    res.json({
      success: true,
      data: {
        resumes,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: resumes.length
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error searching resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search resumes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Admin: Cleanup expired resumes
 * POST /api/generated-resume/admin/cleanup
 */
router.post('/admin/cleanup', authMiddleware, async (req, res) => {
  try {
    // You can add admin role check here
    const result = await GeneratedResumeService.cleanupExpiredResumes();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: result
    });
    
  } catch (error: any) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired resumes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * WABB Webhook endpoint for sending resume documents
 * POST /api/generated-resume/wabb-send-document
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
    
    // Try to find by resumeId field first
    let resume = await GeneratedResume.findOne({ 
      resumeId,
      status: 'completed' 
    }).populate('studentId', 'name email').lean();
    
    console.log('📄 Resume found by resumeId field:', resume ? 'YES' : 'NO');
    
    // If not found by resumeId, try by MongoDB _id
    if (!resume) {
      console.log('🔍 Trying to find by _id field:', resumeId);
      try {
        resume = await GeneratedResume.findOne({ 
          _id: resumeId,
          status: 'completed' 
        }).populate('studentId', 'name email').lean();
        console.log('📄 Resume found by _id field:', resume ? 'YES' : 'NO');
      } catch (error) {
        console.log('❌ Error finding by _id:', (error as Error).message);
      }
    }
    
    // If still not found, try without status filter to see if it exists
    if (!resume) {
      console.log('🔍 Trying to find without status filter');
      try {
        const anyResume = await GeneratedResume.findOne({ 
          $or: [
            { resumeId },
            { _id: resumeId }
          ]
        }).lean();
        console.log('📄 Resume found without status filter:', anyResume ? 'YES' : 'NO');
        if (anyResume) {
          console.log('📄 Resume status:', anyResume.status);
        }
      } catch (error) {
        console.log('❌ Error in fallback search:', (error as Error).message);
      }
    }
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or not completed'
      });
    }
    
    console.log('📄 Resume details:', {
      fileName: resume.fileName,
      hasCloudUrl: !!resume.cloudUrl,
      hasFilePath: !!resume.filePath
    });
    
    // Determine the best download URL to use
    let documentUrl: string;
    
    // Priority: Cloud URL > Public API endpoint
    if (resume.cloudUrl) {
      documentUrl = resume.cloudUrl;
      console.log('☁️ Using direct cloud URL for WhatsApp:', documentUrl);
    } else {
      // Fallback to public API endpoint, but this should upload to cloud first
      console.log('⚠️ No cloud URL found, checking if file can be uploaded to cloud...');
      
      try {
        const fs = require('fs');
        if (resume.filePath && fs.existsSync(resume.filePath)) {
          console.log('📤 Uploading resume to cloud storage...');
          const bunnyService = require('../services/bunny-storage.service');
          const cloudUrl = await bunnyService.uploadPDF(resume.filePath, resume.fileName);
          
          // Update the resume with cloud URL
          await GeneratedResume.findByIdAndUpdate(resume._id, { cloudUrl });
          documentUrl = cloudUrl;
          console.log('✅ Successfully uploaded to cloud:', cloudUrl);
        } else {
          console.log('⚠️ Local file not found, using API endpoint fallback');
          documentUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
        }
      } catch (uploadError) {
        console.error('❌ Failed to upload to cloud:', uploadError);
        documentUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
        console.log('🔗 Using public API endpoint fallback:', documentUrl);
      }
    }
    
    // Clean phone number and format with country code
    let cleanPhone = number.replace(/[^\d]/g, '');
    
    // Add +91 country code if not present
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
      cleanPhone = '+91' + cleanPhone;
    } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = '+' + cleanPhone;
    } else if (!cleanPhone.startsWith('+91')) {
      cleanPhone = '+91' + cleanPhone;
    }
    
    console.log(`📞 Sending to phone: ${cleanPhone}`);
    console.log(`📄 Resume: ${resume.fileName}`);
    console.log(`🔗 Document URL: ${documentUrl}`);
    
    try {
      console.log('🚀 Sending to WABB webhook...');
      
      // Send via WABB webhook using axios with international phone format
      const webhookResponse = await axios.post('https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/', {
        number: cleanPhone,
        document: documentUrl
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✅ WABB webhook response:', webhookResponse.status, webhookResponse.statusText);
      
      if (webhookResponse.status === 200 || webhookResponse.status === 201) {
        // Update WhatsApp share tracking
        await GeneratedResume.findOneAndUpdate(
          { resumeId },
          {
            $inc: { whatsappSharedCount: 1 },
            $push: {
              whatsappRecipients: {
                phoneNumber: cleanPhone,
                sharedAt: new Date(),
                status: 'sent'
              }
            },
            $set: { lastSharedAt: new Date() }
          }
        );
        
        console.log('✅ Database updated with share tracking');
        
        res.json({
          success: true,
          message: 'Resume sent successfully via WhatsApp',
          data: {
            resumeId,
            phoneNumber: cleanPhone,
            documentUrl: documentUrl,
            fileName: resume.fileName,
            storageType: resume.cloudUrl ? 'cloud' : 'api'
          }
        });
      } else {
        throw new Error(`WABB webhook failed: ${webhookResponse.status} - ${webhookResponse.statusText}`);
      }
      
    } catch (webhookError) {
      console.error('❌ WABB webhook error:', webhookError);
      console.error('❌ Error details:', {
        message: webhookError instanceof Error ? webhookError.message : 'Unknown error',
        response: (webhookError as any).response?.data || 'No response data',
        status: (webhookError as any).response?.status || 'No status'
      });
      
      // Fallback: Update tracking with failed status
      await GeneratedResume.findOneAndUpdate(
        { resumeId },
        {
          $push: {
            whatsappRecipients: {
              phoneNumber: cleanPhone,
              sharedAt: new Date(),
              status: 'failed'
            }
          }
        }
      );
      
      res.status(500).json({
        success: false,
        message: 'Failed to send resume via WhatsApp webhook',
        error: webhookError instanceof Error ? webhookError.message : 'Unknown webhook error'
      });
    }
    
  } catch (error) {
    console.error('Error in WABB send document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process WhatsApp document request',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
});

/**
 * Test Bunny.net storage connection
 * GET /api/generated-resume/test-bunny-storage
 */
router.get('/test-bunny-storage', async (req, res) => {
  try {
    const BunnyStorageService = require('../services/bunny-storage.service').default;
    
    // Test connection
    const connectionTest = await BunnyStorageService.testConnection();
    
    // Get storage stats
    const storageStats = await BunnyStorageService.getStorageStats();
    
    res.json({
      success: true,
      message: 'Bunny.net storage test completed',
      data: {
        connection: connectionTest,
        configuration: {
          configured: BunnyStorageService.isConfigured(),
          ...storageStats
        }
      }
    });
    
  } catch (error) {
    console.error('Error testing Bunny.net storage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Bunny.net storage',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
});

/**
 * Migrate existing resumes to cloud storage
 * POST /api/generated-resume/migrate-to-cloud
 */
router.post('/migrate-to-cloud', async (req, res) => {
  try {
    console.log('🔄 Starting migration of existing resumes to cloud storage...');
    
    // Find resumes without cloud URLs
    const resumesToMigrate = await GeneratedResume.find({
      status: 'completed',
      cloudUrl: { $exists: false },
      filePath: { $exists: true }
    }).limit(10);
    
    console.log(`📊 Found ${resumesToMigrate.length} resumes to migrate`);
    
    const results = [];
    
    for (const resume of resumesToMigrate) {
      try {
        console.log(`🔄 Migrating resume: ${resume.fileName}`);
        
        // Check if local file exists
        const fs = require('fs');
        const path = require('path');
        
        if (!fs.existsSync(resume.filePath)) {
          console.log(`❌ Local file not found: ${resume.filePath}`);
          results.push({
            resumeId: resume.resumeId,
            status: 'error',
            message: 'Local file not found'
          });
          continue;
        }
        
        // Upload to Bunny.net
        const bunnyService = require('../services/bunny-storage.service');
        const cloudUrl = await bunnyService.uploadPDF(resume.filePath, resume.fileName);
        
        // Update resume with cloud URL
        await GeneratedResume.findByIdAndUpdate(resume._id, {
          cloudUrl,
          $push: {
            'metadata.migrations': {
              type: 'cloud_upload',
              timestamp: new Date(),
              cloudUrl
            }
          }
        });
        
        console.log(`✅ Successfully migrated: ${resume.fileName} -> ${cloudUrl}`);
        
        results.push({
          resumeId: resume.resumeId,
          fileName: resume.fileName,
          status: 'success',
          cloudUrl
        });
        
      } catch (error) {
        console.error(`❌ Error migrating ${resume.fileName}:`, error);
        results.push({
          resumeId: resume.resumeId,
          fileName: resume.fileName,
          status: 'error',
          message: (error as Error).message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Migration completed for ${results.filter(r => r.status === 'success').length} out of ${results.length} resumes`,
      data: {
        totalProcessed: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results
      }
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: (error as Error).message
    });
  }
});

/**
 * Upload resume base64 to cloud storage and update cloudUrl
 * POST /api/generated-resume/:resumeId/upload-to-cloud
 */
router.post('/:resumeId/upload-to-cloud', async (req, res) => {
  try {
    const { resumeId } = req.params;
    console.log('☁️ Upload to cloud request for resumeId:', resumeId);
    
    // Find resume
    const resume = await GeneratedResume.findOne({ resumeId }).lean();
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    if (resume.cloudUrl) {
      return res.json({
        success: true,
        message: 'Resume already in cloud storage',
        cloudUrl: resume.cloudUrl
      });
    }
    
    if (!resume.pdfBase64) {
      return res.status(400).json({
        success: false,
        message: 'No PDF data available for upload'
      });
    }
    
    try {
      console.log('📤 Uploading base64 PDF to cloud...');
      const bunnyService = require('../services/bunny-storage.service');
      
      // Convert base64 to buffer and upload
      const pdfBuffer = Buffer.from(resume.pdfBase64, 'base64');
      const uploadResult = await bunnyService.default.uploadPDF(pdfBuffer, resume.fileName, resume.resumeId);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      
      const cloudUrl = uploadResult.url;
      
      // Update resume with cloud URL
      await GeneratedResume.findOneAndUpdate(
        { resumeId },
        { 
          cloudUrl,
          $push: {
            'metadata.migrations': {
              type: 'base64_to_cloud',
              timestamp: new Date(),
              cloudUrl
            }
          }
        }
      );
      
      console.log('✅ Successfully uploaded to cloud:', cloudUrl);
      
      res.json({
        success: true,
        message: 'Resume uploaded to cloud storage successfully',
        cloudUrl
      });
      
    } catch (uploadError) {
      console.error('❌ Failed to upload to cloud:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Failed to upload to cloud storage',
        error: (uploadError as Error).message
      });
    }
    
  } catch (error) {
    console.error('❌ Upload to cloud error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload to cloud failed',
      error: (error as Error).message
    });
  }
});

/**
 * Send resume to student's WhatsApp automatically
 * POST /api/generated-resume/:resumeId/send-whatsapp
 */
router.post('/:resumeId/send-whatsapp', async (req, res) => {
  try {
    const { resumeId } = req.params;
    console.log('📱 Auto WhatsApp Send Request for resumeId:', resumeId);
    
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required'
      });
    }
    
    console.log('🔍 Looking for resume:', resumeId);
    
    // Find resume and populate student data
    const resume = await GeneratedResume.findOne({ 
      resumeId,
      status: 'completed' 
    }).populate('studentId').lean();
    
    console.log('📄 Resume found:', resume ? 'YES' : 'NO');
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or not completed'
      });
    }
    
    // Get student's phone number
    const { Student } = require('../models');
    const student = await Student.findById(resume.studentId).lean();
    
    console.log('👤 Student data:', {
      id: student?._id,
      name: student?.name,
      phoneNumber: student?.phoneNumber,
      phone: student?.resumeAnalysis?.extractedDetails?.contactInfo?.phone
    });
    
    // Check multiple possible phone field locations
    const studentPhone = student?.phoneNumber || student?.resumeAnalysis?.extractedDetails?.contactInfo?.phone;
    
    if (!student || !studentPhone) {
      return res.status(400).json({
        success: false,
        message: 'Student phone number not found'
      });
    }
    
    console.log('📞 Student phone found:', studentPhone);
    
    // Use the exact same logic as the working wabb-send-document endpoint
    // Determine the best download URL to use
    let documentUrl: string;
    
    // Priority: Cloud URL > Public API endpoint
    if (resume.cloudUrl) {
      documentUrl = resume.cloudUrl;
      console.log('☁️ Using direct cloud URL for WhatsApp:', documentUrl);
    } else {
      // Fallback to public API endpoint, but this should upload to cloud first
      console.log('⚠️ No cloud URL found, checking if file can be uploaded to cloud...');
      
      try {
        const fs = require('fs');
        if (resume.filePath && fs.existsSync(resume.filePath)) {
          console.log('📤 Uploading resume to cloud storage...');
          const bunnyService = require('../services/bunny-storage.service');
          const cloudUrl = await bunnyService.uploadPDF(resume.filePath, resume.fileName);
          
          // Update the resume with cloud URL
          await GeneratedResume.findByIdAndUpdate(resume._id, { cloudUrl });
          documentUrl = cloudUrl;
          console.log('✅ Successfully uploaded to cloud:', cloudUrl);
        } else {
          console.log('⚠️ Local file not found, using API endpoint fallback');
          documentUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
        }
      } catch (uploadError) {
        console.error('❌ Failed to upload to cloud:', uploadError);
        documentUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
        console.log('🔗 Using public API endpoint fallback:', documentUrl);
      }
    }
    
    // Clean phone number and format with country code
    let cleanPhone = studentPhone.replace(/[^\d]/g, '');
    
    // Add +91 country code if not present
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
      cleanPhone = '+91' + cleanPhone;
    } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = '+' + cleanPhone;
    } else if (!cleanPhone.startsWith('+91')) {
      cleanPhone = '+91' + cleanPhone;
    }
    
    console.log(`📞 Sending to phone: ${cleanPhone}`);
    console.log(`📄 Resume: ${resume.fileName}`);
    console.log(`🔗 Document URL: ${documentUrl}`);
    
    try {
      console.log('🚀 Sending to WABB webhook...');
      
      // Send via WABB webhook using axios with proper international format
      const webhookResponse = await axios.post('https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/', {
        number: cleanPhone,
        document: documentUrl
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✅ WABB webhook response:', webhookResponse.status, webhookResponse.statusText);
      
      if (webhookResponse.status === 200 || webhookResponse.status === 201) {
        // Update WhatsApp share tracking
        await GeneratedResume.findOneAndUpdate(
          { resumeId },
          {
            $inc: { whatsappSharedCount: 1 },
            $push: {
              whatsappRecipients: {
                phoneNumber: cleanPhone,
                sharedAt: new Date(),
                status: 'sent'
              }
            },
            $set: { lastSharedAt: new Date() }
          }
        );
        
        console.log('✅ Database updated with share tracking');
        
        res.json({
          success: true,
          message: 'Resume sent successfully via WhatsApp',
          data: {
            resumeId,
            phoneNumber: cleanPhone,
            documentUrl: documentUrl,
            fileName: resume.fileName,
            studentName: student.name || 'Unknown',
            storageType: resume.cloudUrl ? 'cloud' : 'api'
          }
        });
      } else {
        throw new Error(`WABB webhook failed: ${webhookResponse.status} - ${webhookResponse.statusText}`);
      }
      
    } catch (webhookError) {
      console.error('❌ WABB webhook error:', webhookError);
      console.error('❌ Error details:', {
        message: webhookError instanceof Error ? webhookError.message : 'Unknown error',
        response: (webhookError as any).response?.data || 'No response data',
        status: (webhookError as any).response?.status || 'No status'
      });
      
      // Update tracking with failed status
      await GeneratedResume.findOneAndUpdate(
        { resumeId },
        {
          $push: {
            whatsappRecipients: {
              phoneNumber: cleanPhone,
              sharedAt: new Date(),
              status: 'failed'
            }
          }
        }
      );
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send resume via WhatsApp webhook',
        error: webhookError instanceof Error ? webhookError.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Error in auto WhatsApp send:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process WhatsApp send request',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
});

export default router;
// Force restart
