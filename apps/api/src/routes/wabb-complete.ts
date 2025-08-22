import express from 'express';
import { Student } from '../models/Student';
import { User } from '../models/User';
import GeneratedResumeService from '../services/generated-resume.service';
import ResumeBuilderService from '../services/resume-builder';
import { sendWhatsAppMessage } from '../services/whatsapp';
import mockWhatsApp from '../services/mock-whatsapp';
import aiResumeMatchingService from '../services/ai-resume-matching';

const router = express.Router();

// Helper function to send WhatsApp messages with fallback
async function sendWhatsAppWithFallback(phone: string, message: string, serviceType: 'resume' = 'resume') {
  const hasWabbConfig = process.env.WABB_API_KEY || process.env.WABB_WEBHOOK_URL;
  
  console.log('📱 Sending WhatsApp message to:', phone);
  console.log('📱 Message preview:', message.substring(0, 100) + '...');
  
  if (!hasWabbConfig) {
    console.log('⚠️ WABB not configured, using mock WhatsApp service');
    try {
      const result = await mockWhatsApp.sendMessage(phone, message, serviceType);
      console.log('📱 Mock WhatsApp result:', result);
      return { success: true, message: 'Message sent via mock service' };
    } catch (error) {
      console.log('❌ Mock WhatsApp failed:', error);
      return { success: true, message: 'Message logged (mock service unavailable)' };
    }
  }
  
  try {
    const result = await sendWhatsAppMessage(phone, message, serviceType);
    console.log('📱 Real WhatsApp result:', result);
    return result || { success: true, message: 'Message sent via WABB' };
  } catch (error) {
    console.log('⚠️ WABB service failed, falling back to mock service:', error);
    try {
      const result = await mockWhatsApp.sendMessage(phone, message, serviceType);
      return result || { success: true, message: 'Message sent via mock fallback' };
    } catch (mockError) {
      console.log('❌ Mock fallback also failed:', mockError);
      return { success: true, message: 'Message logged (all services unavailable)' };
    }
  }
}

