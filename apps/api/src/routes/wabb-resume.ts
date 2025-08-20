import express from 'express';
import axios from 'axios';
import ResumeBuilderService from '../services/resume-builder';
import { sendWhatsAppMessage } from '../services/whatsapp';
import mockWhatsApp from '../services/mock-whatsapp';

// Helper function to send WhatsApp messages with fallback to mock service
async function sendWhatsAppWithFallback(phone: string, message: string, serviceType: 'otp' | 'jobs' | 'resume' | 'general' = 'general') {
  const hasWabbConfig = process.env.WABB_API_KEY || process.env.WABB_WEBHOOK_URL;
  
  if (!hasWabbConfig) {
    console.log('⚠️ WABB not configured, using mock WhatsApp service');
    return await mockWhatsApp.sendMessage(phone, message, serviceType);
  }
  
  try {
    return await sendWhatsAppMessage(phone, message, serviceType);
  } catch (error) {
    console.log('⚠️ WABB service failed, falling back to mock service:', error);
    return await mockWhatsApp.sendMessage(phone, message, serviceType);
  }
}

const router = express.Router();

/**
 * Debug endpoint to check user existence
 */
router.get('/debug-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { Student } = require('../models/Student');
    const { User } = require('../models/User');
    
    console.log(`🔍 Debugging user lookup for: ${email}`);
    
    // Check students collection
    const student = await Student.findOne({ email: email }).populate('userId');
    console.log('Student found:', !!student);
    
    // Check users collection  
    const user = await User.findOne({ email: email });
    console.log('User found:', !!user);
    
    res.json({
      email,
      studentExists: !!student,
      userExists: !!user,
      studentData: student ? {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        skills: student.skills?.length || 0,
        experience: student.experience?.length || 0
      } : null,
      userData: user ? {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.firstName + ' ' + user.lastName
      } : null
    });
    
  } catch (error: any) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

/**
 * WABB endpoint for WhatsApp resume generation
 * POST /api/wabb/create-resume
 * 
 * This endpoint receives email, phone, and job description from WhatsApp
 * and generates a tailored resume for the user
 */
