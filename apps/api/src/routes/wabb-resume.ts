import express from 'express';
import ResumeBuilderService from '../services/resume-builder';
import { sendWhatsAppMessage } from '../services/whatsapp';

const router = express.Router();

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
 * Health check for WABB integration
 * GET /api/wabb/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'WABB Resume Builder Integration',
    status: 'active',
    features: [
      'Tailored resume generation',
      'Job description analysis',
      'WhatsApp integration',
      'PDF generation',
      'Profile matching'
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;