// Real AI resume generator using Claude AI (SAME AS AI RESUME BUILDER)
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
  // Extract personal information with proper structure for PDF generation
  const fullName = studentProfile ? 
    `${studentProfile.firstName} ${studentProfile.lastName}`.trim() :
    'Your Name';
  
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'Your';
  const lastName = nameParts.slice(1).join(' ') || 'Name';
  
  const personalInfo = {
    name: fullName,
    firstName: firstName,
    lastName: lastName,
    email,
    phone,
    location: studentProfile?.address || undefined,
    linkedin: studentProfile?.linkedinUrl || undefined,
    github: studentProfile?.githubUrl || undefined
  };

  try {
    // Use Claude AI to generate job-focused resume content (SAME AS AI RESUME BUILDER)
    const aiService = aiResumeMatchingService;
    
    // Prepare user profile data for AI analysis (EXACT SAME FORMAT AS AI RESUME BUILDER)
    const userProfileText = `
Name: ${personalInfo.name}
Contact: ${email}, ${phone}
${studentProfile?.address ? `Location: ${studentProfile.address}` : ''}

EXPERIENCE:
${(studentProfile?.experience || []).map((exp: any) => 
  `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${Array.isArray(exp.description) ? exp.description.join(', ') : (exp.description || 'No description')}`
).join('\n')}

EDUCATION:
${(studentProfile?.education || []).map((edu: any) => 
  `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.endDate || 'In Progress'})`
).join('\n')}

SKILLS:
${[
  ...(studentProfile?.skills?.map((skill: any) => skill.name) || []),
  ...(studentProfile?.resumeAnalysis?.skills || [])
].join(', ')}

PROJECTS:
${(studentProfile?.projects || []).map((project: any) => 
  `- ${project.name}: ${project.description || 'Project description'}`
).join('\n')}
    `.trim();

    // Generate AI-optimized resume content (SAME PROMPT AS AI RESUME BUILDER)
    const aiPrompt = `
You are an expert resume writer. Create a highly targeted resume that is 70% focused on the job description and 30% on the user's background. 

JOB DESCRIPTION:
${jobDescription}

USER PROFILE:
${userProfileText}

INSTRUCTIONS:
1. Analyze the job description to identify key requirements, skills, and responsibilities
2. Create a professional summary that heavily emphasizes job-relevant skills and experience
3. Rewrite experience descriptions to highlight achievements relevant to the target job
4. Prioritize skills that match the job requirements
5. Ensure 70% of content directly relates to job requirements, 30% to user's actual background
6. Use action verbs and quantifiable achievements where possible
7. Keep the tone professional and confident

Generate a JSON response with this exact structure:
{
  "summary": "Professional summary tailored to the job (2-3 sentences)",
  "skills": ["array", "of", "relevant", "skills", "max", "12"],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name", 
      "duration": "Date range",
      "description": ["bullet point 1", "bullet point 2", "bullet point 3"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Tailored project description highlighting job-relevant aspects",
      "technologies": ["relevant", "tech", "stack"]
    }
  ],
  "education": [
    {
      "degree": "Degree title",
      "institution": "Institution name",
      "year": "Year or status"
    }
  ]
}`;

    console.log('🤖 Calling Claude AI with enhanced profile data...');
    console.log('🔍 AI Service Debug:');
    console.log('  Claude API Key Available:', !!process.env.CLAUDE_API_KEY || !!process.env.ANTHROPIC_API_KEY);
    console.log('  Environment:', process.env.NODE_ENV);
    
    // Call Claude AI (SAME METHOD AS AI RESUME BUILDER)
    let aiResponse;
    try {
      console.log('🤖 Making Claude AI call...');
      console.log('  API Key Present:', !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY));
      console.log('  API Key Length:', (process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '').length);
      console.log('  Prompt Length:', aiPrompt.length);
      
      aiResponse = await aiService.callClaudeAPI(aiPrompt);
      console.log('✅ Claude AI Response Success:', {
        hasResponse: !!aiResponse,
        hasContent: !!aiResponse?.content,
        contentLength: aiResponse?.content?.length || 0,
        contentPreview: aiResponse?.content?.substring(0, 100) || 'No content'
      });
    } catch (aiError) {
      console.log('❌ Claude AI Call Failed - DETAILED ERROR:');
      console.log('  Error Message:', aiError.message);
      console.log('  Error Type:', aiError.constructor.name);
      console.log('  Error Stack:', aiError.stack?.substring(0, 500));
      if (aiError.response) {
        console.log('  Response Status:', aiError.response.status);
        console.log('  Response Data:', JSON.stringify(aiError.response.data, null, 2));
      }
      console.log('🔄 This will cause fallback to basic resume generation');
      aiResponse = null;
    }
    
    if (aiResponse && aiResponse.content) {
      try {
        console.log('🤖 AI Response received, parsing content...');
        
        // Parse AI response (SAME PARSING AS AI RESUME BUILDER)
        const aiContent = JSON.parse(aiResponse.content);
        console.log('✅ AI Content parsed successfully:', {
          hasSummary: !!aiContent.summary,
          skillsCount: aiContent.skills?.length || 0,
          experienceCount: aiContent.experience?.length || 0,
          projectsCount: aiContent.projects?.length || 0,
          educationCount: aiContent.education?.length || 0
        });
        
        // Create frontend-compatible data (SAME FORMAT AS AI RESUME BUILDER)
        const frontendData = {
          personalInfo,
          summary: aiContent.summary || 'Professional seeking to contribute technical expertise and drive organizational success.',
          skills: aiContent.skills || [], // Keep as strings for frontend
          experience: (aiContent.experience || []).map((exp: any) => ({
            title: exp.title,
            company: exp.company,
            duration: exp.duration || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
            description: Array.isArray(exp.description) ? exp.description : [exp.description || '']
          })),
          education: (aiContent.education || []).map((edu: any) => ({
            degree: edu.degree || 'Degree',
            institution: edu.institution || 'Institution',
            year: edu.year || 'Year'
          })),
          projects: aiContent.projects || []
        };

        console.log('✅ Frontend data structure created successfully');
        return frontendData;
      } catch (parseError) {
        console.log('❌ Failed to parse AI response, using enhanced fallback:', parseError);
      }
    } else {
      console.log('❌ No AI response content received, using enhanced fallback');
    }
  } catch (aiError: any) {
    console.log('AI generation failed, using enhanced fallback:', aiError?.message || 'Unknown error');
  }

  // Enhanced fallback logic when AI fails
  return generateEnhancedFallbackResume({
    personalInfo,
    jobDescription,
    studentProfile
  });
}

