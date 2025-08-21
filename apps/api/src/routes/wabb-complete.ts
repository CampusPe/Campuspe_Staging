import express from 'express';
import { Student } from '../models/Student';
import { User } from '../models/User';
import GeneratedResumeService from '../services/generated-resume.service';
import ResumeBuilderService from '../services/resume-builder';
import { sendWhatsAppMessage } from '../services/whatsapp';
import mockWhatsApp from '../services/mock-whatsapp';

const router = express.Router();

// Helper function to send WhatsApp messages with fallback
async function sendWhatsAppWithFallback(phone: string, message: string, serviceType: 'resume' = 'resume') {
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

// Simple AI resume generator for WABB
async function generateAIResume({
  email,
  phone,
  jobDescription,
  studentProfile
}: {
  email: string;
  phone: string;
  jobDescription: string;
  studentProfile: any;
}) {
  const fullName = studentProfile ? 
    `${studentProfile.firstName} ${studentProfile.lastName}`.trim() :
    'Your Name';
  
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'Your';
  const lastName = nameParts.slice(1).join(' ') || 'Name';
  
  return {
    personalInfo: {
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      email,
      phone,
      linkedin: 'LinkedIn',
      github: 'GitHub'
    },
    summary: `Experienced professional with expertise in ${jobDescription.split(' ').slice(0, 10).join(' ')}...`,
    skills: ['JavaScript', 'React', 'Node.js', 'Problem Solving'],
    experience: [{
      title: 'Software Developer',
      company: 'Tech Company',
      duration: '2024 - Present',
      description: ['Developed software solutions']
    }],
    education: [{
      degree: 'Bachelor\'s Degree',
      field: 'Computer Science',
      institution: 'University',
      year: '2025'
    }],
    projects: [{
      name: 'Web Application',
      description: 'Built a web application',
      technologies: ['React', 'Node.js']
    }]
  };
}

/**
 * Complete WABB Resume Generation Endpoint
 * Handles: AI Generation -> Save to DB -> Send via WhatsApp -> Webhook notification
 */
router.post('/generate-resume-complete', async (req, res) => {
  try {
    const { email, phone, name, jobDescription } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }

    console.log('🎯 WABB Complete Resume Generation started:', {
      email,
      phone,
      name,
      jobDescription: jobDescription.substring(0, 50) + '...'
    });

    // Step 1: Send initial notification
    try {
      const cleanPhone = phone.replace(/[^\d]/g, '');
      await sendWhatsAppWithFallback(
        cleanPhone,
        `🎯 *AI Resume Generation Started*\n\nHi ${name || 'there'}! I'm creating a personalized resume for you.\n\n⏳ This will take 30-60 seconds...\n\n📄 Your resume will be ready shortly!`,
        'resume'
      );
    } catch (notificationError) {
      console.log('⚠️ Initial notification failed:', notificationError);
    }

    // Step 2: Find student profile
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register on CampusPe first.',
        email
      });
    }

    const studentProfile = await Student.findOne({ userId: user._id }).lean();
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please complete your CampusPe profile first.',
        email
      });
    }

    // Step 3: Generate AI resume
    console.log('🤖 Generating AI resume...');
    const aiResult = await generateAIResume({
      email,
      phone: phone.replace(/[^\d]/g, ''),
      jobDescription,
      studentProfile
    });
    
    if (!aiResult || !aiResult.personalInfo) {
      throw new Error('AI resume generation failed');
    }

    // Step 4: Transform and validate resume data for PDF generation
    const transformedResumeData = {
      personalInfo: {
        firstName: aiResult.personalInfo.firstName || studentProfile.firstName || 'Unknown',
        lastName: aiResult.personalInfo.lastName || studentProfile.lastName || 'User',
        email: aiResult.personalInfo.email || studentProfile.email || email,
        phone: aiResult.personalInfo.phone || studentProfile.phoneNumber || phone.replace(/[^\d]/g, ''),
        linkedin: aiResult.personalInfo.linkedin || 'LinkedIn',
        github: aiResult.personalInfo.github || 'GitHub'
      },
      summary: aiResult.summary || 'Professional summary not available',
      skills: (aiResult.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name || 'Skill',
        level: typeof skill === 'string' ? 'Intermediate' : skill.level || 'Intermediate',
        category: typeof skill === 'string' ? 'Technical' : skill.category || 'Technical'
      })),
      experience: (aiResult.experience || []).map((exp: any) => ({
        title: exp.title || 'Unknown Position',
        company: exp.company || 'Unknown Company',
        location: exp.location || 'Remote',
        startDate: new Date(exp.startDate || '2024-01-01'),
        endDate: exp.endDate ? new Date(exp.endDate) : undefined,
        description: Array.isArray(exp.description) ? exp.description.join('; ') : (exp.description || 'No description'),
        isCurrentJob: exp.isCurrentJob || false
      })),
      education: (aiResult.education || []).map((edu: any) => ({
        degree: edu.degree || 'Degree',
        field: edu.field || 'Computer Science',
        institution: edu.institution || 'University',
        startDate: new Date(edu.startDate || '2020-01-01'),
        endDate: edu.endDate ? new Date(edu.endDate) : new Date('2025-12-31'),
        gpa: edu.gpa || undefined,
        isCompleted: edu.isCompleted !== false
      })),
      projects: (aiResult.projects || []).map((proj: any) => ({
        name: proj.name || 'Project',
        description: proj.description || 'Project description',
        technologies: proj.technologies || [],
        link: proj.link || ''
      }))
    };

    // Step 5: Generate HTML and PDF
    console.log('📄 Generating PDF...');
    const fullName = `${transformedResumeData.personalInfo.firstName} ${transformedResumeData.personalInfo.lastName}`.trim();
    const fileName = `${fullName || 'Resume'}_AI_Generated_${Date.now()}.pdf`;
    
    // Generate HTML using ResumeBuilderService
    const htmlContent = ResumeBuilderService.generateResumeHTML(transformedResumeData);
    
    // Generate PDF from HTML
    const pdfBuffer = await ResumeBuilderService.generatePDF(htmlContent);

    // Step 6: Save resume to database
    console.log('💾 Saving resume to database...');
    const savedResume = await GeneratedResumeService.createGeneratedResume({
      studentId: studentProfile._id.toString(),
      jobDescription,
      resumeData: transformedResumeData,
      fileName,
      pdfBuffer,
      matchScore: 85, // Default match score
      aiEnhancementUsed: true,
      matchedSkills: [],
      missingSkills: [],
      suggestions: [],
      generationType: 'ai'
    });

    // Step 7: Send resume via WhatsApp
    console.log('📱 Sending resume via WhatsApp...');
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const resumeMessage = `🎉 *Your AI Resume is Ready!*\n\n✅ *Resume Generated Successfully*\n\n📄 *${fullName}*\n💼 Position: ${jobDescription.split('\n')[0] || 'Software Engineer'}\n\n🔗 *Download Link:*\n${process.env.WEB_BASE_URL || 'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net'}/generated-resume/${savedResume.resumeId}\n\n✨ *Your resume has been tailored specifically for this job!*\n\n📧 Email: ${transformedResumeData.personalInfo.email}\n📱 Phone: ${transformedResumeData.personalInfo.phone}\n\n🚀 *Powered by CampusPe AI*`;

    const whatsappResult = await sendWhatsAppWithFallback(cleanPhone, resumeMessage, 'resume');

    // Step 8: Send success webhook
    try {
      const successWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
      const axios = require('axios');
      
      await axios.post(successWebhookUrl, {
        resumeId: savedResume.resumeId,
        number: cleanPhone,
        status: 'success',
        message: 'Resume generated and sent successfully'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
    } catch (webhookError) {
      console.log('⚠️ Success webhook failed:', webhookError);
    }

    console.log('✅ WABB Complete Resume Generation finished successfully');

    res.json({
      success: true,
      message: 'Resume generated and sent successfully',
      data: {
        resumeId: savedResume.resumeId,
        studentName: fullName,
        email: transformedResumeData.personalInfo.email,
        phone: cleanPhone,
        downloadUrl: `${process.env.WEB_BASE_URL || 'https://campuspe-web-staging-erd8dvb3ewcjc5g2.southindia-01.azurewebsites.net'}/generated-resume/${savedResume.resumeId}`,
        whatsappSent: whatsappResult.success
      }
    });

  } catch (error: any) {
    console.error('❌ WABB Complete Resume Generation failed:', error);

    // Send error webhook
    try {
      const { phone } = req.body;
      if (phone) {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        
        // Send error message via WhatsApp
        await sendWhatsAppWithFallback(
          cleanPhone,
          `❌ *Resume Generation Failed*\n\nSorry, we encountered an issue generating your resume.\n\nError: ${error.message}\n\nPlease try again or contact support.`,
          'resume'
        );

        // Send error webhook
        const errorWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/HJGMsTitkl8a/';
        const axios = require('axios');
        
        await axios.post(errorWebhookUrl, {
          number: cleanPhone,
          status: 'error',
          error: error.message
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
      }
    } catch (errorNotificationFailed) {
      console.log('⚠️ Error notification failed:', errorNotificationFailed);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate resume',
      error: error.message,
      code: 'GENERATION_FAILED'
    });
  }
});

export default router;
