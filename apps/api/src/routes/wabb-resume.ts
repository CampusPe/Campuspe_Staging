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
      `🎯 *Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a tailored resume for you based on the job description you provided.\n\n⏳ This will take 30-60 seconds...\n\n🔍 *What I'm doing:*\n• Analyzing the job requirements\n• Fetching your profile from CampusPe\n• Tailoring your resume to match\n• Generating PDF document\n\nI'll send you the resume shortly! 📄✨`
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
    
    const { phone, message, name, type } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone and message are required'
      });
    }
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const messageText = message.toLowerCase();
    
    // Handle different message types
    if (messageText.includes('resume') || messageText.includes('cv')) {
      await sendWhatsAppMessage(
        cleanPhone,
        `📄 *Resume Builder Help*\n\nTo create a tailored resume, please send:\n\n1️⃣ Your email address\n2️⃣ Job description\n\n*Example:*\n"Email: john@example.com\nJob: Looking for React developer with 2+ years experience..."\n\nI'll analyze the job and create a perfectly tailored resume for you! 🎯\n\n💡 Make sure you have a profile on CampusPe.com`
      );
    } else if (messageText.includes('help')) {
      await sendWhatsAppMessage(
        cleanPhone,
        `🤖 *CampusPe Resume Builder*\n\n✨ *What I can do:*\n• Generate tailored resumes for specific jobs\n• Analyze job requirements\n• Match your skills to job needs\n• Create professional PDF resumes\n\n📋 *How to use:*\n1. Send job description + your email\n2. I'll fetch your CampusPe profile\n3. Generate customized resume\n4. Deliver PDF instantly!\n\n🔗 Visit CampusPe.com to update your profile\n\nType "resume" for detailed instructions! 📄`
      );
    } else if (messageText.includes('@') && messageText.length > 50) {
      // This looks like an email + job description
      const emailMatch = messageText.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        const email = emailMatch[0];
        await sendWhatsAppMessage(
          cleanPhone,
          `🎯 *Resume Request Received*\n\nEmail: ${email}\nJob Description: Detected\n\n⏳ Processing your tailored resume...\n\nThis may take 30-60 seconds. I'll send you the PDF as soon as it's ready! 📄✨`
        );
        
        // Extract job description (remove email from message)
        const jobDescription = messageText.replace(emailMatch[0], '').replace(/email:|job:/gi, '').trim();
        
        // Create resume
        const result = await ResumeBuilderService.createTailoredResume(
          email,
          cleanPhone,
          jobDescription
        );
        
        if (result.success) {
          await sendWhatsAppMessage(
            cleanPhone,
            `✅ *Resume Ready!*\n\nYour tailored resume has been generated successfully!\n\n📄 File: ${result.fileName}\n⚡ Size: ${Math.round(result.pdfBuffer!.length / 1024)}KB\n🎯 Customized for the job requirements\n\n💼 Best of luck with your application!\n\n🔗 Update your profile: CampusPe.com`
          );
        } else {
          await sendWhatsAppMessage(
            cleanPhone,
            `❌ *Resume Generation Failed*\n\n${result.message}\n\n💡 Please ensure:\n• You have a complete profile on CampusPe.com\n• Your email is correct\n• Your profile has skills and experience\n\nTry again after updating your profile! 😊`
          );
        }
      }
    } else {
      await sendWhatsAppMessage(
        cleanPhone,
        `👋 Hi ${name || 'there'}!\n\nI'm CampusPe's Resume Builder Bot! 🤖\n\n📄 I can create tailored resumes for specific job applications.\n\n💡 Type "help" for instructions or "resume" to get started!\n\n🔗 Make sure you have a profile on CampusPe.com`
      );
    }
    
    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
    
  } catch (error) {
    console.error('❌ WABB webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
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