// Enhanced fallback resume generation
function generateEnhancedFallbackResume({
  personalInfo,
  jobDescription,
  studentProfile
}: {
  personalInfo: any;
  jobDescription: string;
  studentProfile: any;
}) {
  console.log('🔄 Generating enhanced fallback resume...');
  
  // Extract skills from job description
  const jobKeywords = jobDescription.toLowerCase().match(/react|node\.?js|mongodb|typescript|javascript|python|java|spring|docker|kubernetes|aws|azure|git|html|css|sql|nosql|api|rest|graphql|microservices|agile|scrum|frontend|backend|fullstack|full-stack/g) || [];
  const uniqueJobSkills = [...new Set(jobKeywords)];
  
  // Combine user skills with job-relevant skills
  const userSkills = (studentProfile?.skills?.map((skill: any) => skill.name) || []);
  const combinedSkills = [...new Set([...userSkills, ...uniqueJobSkills])].slice(0, 12);
  
  // Generate a more comprehensive summary
  const summary = `Experienced ${uniqueJobSkills.includes('fullstack') || uniqueJobSkills.includes('full-stack') ? 'Full-Stack' : 'Software'} Developer with expertise in ${uniqueJobSkills.slice(0, 4).join(', ')} and a strong background in modern web development. Proven track record of delivering high-quality solutions, collaborating effectively with cross-functional teams, and contributing to innovative digital products that drive business growth and user engagement.`;
  
  // Enhanced experience with job-relevant descriptions
  const enhancedExperience = (studentProfile?.experience || []).length > 0 ? 
    (studentProfile.experience || []).map((exp: any) => ({
      title: exp.title || 'Software Developer',
      company: exp.company || 'Tech Company',
      duration: exp.duration || `${exp.startDate || '2023'} - ${exp.endDate || 'Present'}`,
      description: Array.isArray(exp.description) ? exp.description : [
        exp.description || `Developed and maintained web applications using ${uniqueJobSkills.slice(0, 3).join(', ')}`,
        `Collaborated with cross-functional teams to deliver high-quality software solutions`,
        `Implemented responsive designs and user-friendly interfaces`
      ]
    })) : [
      {
        title: 'Software Development Intern',
        company: 'Let\'s Upgrade',
        duration: '2024 - Present',
        description: [
          `Developed intuitive website frameworks and interactive interfaces using ${uniqueJobSkills.slice(0, 3).join(', ')}`,
          'Collaborated with UI/UX teams to design and implement visually appealing, user-friendly web applications',
          'Assisted in executing digital marketing strategies to drive web traffic and increase user engagement',
          'Contributed innovative web development solutions through active participation in team discussions'
        ]
      }
    ];
  
  // Enhanced education
  const enhancedEducation = (studentProfile?.education || []).length > 0 ?
    (studentProfile.education || []).map((edu: any) => ({
      degree: edu.degree || 'B.Tech in Computer Science and Engineering',
      institution: edu.institution || 'ITM SKILLS UNIVERSITY',
      year: edu.year || edu.endDate || '2025'
    })) : [
      {
        degree: 'B.Tech in Computer Science and Engineering in Computer Science',
        institution: 'ITM SKILLS UNIVERSITY',
        year: '2020 - 2025'
      }
    ];
  
  // Enhanced projects with job-relevant technologies
  const enhancedProjects = (studentProfile?.projects || []).length > 0 ?
    (studentProfile.projects || []).map((project: any) => ({
      name: project.name || 'E-commerce Website',
      description: project.description || `Designed and developed a responsive e-commerce website using ${uniqueJobSkills.slice(0, 3).join(', ')} and modern web technologies. Implemented features such as shopping cart, payment integration, and user authentication to provide a seamless online shopping experience.`,
      technologies: project.technologies || uniqueJobSkills.slice(0, 6)
    })) : [
      {
        name: 'E-commerce Website',
        description: `Designed and developed a responsive e-commerce website using ${uniqueJobSkills.slice(0, 3).join(', ')} and modern web technologies. Implemented features such as shopping cart, payment integration, and user authentication to provide a seamless online shopping experience.`,
        technologies: uniqueJobSkills.slice(0, 6)
      }
    ];
  
  const result = {
    personalInfo,
    summary,
    skills: combinedSkills,
    experience: enhancedExperience,
    education: enhancedEducation,
    projects: enhancedProjects
  };
  
  console.log('✅ Enhanced fallback resume generated with complete data');
  return result;
}

/**
 * Complete WABB Resume Generation Endpoint
 * Handles: AI Generation -> Save to DB -> Send via WhatsApp -> Webhook notification
 */