router.post('/create-resume', async (req, res) => {
  try {
    console.log('🚀 WABB Resume Creation Request:', req.body);
    
    const { email, phone, jobDescription, name } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    // Clean phone number (remove any formatting)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    console.log(`📱 Processing resume request for ${email} (${cleanPhone})`);
    
    // Send acknowledgment message to WhatsApp
    await sendWhatsAppMessage(
      cleanPhone,
      `🎯 *Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a tailored resume for you based on the job description you provided.\n\n⏳ This will take 30-60 seconds...\n\n🔍 *What I'm doing:*\n• Analyzing the job requirements\n• Fetching your profile from CampusPe\n• Tailoring your resume to match\n• Generating PDF document\n\nI'll send you the resume shortly! 📄✨`,
      'resume'
    );
    
    // Generate tailored resume
    const result = await ResumeBuilderService.createTailoredResume(
      email,
      cleanPhone,
      jobDescription
    );
    
    if (!result.success) {
      console.error('❌ Resume generation failed:', result.message);
      
      // Send error message to WhatsApp
      await sendWhatsAppMessage(
        cleanPhone,
        `❌ *Resume Generation Failed*\n\n${result.message}\n\n💡 *Possible reasons:*\n• Profile not found on CampusPe\n• Incomplete profile information\n• Technical error\n\n🔗 Please visit CampusPe.com to:\n• Create/update your profile\n• Upload your resume\n• Add your skills and experience\n\nThen try again! 😊`
      );
      
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    console.log('✅ Resume generated successfully');
    
    // Convert PDF buffer to base64 for transmission
    const pdfBase64 = result.pdfBuffer!.toString('base64');
    
    // Send success message with resume to WhatsApp
    await sendWhatsAppMessage(
      cleanPhone,
      `🎉 *Resume Generated Successfully!*\n\nYour tailored resume is ready! 📄✨\n\n🎯 *Customized for:*\n• Job requirements analysis\n• Your skills & experience\n• Professional formatting\n\n📩 *Resume details:*\n• File: ${result.fileName}\n• Tailored: ${new Date().toLocaleDateString()}\n• Size: ${Math.round(result.pdfBuffer!.length / 1024)}KB\n\n� *Download Link:*\n${result.downloadUrl || 'Available on CampusPe.com'}\n\n�💼 Good luck with your application!\n\n🔗 Update your profile: CampusPe.com`
    );
    
    // Return success response with PDF data
    res.json({
      success: true,
      message: 'Resume generated and sent via WhatsApp',
      fileName: result.fileName,
      fileSize: result.pdfBuffer!.length,
      resumeId: result.resumeId,
      downloadUrl: result.downloadUrl,
      metadata: {
        generatedAt: new Date().toISOString(),
        email,
        phone: cleanPhone,
        jobDescriptionLength: jobDescription.length
      }
    });
    
  } catch (error) {
    console.error('❌ WABB Resume Creation Error:', error);
    
    // Try to send error message to WhatsApp if phone is available
    if (req.body.phone) {
      const cleanPhone = req.body.phone.replace(/[^\d]/g, '');
      await sendWhatsAppMessage(
        cleanPhone,
        `❌ *Technical Error*\n\nSorry, I encountered an error while generating your resume.\n\n🔧 Our team has been notified and will fix this shortly.\n\n💡 You can try again in a few minutes or visit CampusPe.com to generate your resume manually.\n\nApologies for the inconvenience! 🙏`
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during resume generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * WABB endpoint for automatic resume generation and WhatsApp sharing
 * POST /api/wabb/generate-and-share
 * 
 * This endpoint receives user information and job description from external platforms,
 * generates a tailored resume, and automatically shares it via WhatsApp
 */
router.post('/generate-and-share', async (req, res) => {
  try {
    console.log('🚀 WABB Auto-Generate & Share Request:', req.body);
    
    const { email, phone, name, jobDescription } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    // Clean phone number (remove any formatting)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    console.log(`📱 Auto-processing resume request for ${email} (${cleanPhone})`);
    
    // Send initial acknowledgment message to WhatsApp
    await sendWhatsAppWithFallback(
      cleanPhone,
      `🎯 *AI Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a personalized resume for you.\n\n⏳ This will take 30-60 seconds...\n\n🔍 *Processing:*\n• Analyzing job requirements\n• Fetching your CampusPe profile\n• AI-powered resume tailoring\n• Generating professional PDF\n\nYour resume will be ready shortly! 📄✨`,
      'resume'
    );
    
    // Generate tailored resume using the same service as manual generation
    const result = await ResumeBuilderService.createTailoredResume(
      email,
      cleanPhone,
      jobDescription
    );
    
    if (!result.success) {
      console.error('❌ Auto resume generation failed:', result.message);
      
      // Send registration message via WABB webhook for user not found
      if (result.message.includes('Student profile not found')) {
        console.log('📱 Sending registration message via WABB webhook...');
        
        try {
          const wabbWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
          const wabbPayload = {
            number: cleanPhone,
            message: "User not found"
          };
          
          console.log('Sending to WABB webhook:', wabbWebhookUrl);
          console.log('Payload:', wabbPayload);
          
          const wabbResponse = await axios.post(wabbWebhookUrl, wabbPayload, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000
          });
          
          console.log('✅ WABB webhook response:', wabbResponse.status);
        } catch (wabbError: any) {
          console.error('❌ Failed to send WABB webhook:', wabbError?.message || 'Unknown error');
        }
      } else {
        // For other errors (like PDF generation failures), send generic error message
        console.log('📱 Sending WhatsApp failure notification to:', cleanPhone);
        try {
          await sendWhatsAppWithFallback(
            cleanPhone,
            `❌ *Resume Generation Failed*\n\n${result.message}\n\n💡 *Possible solutions:*\n• Complete your profile information\n• Upload your current resume\n• Try again in a few minutes\n\n🔗 Visit: CampusPe.com\n\nNeed help? Reply to this message! 😊`,
            'resume'
          );
          console.log('✅ WhatsApp failure notification sent successfully');
        } catch (whatsappError: any) {
          console.error('❌ Failed to send WhatsApp failure notification:', whatsappError?.message);
        }
      }
      
      return res.status(400).json({
        success: false,
        message: result.message,
        code: 'GENERATION_FAILED'
      });
    }
    
    console.log('✅ Auto resume generated successfully, sharing via WhatsApp...');
    
    // Automatically share the resume via WhatsApp (no manual input needed)
    try {
      const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5001';
      
      const shareResponse = await axios.post(`${apiBaseUrl}/api/generated-resume/wabb-send-document`, {
        resumeId: result.resumeId,
        number: cleanPhone
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000 // 15 second timeout
      });

      const shareResult = shareResponse.data;
      
      if (shareResult.success) {
        console.log('✅ Resume automatically shared via WhatsApp');
        
        // Send final success message
        await sendWhatsAppWithFallback(
          cleanPhone,
          `🎉 *Resume Generated & Shared!*\n\nYour AI-tailored resume is ready! 📄✨\n\n🎯 *Optimized for:*\n• Job-specific requirements\n• Your skills & experience\n• ATS compatibility\n• Professional formatting\n\n📊 *Resume Details:*\n• File: ${result.fileName}\n• Generated: ${new Date().toLocaleDateString()}\n• Size: ${Math.round(result.pdfBuffer!.length / 1024)}KB\n\n💼 Best of luck with your application!\n\n🔗 Update profile: CampusPe.com`,
          'resume'
        );
        
        // Return comprehensive success response
        return res.json({
          success: true,
          message: 'Resume generated and automatically shared via WhatsApp',
          data: {
            resumeId: result.resumeId,
            fileName: result.fileName,
            fileSize: result.pdfBuffer!.length,
            downloadUrl: result.downloadUrl,
            sharedViaWhatsApp: true,
            metadata: {
              generatedAt: new Date().toISOString(),
              email,
              phone: cleanPhone,
              name,
              jobDescriptionLength: jobDescription.length,
              autoShared: true
            }
          }
        });
      } else {
        console.error('❌ WhatsApp sharing failed:', shareResult.message);
        
        // Resume generated but sharing failed - still return success with download link
        await sendWhatsAppWithFallback(
          cleanPhone,
          `✅ *Resume Generated Successfully!*\n\nYour resume is ready, but I couldn't send the file automatically.\n\n📥 *Download Link:*\n${result.downloadUrl || 'Available on CampusPe.com'}\n\n📄 File: ${result.fileName}\n\n💼 Good luck with your application!`
        );
        
        return res.json({
          success: true,
          message: 'Resume generated successfully, but automatic WhatsApp sharing failed',
          data: {
            resumeId: result.resumeId,
            fileName: result.fileName,
            fileSize: result.pdfBuffer!.length,
            downloadUrl: result.downloadUrl,
            sharedViaWhatsApp: false,
            shareError: shareResult.message,
            metadata: {
              generatedAt: new Date().toISOString(),
              email,
              phone: cleanPhone,
              name,
              jobDescriptionLength: jobDescription.length,
              autoShared: false
            }
          }
        });
      }
    } catch (shareError) {
      console.error('❌ WhatsApp sharing error:', shareError);
      
      // Resume generated but sharing failed - still return success
      await sendWhatsAppWithFallback(
        cleanPhone,
        `✅ *Resume Generated!*\n\nYour resume is ready!\n\n📥 *Download:*\n${result.downloadUrl || 'Visit CampusPe.com'}\n\n📄 ${result.fileName}\n\n💼 Good luck!`
      );
      
      return res.json({
        success: true,
        message: 'Resume generated successfully, but WhatsApp sharing encountered an error',
        data: {
          resumeId: result.resumeId,
          fileName: result.fileName,
          fileSize: result.pdfBuffer!.length,
          downloadUrl: result.downloadUrl,
          sharedViaWhatsApp: false,
          shareError: shareError instanceof Error ? shareError.message : 'Unknown sharing error',
          metadata: {
            generatedAt: new Date().toISOString(),
            email,
            phone: cleanPhone,
            name,
            jobDescriptionLength: jobDescription.length,
            autoShared: false
          }
        }
      });
    }
    
  } catch (error) {
    console.error('❌ WABB Auto-Generate & Share Error:', error);
    
    // Try to send error message to WhatsApp if phone is available
    if (req.body.phone) {
      const cleanPhone = req.body.phone.replace(/[^\d]/g, '');
      await sendWhatsAppMessage(
        cleanPhone,
        `❌ *Technical Error*\n\nSorry, I encountered an error while generating your resume.\n\n🔧 Our team has been notified.\n\n💡 Please try again in a few minutes or visit CampusPe.com\n\nApologies for the inconvenience! 🙏`
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during auto resume generation',
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * WABB endpoint for job description analysis (preview)
 * POST /api/wabb/analyze-job
 */
router.post('/analyze-job', async (req, res) => {
  try {
    const { jobDescription, phone } = req.body;
    
    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }
    
    console.log('🔍 Analyzing job description for WhatsApp user...');
    
    // Analyze job description
    const analysis = await ResumeBuilderService.analyzeJobDescription(jobDescription);
    
    // Send analysis to WhatsApp if phone provided
    if (phone) {
      const cleanPhone = phone.replace(/[^\d]/g, '');
      const analysisMessage = `🔍 *Job Analysis Complete*\n\n📋 *Requirements Found:*\n${analysis.requiredSkills.slice(0, 6).map(skill => `• ${skill}`).join('\n')}\n\n📈 *Level:* ${analysis.jobLevel.toUpperCase()}\n🏢 *Industry:* ${analysis.industry}\n\n💡 *Ready to create your tailored resume?*\nSend me your email and I'll generate a customized resume for this job!`;
      
      await sendWhatsAppMessage(cleanPhone, analysisMessage);
    }
    
    res.json({
      success: true,
      analysis,
      message: 'Job description analyzed successfully'
    });
    
  } catch (error) {
    console.error('❌ Job analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze job description'
    });
  }
});

/**
 * Test endpoint for WABB integration
 * GET /api/wabb/test
 */
router.get('/test', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (phone) {
      const cleanPhone = (phone as string).replace(/[^\d]/g, '');
      await sendWhatsAppMessage(
        cleanPhone,
        `🧪 *WABB Integration Test*\n\nHello! This is a test message from CampusPe's resume builder service.\n\n✅ WhatsApp integration is working!\n\n🎯 *Available Commands:*\n• Send job description + email for tailored resume\n• Get job requirement analysis\n• Professional resume generation\n\nTest completed successfully! 🚀`
      );
    }
    
    res.json({
      success: true,
      message: 'WABB integration test completed',
      timestamp: new Date().toISOString(),
      phone: phone ? (phone as string).replace(/[^\d]/g, '') : null
    });
    
  } catch (error) {
    console.error('❌ WABB test error:', error);
    res.status(500).json({
      success: false,
      message: 'WABB test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * WhatsApp webhook for handling incoming messages
 * POST /api/wabb/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📨 WABB Webhook received:', req.body);
    
    const { phone, message, name, type, timestamp } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone and message are required'
      });
    }
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Import the conversational flow handler
    const { WhatsAppResumeFlow } = await import('../services/whatsapp-resume-flow');
    
    // Handle the incoming message with our enhanced conversational flow
    await WhatsAppResumeFlow.handleIncomingMessage(cleanPhone, message, name);
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ WABB webhook error:', error);
    
    // Fallback error message to user
    if (req.body.phone) {
      const cleanPhone = req.body.phone.replace(/[^\d]/g, '');
      await sendWhatsAppMessage(
        cleanPhone,
        `❌ *Technical Error*\n\nSorry! I encountered an error processing your message.\n\n� Please try again in a moment or contact support.\n\n💡 Type "help" for assistance.`
      );
    }
    
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
});

/**
 * Test WhatsApp notification endpoint
 * POST /api/wabb/test-whatsapp
 */
router.post('/test-whatsapp', async (req, res) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const testMessage = message || '🧪 Test WhatsApp notification from CampusPe API';
    
    console.log('🧪 Testing WhatsApp notification:', { phone, message: testMessage });
    
    const result = await sendWhatsAppMessage(phone, testMessage, 'resume');
    
    res.json({
      success: true,
      message: 'WhatsApp test completed',
      result
    });
    
  } catch (error: any) {
    console.error('❌ WhatsApp test failed:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'WhatsApp test failed'
    });
  }
});

/**
 * Health check for WABB integration
 * GET /api/wabb/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'WABB Resume Service is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/wabb/create-resume',
      'POST /api/wabb/generate-and-share',
      'GET /api/wabb/debug-user/:email',
      'POST /api/wabb/debug-generate-and-share',
      'POST /api/wabb/webhook',
      'GET /api/wabb/health'
    ]
  });
});

/**
 * Debug version of generate-and-share endpoint
 */
router.post('/debug-generate-and-share', async (req, res) => {
  try {
    console.log('🚀 DEBUG: WABB Auto-Generate & Share Request:', req.body);
    
    const { email, phone, name, jobDescription } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    // Clean phone number (remove any formatting)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    console.log(`📱 DEBUG: Auto-processing resume request for ${email} (${cleanPhone})`);
    
    // Step 1: Check if user exists
    const { Student } = require('../models/Student');
    const student = await Student.findOne({ email: email }).populate('userId');
    
    if (!student) {
      console.log('❌ DEBUG: Student not found');
      return res.status(400).json({
        success: false,
        message: 'Student profile not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    console.log('✅ DEBUG: Student found:', student.firstName, student.lastName);
    
    // Step 2: Test job analysis
    try {
      console.log('🔍 DEBUG: Starting job analysis...');
      const ResumeBuilderService = require('../services/resume-builder').default;
      const jobAnalysis = await ResumeBuilderService.analyzeJobDescription(jobDescription);
      console.log('✅ DEBUG: Job analysis completed:', {
        requiredSkills: jobAnalysis.requiredSkills?.length || 0,
        preferredSkills: jobAnalysis.preferredSkills?.length || 0,
        jobLevel: jobAnalysis.jobLevel
      });
    } catch (analysisError: any) {
      console.error('❌ DEBUG: Job analysis failed:', analysisError?.message);
      return res.status(500).json({
        success: false,
        message: 'Job analysis failed: ' + analysisError?.message,
        code: 'ANALYSIS_FAILED'
      });
    }
    
    // Step 3: Test student data retrieval
    try {
      console.log('📋 DEBUG: Getting student data...');
      const ResumeBuilderService = require('../services/resume-builder').default;
      const studentData = await ResumeBuilderService.getStudentData(email, cleanPhone);
      
      if (!studentData) {
        console.log('❌ DEBUG: Student data retrieval failed');
        return res.status(400).json({
          success: false,
          message: 'Failed to retrieve student data',
          code: 'DATA_RETRIEVAL_FAILED'
        });
      }
      
      console.log('✅ DEBUG: Student data retrieved:', {
        name: `${studentData.personalInfo.firstName} ${studentData.personalInfo.lastName}`,
        skillsCount: studentData.skills?.length || 0,
        experienceCount: studentData.experience?.length || 0
      });
    } catch (dataError: any) {
      console.error('❌ DEBUG: Student data retrieval failed:', dataError?.message);
      return res.status(500).json({
        success: false,
        message: 'Student data retrieval failed: ' + dataError?.message,
        code: 'DATA_FAILED'
      });
    }
    
    // Step 4: Test full resume generation
    try {
      console.log('🎯 DEBUG: Starting full resume generation...');
      const ResumeBuilderService = require('../services/resume-builder').default;
      const result = await ResumeBuilderService.createTailoredResume(
        email,
        cleanPhone,
        jobDescription
      );
      
      console.log('📊 DEBUG: Resume generation result:', {
        success: result.success,
        message: result.message,
        hasBuffer: !!result.pdfBuffer,
        fileName: result.fileName
      });
      
      return res.json({
        success: true,
        message: 'Debug completed successfully',
        debugResult: {
          userExists: true,
          jobAnalysisWorking: true,
          studentDataWorking: true,
          resumeGeneration: result
        }
      });
      
    } catch (resumeError: any) {
      console.error('❌ DEBUG: Resume generation failed:', resumeError?.message);
      return res.status(500).json({
        success: false,
        message: 'Resume generation failed: ' + resumeError?.message,
        code: 'RESUME_FAILED'
      });
    }
    
  } catch (error: any) {
    console.error('❌ DEBUG: Overall error:', error?.message);
    res.status(500).json({
      success: false,
      message: 'Debug failed: ' + error?.message,
      code: 'DEBUG_FAILED'
    });
  }
});

export default router;