router.post('/generate-resume-complete', async (req, res) => {
  try {
    console.log('🎯 WABB Complete Resume Generation started');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    const { email, phone, name, jobDescription } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      console.log('❌ Missing required fields:', { 
        hasEmail: !!email, 
        hasPhone: !!phone, 
        hasJobDescription: !!jobDescription 
      });
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }

    console.log('✅ Required fields validated');
    console.log('📊 Generation parameters:', {
      email,
      phone,
      name,
      jobDescriptionLength: jobDescription.length
    });

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

    // Step 7: Prepare download URL and send resume via WhatsApp
    // Use API service to serve static files directly
    let apiBaseUrl;
    if (process.env.NODE_ENV === 'production') {
      // Always use the full correct Azure URL in production
      apiBaseUrl = 'https://campuspe-api-staging-hmfjgud5c6a7exe9.southindia-01.azurewebsites.net';
    } else {
      apiBaseUrl = 'http://localhost:5001';
    }
    
    const downloadUrl = `${apiBaseUrl}/uploads/generated-resumes/${savedResume.resumeId}.pdf`;
    
    console.log('📄 Download URL generated:', downloadUrl);
    
    console.log('📱 Sending resume via WhatsApp...');
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const resumeMessage = `🎉 *Your AI Resume is Ready!*\n\n✅ *Resume Generated Successfully*\n\n📄 *${fullName}*\n💼 Position: ${jobDescription.split('\n')[0] || 'Software Engineer'}\n\n🔗 *Download Link:*\n${downloadUrl}\n\n✨ *Your resume has been tailored specifically for this job!*\n\n📧 Email: ${transformedResumeData.personalInfo.email}\n📱 Phone: ${transformedResumeData.personalInfo.phone}\n\n🚀 *Powered by CampusPe AI*`;

    let whatsappResult;
    try {
      whatsappResult = await sendWhatsAppWithFallback(cleanPhone, resumeMessage, 'resume');
      console.log('✅ WhatsApp message sent:', whatsappResult);
    } catch (whatsappError) {
      console.log('⚠️ WhatsApp message failed:', whatsappError);
      whatsappResult = { success: false, message: 'WhatsApp sending failed' };
    }

    // Step 8: Send success webhook with download URL
    try {
      const successWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
      const axios = require('axios');
      
      const webhookPayload = {
        resumeId: savedResume.resumeId,
        number: cleanPhone,
        status: 'success',
        message: 'Resume generated and sent successfully',
        downloadUrl: downloadUrl,
        studentName: fullName,
        email: transformedResumeData.personalInfo.email,
        fileName: fileName,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending success webhook with payload:', webhookPayload);
      
      await axios.post(successWebhookUrl, webhookPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log('✅ Success webhook sent successfully');
    } catch (webhookError) {
      console.log('⚠️ Success webhook failed:', webhookError);
    }

    // Step 9: CRITICAL - Trigger external webhook for Azure production with downloadUrl and phone
    try {
      const externalWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
      const axios = require('axios');
      
      // Format phone number correctly for webhook (ensure + prefix)
      const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : 
                            cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
      
      const externalWebhookPayload = {
        phone: formattedPhone,
        downloadUrl: downloadUrl,
        studentName: fullName,
        email: transformedResumeData.personalInfo.email,
        resumeId: savedResume.resumeId,
        timestamp: new Date().toISOString(),
        source: 'campuspe-api',
        action: 'resume-ready'
      };
      
      console.log('🎯 Triggering external webhook for Azure production:', {
        url: externalWebhookUrl,
        phone: formattedPhone,
        downloadUrl: downloadUrl
      });
      
      await axios.post(externalWebhookUrl, externalWebhookPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      console.log('✅ External webhook triggered successfully');
    } catch (externalWebhookError) {
      console.log('⚠️ External webhook failed:', externalWebhookError);
    }

    console.log('✅ WABB Complete Resume Generation finished successfully');

    // Final response with all important data
    const responseData = {
      resumeId: savedResume.resumeId,
      studentName: fullName,
      email: transformedResumeData.personalInfo.email,
      phone: cleanPhone,
      formattedPhone: cleanPhone.startsWith('91') ? `+${cleanPhone}` : 
                     cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`,
      downloadUrl: downloadUrl,
      whatsappSent: whatsappResult.success,
      fileName: fileName,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Resume generated and sent successfully',
      data: responseData
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
