import express from 'express';
import auth from '../middleware/auth';
import { Student } from '../models/Student';
import { GeneratedResume } from '../models/GeneratedResume';
import aiResumeMatchingService from '../services/ai-resume-matching';
import ResumeBuilderService from '../services/resume-builder';
import GeneratedResumeService from '../services/generated-resume.service';
import axios from 'axios';

const router = express.Router();

// Debug endpoint to test database saving (no auth required)
router.post('/debug-save', async (req, res) => {
  try {
    console.log('=== DEBUG SAVE ENDPOINT ===');
    
    // Find an existing student
    const student = await Student.findOne({});
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No student found in database'
      });
    }

    console.log('Found student:', student._id);

    const resumeHistoryItem = {
      id: new Date().getTime().toString(),
      jobDescription: 'Debug test job description',
      jobTitle: 'Debug Test Position',
      resumeData: {
        contact: {
          email: student.email,
          phone: student.phoneNumber || '9999999999',
          name: `${student.firstName} ${student.lastName}`
        },
        skills: ['Debug', 'Testing'],
        experience: []
      },
      pdfUrl: 'https://example.com/debug-resume.pdf',
      generatedAt: new Date(),
      matchScore: 99
    };

    console.log('Saving resume to history for student:', student._id);

    // Initialize aiResumeHistory if it doesn't exist
    if (!student.aiResumeHistory) {
      student.aiResumeHistory = [];
    }

    // Add new resume to history
    student.aiResumeHistory.push(resumeHistoryItem);

    // Keep only last 3 resumes
    if (student.aiResumeHistory.length > 3) {
      student.aiResumeHistory = student.aiResumeHistory.slice(-3);
    }

    // Save the document
    await student.save();

    console.log('✅ Resume saved successfully. Current history length:', student.aiResumeHistory.length);

    res.json({
      success: true,
      message: 'Debug save completed',
      studentId: student._id,
      historyLength: student.aiResumeHistory.length,
      savedItem: resumeHistoryItem
    });

  } catch (error: any) {
    console.error('❌ Debug save error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug save failed',
      error: error.message
    });
  }
});

// AI Resume Generation Endpoint
router.post('/generate-ai', auth, async (req, res) => {
  try {
    const { email, phone, jobDescription, includeProfileData = true } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required'
      });
    }

    // Find the student profile
    let studentProfile = null;
    if (includeProfileData) {
      try {
        studentProfile = await Student.findOne({ userId }).lean();
      } catch (error) {
        console.log('Could not fetch student profile:', error);
        // Continue without profile data
      }
    }

    // Create resume data using existing profile and job analysis
    const resumeData = await generateAIResume({
      email,
      phone,
      jobDescription,
      studentProfile
    });

    let historySaved = false;
    let historyError = null;
    let generatedResumeId = null;

    // Store the generated resume in both GeneratedResume collection AND student history
    if (studentProfile) {
      try {
        console.log('=== SAVING RESUME TO DATABASE ===');
        console.log('Student ID:', studentProfile._id);

        generatedResumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Extract job title from description
        const jobTitle = extractJobTitleFromDescription(jobDescription);

        // 1. Save to GeneratedResume collection (campuspe.generatedresumes)
        try {
          const generatedResume = new GeneratedResume({
            studentId: studentProfile._id,
            resumeId: generatedResumeId,
            jobTitle: jobTitle || 'AI Generated Resume',
            jobDescription,
            jobDescriptionHash: require('crypto').createHash('md5').update(jobDescription).digest('hex'),
            resumeData,
            pdfUrl: `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/ai-resume-builder/download-pdf-public/${generatedResumeId}`,
            matchScore: 85,
            generatedAt: new Date(),
            isActive: true
          });

          await generatedResume.save();
          console.log('✅ Resume saved to GeneratedResume collection');
        } catch (dbError) {
          console.error('❌ Error saving to GeneratedResume collection:', dbError);
        }

        // 2. Also save to Student.aiResumeHistory for frontend compatibility
        const student = await Student.findById(studentProfile._id);
        if (student) {
          // Initialize aiResumeHistory if it doesn't exist
          if (!student.aiResumeHistory) {
            student.aiResumeHistory = [];
          }

          // Create the history item in the format expected by frontend
          const historyItem = {
            id: generatedResumeId,
            jobDescription,
            jobTitle: jobTitle || 'AI Generated Resume',
            resumeData: resumeData,
            pdfUrl: `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/ai-resume-builder/download-pdf-public/${generatedResumeId}`,
            generatedAt: new Date(),
            matchScore: 85
          };

          // Add to beginning of array
          student.aiResumeHistory.unshift(historyItem);

          // Keep only last 10 resumes
          if (student.aiResumeHistory.length > 10) {
            student.aiResumeHistory = student.aiResumeHistory.slice(0, 10);
          }

          await student.save();
          console.log('✅ Resume saved to Student.aiResumeHistory');
          
          historySaved = true;
        }

      } catch (error) {
        console.error('❌ ERROR saving resume to student history:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        historyError = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      console.log('⚠️ No student profile found - resume history not saved');
      historyError = 'No student profile found';
    }

    res.json({
      success: true,
      message: 'Resume generated successfully using AI',
      data: {
        resume: resumeData,
        resumeId: generatedResumeId,
        downloadUrl: generatedResumeId ? `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${generatedResumeId}` : null
      },
      historySaved,
      historyError
    });

  } catch (error: any) {
    console.error('Error generating AI resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI resume',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get Resume History Endpoint
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const student = await Student.findOne({ userId }, 'aiResumeHistory').lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const resumeHistory = (student.aiResumeHistory || [])
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, 3); // Ensure only last 3

    res.json({
      success: true,
      data: {
        resumeHistory
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

// Share Resume on WhatsApp Endpoint
router.post('/share-whatsapp', auth, async (req, res) => {
  try {
    const { resumeId, phoneNumber } = req.body;
    const userId = req.user._id;

    if (!resumeId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID and phone number are required'
      });
    }

    // Find the student and specific resume
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const resume = student.aiResumeHistory?.find(r => r.id === resumeId);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Generate PDF URL for this resume
    const pdfUrl = await generateResumePdfUrl(resume.resumeData, resumeId);
    
    if (!pdfUrl) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF URL'
      });
    }
    
    // Send to WhatsApp via Wabb webhook
    const whatsappResponse = await sendResumeToWhatsApp(phoneNumber, pdfUrl, resume.jobTitle || 'Resume');

    // Update the resume with PDF URL if successful
    if (whatsappResponse.success && pdfUrl) {
      await Student.findOneAndUpdate(
        { userId, 'aiResumeHistory.id': resumeId },
        { $set: { 'aiResumeHistory.$.pdfUrl': pdfUrl } }
      );
    }

    res.json({
      success: true,
      message: 'Resume shared successfully on WhatsApp',
      data: {
        pdfUrl,
        whatsappResponse
      }
    });

  } catch (error: any) {
    console.error('Error sharing resume on WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share resume on WhatsApp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send Resume to User's Own WhatsApp - New Endpoint
router.post('/send-to-my-whatsapp', auth, async (req, res) => {
  try {
    const { resumeId } = req.body;
    const userId = req.user._id;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID is required'
      });
    }

    // Find the student profile to get their phone number
    const student = await Student.findOne({ userId }).lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Get phone number from student profile
    let phoneNumber = student.phoneNumber;
    
    // If no phone number in student profile, try to get from User model
    if (!phoneNumber) {
      const user = await import('../models/User').then(mod => mod.User.findById(userId).lean());
      phoneNumber = user?.phone;
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number not found in your profile. Please update your profile with a valid phone number.'
      });
    }

    // Clean and validate phone number - ensure it's 10 digits
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please update your profile with a valid 10-digit phone number.'
      });
    }

    // Get the last 10 digits if phone number is longer than 10 digits
    const tenDigitPhone = cleanPhone.slice(-10);

    // Find the specific resume
    const resume = student.aiResumeHistory?.find(r => r.id === resumeId);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Use the existing WABB resume service to send the resume
    const { sendWhatsAppMessage } = require('../services/whatsapp');
    
    try {
      // Generate PDF URL for this resume
      const pdfUrl = await generateResumePdfUrl(resume.resumeData, resumeId);
      
      if (pdfUrl) {
        // Send resume document via WABB webhook
        const whatsappResponse = await sendResumeToWhatsApp(tenDigitPhone, pdfUrl, resume.jobTitle || 'Resume');
        
        if (whatsappResponse.success) {
          // Update the resume with PDF URL
          await Student.findOneAndUpdate(
            { userId, 'aiResumeHistory.id': resumeId },
            { $set: { 'aiResumeHistory.$.pdfUrl': pdfUrl } }
          );

          return res.json({
            success: true,
            message: 'Resume sent to your WhatsApp successfully!',
            data: {
              phoneNumber: tenDigitPhone,
              pdfUrl,
              fileName: `${student.firstName}_${student.lastName}_Resume_${Date.now()}.pdf`,
              whatsappResponse
            }
          });
        } else {
          // Fallback to text message with download link
          const message = `🎉 *Your AI-Generated Resume is Ready!*\n\n📄 *Job Title:* ${resume.jobTitle || 'Professional Resume'}\n📅 *Generated:* ${new Date().toLocaleDateString()}\n\n📥 *Download Link:* ${pdfUrl}\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
          
          await sendWhatsAppMessage(tenDigitPhone, message);
          
          return res.json({
            success: true,
            message: 'Resume download link sent to your WhatsApp!',
            data: {
              phoneNumber: tenDigitPhone,
              pdfUrl,
              sentAsLink: true
            }
          });
        }
      } else {
        // Send simple message if PDF generation fails
        const message = `🎉 *Your AI-Generated Resume is Ready!*\n\n📄 *Job Title:* ${resume.jobTitle || 'Professional Resume'}\n📅 *Generated:* ${new Date().toLocaleDateString()}\n\n📥 *Download:* Please visit your CampusPe dashboard to download your resume.\n\n💼 Best of luck with your application!\n\n🔗 CampusPe.com`;
        
        await sendWhatsAppMessage(tenDigitPhone, message);
        
        return res.json({
          success: true,
          message: 'Resume notification sent to your WhatsApp!',
          data: {
            phoneNumber: tenDigitPhone,
            sentAsNotification: true
          }
        });
      }
    } catch (whatsappError: any) {
      console.error('WhatsApp sending failed:', whatsappError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send resume to WhatsApp. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? whatsappError?.message : undefined
      });
    }

  } catch (error: any) {
    console.error('Error sending resume to WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send resume to WhatsApp',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PDF Download Endpoint
router.post('/download-pdf', auth, async (req, res) => {
  try {
    const { resume, format = 'professional' } = req.body;

    if (!resume) {
      return res.status(400).json({
        success: false,
        message: 'Resume data is required'
      });
    }

    console.log('📄 Processing PDF download request...');
    console.log('📊 Resume data keys:', Object.keys(resume));

    // Convert frontend resume data to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: {
        firstName: resume.personalInfo?.firstName || resume.personalInfo?.name?.split(' ')[0] || 'Unknown',
        lastName: resume.personalInfo?.lastName || resume.personalInfo?.name?.split(' ').slice(1).join(' ') || 'User',
        email: resume.personalInfo?.email || 'user@example.com',
        phone: resume.personalInfo?.phone || 'N/A',
        location: resume.personalInfo?.location || '',
        linkedin: resume.personalInfo?.linkedin || '',
        github: resume.personalInfo?.github || ''
      },
      summary: resume.summary || 'Professional summary not available.',
      skills: (resume.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : (skill.name || 'Skill'),
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resume.experience || []).map((exp: any) => {
        // Parse duration to extract dates
        const duration = exp.duration || '';
        const isCurrentJob = duration.includes('Present') || duration.includes('Current');
        const currentYear = new Date().getFullYear();
        
        // Try to extract years from duration string
        const yearMatches = duration.match(/\d{4}/g);
        const startYear = yearMatches && yearMatches[0] ? parseInt(yearMatches[0]) : currentYear - 1;
        const endYear = isCurrentJob ? currentYear : (yearMatches && yearMatches[1] ? parseInt(yearMatches[1]) : currentYear);
        
        return {
          title: exp.title || 'Position',
          company: exp.company || 'Company',
          location: exp.location || '',
          startDate: new Date(startYear, 0, 1),
          endDate: isCurrentJob ? undefined : new Date(endYear, 11, 31),
          description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || 'Description not available.'),
          isCurrentJob: isCurrentJob
        };
      }),
      education: (resume.education || []).map((edu: any) => {
        // Parse degree to separate degree and field
        const degreeText = edu.degree || 'Degree';
        const degreeParts = degreeText.includes(' in ') ? degreeText.split(' in ') : [degreeText, 'Field'];
        const degree = degreeParts[0] || 'Degree';
        const field = degreeParts[1] || edu.field || 'Field of Study';
        
        // Parse year to determine completion status
        const year = edu.year || 'Unknown';
        const isCompleted = year !== 'In Progress' && year !== 'Current' && year !== 'Ongoing';
        const currentYear = new Date().getFullYear();
        const gradYear = year.match(/\d{4}/) ? parseInt(year.match(/\d{4}/)[0]) : currentYear;
        
        return {
          degree: degree,
          field: field,
          institution: edu.institution || 'Institution',
          startDate: new Date(gradYear - 4, 8, 1), // Assume 4-year program starting in September
          endDate: isCompleted ? new Date(gradYear, 4, 31) : undefined, // May graduation for completed
          isCompleted: isCompleted
        };
      }),
      projects: (resume.projects || []).map((project: any) => ({
        name: project.name || 'Project',
        description: project.description || 'Project description not available.',
        technologies: Array.isArray(project.technologies) ? project.technologies : []
      }))
    };

    console.log('✅ Resume data formatted for PDF generation');

    const resumeBuilder = ResumeBuilderService;
    
    // FIXED: Use structured PDF generation directly with the formatted data
    // This bypasses the HTML parsing issue and uses the actual user data
    console.log('🔄 Starting DIRECT PDF generation with structured data...');
    const pdfBuffer = await resumeBuilder.generateStructuredPDF(pdfCompatibleResume);
    console.log('✅ PDF generated successfully with actual user data');

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AI_Resume_${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('❌ Error generating PDF:', error);
    
    // Provide detailed error information for debugging
    const errorDetails = {
      message: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    console.error('📊 Error details:', errorDetails);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF. Please try again or contact support if the issue persists.',
      error: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
});

// Public PDF Download Endpoint (for WhatsApp sharing)
router.get('/download-pdf-public/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    // Find resume in database
    const student = await Student.findOne({ 
      'aiResumeHistory.id': resumeId 
    }, 'aiResumeHistory').lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const resume = student.aiResumeHistory?.find(r => r.id === resumeId);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Convert frontend resume data to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: resume.resumeData.personalInfo,
      summary: resume.resumeData.summary,
      skills: (resume.resumeData.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name,
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resume.resumeData.experience || []).map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location,
        startDate: new Date(),
        endDate: exp.duration?.includes('Present') ? undefined : new Date(),
        description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
        isCurrentJob: exp.duration?.includes('Present') || false
      })),
      education: (resume.resumeData.education || []).map((edu: any) => ({
        degree: edu.degree || 'Degree',
        field: 'Field',
        institution: edu.institution || 'Institution',
        startDate: new Date(),
        endDate: edu.year === 'In Progress' ? undefined : new Date(),
        isCompleted: edu.year !== 'In Progress'
      })),
      projects: resume.resumeData.projects || []
    };

    const resumeBuilder = ResumeBuilderService;
    
    // FIXED: Use structured PDF generation directly with the formatted data
    const pdfBuffer = await resumeBuilder.generateStructuredPDF(pdfCompatibleResume);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${resume.jobTitle || 'Resume'}_${resumeId}.pdf"`);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Error generating public PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to generate AI resume using Claude AI
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
    // Use Claude AI to generate job-focused resume content
    const aiService = aiResumeMatchingService;
    
    // Prepare user profile data for AI analysis
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

    // Generate AI-optimized resume content
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

    // Call Claude AI
    const aiResponse = await aiService.callClaudeAPI(aiPrompt);
    
    if (aiResponse && aiResponse.content) {
      try {
        // Parse AI response
        const aiContent = JSON.parse(aiResponse.content);
        
        // Create frontend-compatible data
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

        return frontendData;
      } catch (parseError) {
        console.log('Failed to parse AI response, using fallback');
      }
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
  // Extract key terms from job description
  const jobKeywords = extractKeywordsFromJob(jobDescription);
  
  // Generate job-focused summary
  const summary = generateJobFocusedSummary(jobDescription, studentProfile, jobKeywords);
  
  // Prioritize skills based on job relevance
  const skills = prioritizeSkillsForJob(studentProfile, jobKeywords);
  
  // Enhance experience descriptions for job relevance
  const experience = enhanceExperienceForJob(studentProfile?.experience || [], jobKeywords);
  
  // Process education (convert to expected structure)
  const education = (studentProfile?.education || []).map((edu: any) => ({
    degree: edu.degree || 'Degree',
    field: edu.field || 'Field',
    institution: edu.institution || 'Institution',
    startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
    endDate: edu.endDate && edu.isCompleted ? new Date(edu.endDate) : undefined,
    gpa: edu.gpa,
    isCompleted: edu.isCompleted !== false
  }));

  // Enhance projects for job relevance
  const projects = enhanceProjectsForJob(studentProfile?.projects || [], jobKeywords);

  return {
    personalInfo,
    summary,
    skills: skills.map((skill: any) => skill.name), // Convert to strings for frontend
    experience: experience.map((exp: any) => ({
      title: exp.title,
      company: exp.company,
      duration: exp.isCurrentJob ? 
        `${exp.startDate?.getFullYear() || ''} - Present` :
        `${exp.startDate?.getFullYear() || ''} - ${exp.endDate?.getFullYear() || 'Present'}`,
      description: [exp.description] // Convert to array for frontend
    })),
    education: education.map((edu: any) => ({
      degree: `${edu.degree} in ${edu.field}`,
      institution: edu.institution,
      year: edu.endDate ? edu.endDate.getFullYear().toString() : 
        (edu.isCompleted ? 'Completed' : 'In Progress')
    })),
    projects
  };
}

// Helper functions for enhanced fallback
function extractKeywordsFromJob(jobDescription: string): string[] {
  const commonTechTerms = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Git', 'API', 'REST', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Angular', 'Vue',
    'Express', 'Django', 'Flask', 'Spring', 'Kubernetes', 'CI/CD', 'Agile', 'Scrum'
  ];
  
  const keywords = commonTechTerms.filter(term => 
    jobDescription.toLowerCase().includes(term.toLowerCase())
  );
  
  // Add other relevant keywords from job description
  const words = jobDescription.toLowerCase().split(/\W+/);
  const additionalKeywords = words.filter(word => 
    word.length > 4 && 
    !['with', 'experience', 'required', 'preferred', 'knowledge'].includes(word)
  ).slice(0, 10);
  
  return [...keywords, ...additionalKeywords];
}

function generateJobFocusedSummary(jobDescription: string, studentProfile: any, keywords: string[]): string {
  const roleMatch = jobDescription.match(/(?:position|role|job):\s*([^.]+)/i);
  const role = roleMatch ? roleMatch[1].trim() : 'technical professional';
  
  const topSkills = keywords.slice(0, 3).join(', ');
  
  if (studentProfile?.experience?.length > 0) {
    return `Results-driven professional with experience in ${topSkills} seeking to leverage expertise in a ${role} role. Proven track record of delivering technical solutions and contributing to team success with strong problem-solving abilities and commitment to excellence.`;
  } else {
    return `Motivated ${role} with strong foundation in ${topSkills}. Eager to apply technical skills and fresh perspective to drive innovation and contribute to organizational goals through dedicated effort and continuous learning.`;
  }
}

function prioritizeSkillsForJob(studentProfile: any, jobKeywords: string[]): any[] {
  const allSkills = [
    ...(studentProfile?.skills?.map((skill: any) => skill.name) || []),
    ...(studentProfile?.resumeAnalysis?.skills || [])
  ];
  
  const uniqueSkills = [...new Set(allSkills)];
  
  // Prioritize skills that match job keywords
  const jobRelevantSkills = uniqueSkills.filter(skill =>
    jobKeywords.some(keyword => 
      skill.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  const otherSkills = uniqueSkills.filter(skill => !jobRelevantSkills.includes(skill));
  
  // Return skills in the expected object format
  return [...jobRelevantSkills, ...otherSkills].slice(0, 12).map((skill: string) => ({
    name: skill,
    level: 'intermediate',
    category: 'technical'
  }));
}

function enhanceExperienceForJob(experience: any[], jobKeywords: string[]): any[] {
  return experience.map((exp: any) => {
    let description = exp.description || [`Contributed to ${exp.company} operations and team objectives`];
    
    // Ensure description is always an array for processing
    if (typeof description === 'string') {
      description = [description];
    } else if (!Array.isArray(description)) {
      description = [`Contributed to ${exp.company} operations and team objectives`];
    }
    
    // Enhance descriptions with job-relevant keywords
    const enhancedDescription = description.map((desc: string) => {
      if (jobKeywords.length > 0) {
        const relevantKeywords = jobKeywords.slice(0, 2);
        return `${desc} Utilized ${relevantKeywords.join(' and ')} to drive technical excellence and project success.`;
      }
      return desc;
    });
    
    return {
      title: exp.title,
      company: exp.company,
      location: exp.location,
      startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
      endDate: exp.endDate && !exp.isCurrentJob ? new Date(exp.endDate) : undefined,
      description: enhancedDescription.join('. '), // Convert to string
      isCurrentJob: exp.isCurrentJob || false
    };
  });
}

function enhanceProjectsForJob(projects: any[], jobKeywords: string[]): any[] {
  return projects.slice(0, 3).map((project: any) => {
    const baseDescription = project.description || `${project.name} project showcasing technical skills and problem-solving abilities`;
    
    // Add job-relevant context to project descriptions
    const relevantTech = jobKeywords.filter(keyword => 
      project.technologies?.some((tech: string) => 
        tech.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    const enhancedDescription = relevantTech.length > 0 ?
      `${baseDescription} Leveraged ${relevantTech.join(', ')} to deliver scalable solutions and meet project objectives.` :
      baseDescription;
    
    return {
      name: project.name,
      description: enhancedDescription,
      technologies: project.technologies || []
    };
  });
}

// Public PDF Download Endpoint (for WhatsApp sharing)
// Helper function to extract job title from job description
function extractJobTitleFromDescription(jobDescription: string): string {
  const lines = jobDescription.split('\n');
  const firstLine = lines[0].trim();
  
  // Look for common patterns
  const titlePatterns = [
    /^(.*?)\s*-\s*job/i,
    /^position:\s*(.*?)$/i,
    /^role:\s*(.*?)$/i,
    /^title:\s*(.*?)$/i,
    /^job title:\s*(.*?)$/i,
    /^(.*?)\s*position/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = firstLine.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If no pattern matches, take first line if it looks like a title (under 100 chars)
  if (firstLine.length < 100 && !firstLine.toLowerCase().includes('company') && !firstLine.toLowerCase().includes('location')) {
    return firstLine;
  }
  
  return 'Job Position';
}

// Helper function to generate PDF URL for a resume
async function generateResumePdfUrl(resumeData: any, resumeId: string): Promise<string | null> {
  try {
    // Convert frontend resume data to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: resumeData.personalInfo,
      summary: resumeData.summary,
      skills: (resumeData.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name,
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resumeData.experience || []).map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location,
        startDate: new Date(),
        endDate: exp.duration?.includes('Present') ? undefined : new Date(),
        description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
        isCurrentJob: exp.duration?.includes('Present') || false
      })),
      education: (resumeData.education || []).map((edu: any) => ({
        degree: edu.degree || 'Degree',
        field: 'Field',
        institution: edu.institution || 'Institution',
        startDate: new Date(),
        endDate: edu.year === 'In Progress' ? undefined : new Date(),
        isCompleted: edu.year !== 'In Progress'
      })),
      projects: resumeData.projects || []
    };

    const resumeBuilder = ResumeBuilderService;
    
    // Generate HTML from resume data
    const htmlContent = resumeBuilder.generateResumeHTML(pdfCompatibleResume);
    const pdfBuffer = await resumeBuilder.generatePDF(htmlContent);

    // For now, we'll create a data URL. In production, you'd upload to cloud storage
    const base64Pdf = pdfBuffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
    
    // TODO: In production, upload to AWS S3/CloudFront or similar and return public URL
    // For demo purposes, we'll return a placeholder URL
    return `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/ai-resume/download-pdf-public/${resumeId}`;
    
  } catch (error) {
    console.error('Error generating PDF URL:', error);
    return null;
  }
}

// Helper function to send resume to WhatsApp via Wabb
async function sendResumeToWhatsApp(phoneNumber: string, pdfUrl: string, jobTitle: string): Promise<any> {
  try {
    // Use environment variable for resume webhook URL
    const wabbWebhookUrl = process.env.WABB_WEBHOOK_URL_RESUME || process.env.WABB_WEBHOOK_URL || 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
    
    const payload = {
      number: phoneNumber,
      document: pdfUrl // Document URL for Wabb
    };

    console.log('Sending resume to Wabb:', payload);
    console.log('Using webhook URL:', wabbWebhookUrl);

    const response = await axios.post(wabbWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return {
      success: true,
      data: response.data,
      status: response.status
    };

  } catch (error: any) {
    console.error('Error sending resume to WhatsApp:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
}

// Debug endpoint for no-auth AI resume generation (for WABB)
router.post('/debug-no-auth', async (req, res) => {
  try {
    console.log('=== DEBUG NO-AUTH AI RESUME GENERATION ===');
    
    const { email, jobDescription } = req.body;
    
    if (!email || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email and job description are required'
      });
    }
    
    console.log('Email:', email);
    console.log('Job Description length:', jobDescription.length);
    
    // Find user and student profile
    let studentProfile = null;
    try {
      const { User } = require('../models/User');
      const user = await User.findOne({ email });
      if (user) {
        studentProfile = await Student.findOne({ userId: user._id }).lean();
      }
    } catch (error) {
      console.log('Could not fetch student profile:', error);
    }

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please complete your CampusPe profile first.'
      });
    }

    console.log('Found student:', studentProfile._id);

    // Create resume data using existing profile and job analysis
    const resumeData = await generateAIResume({
      email,
      phone: studentProfile.phoneNumber || '0000000000',
      jobDescription,
      studentProfile
    });

    console.log('✅ AI resume generated successfully');

    res.json({
      success: true,
      message: 'AI resume generated successfully',
      data: resumeData
    });

  } catch (error: any) {
    console.error('❌ Debug no-auth AI resume generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'AI resume generation failed',
      error: error.message
    });
  }
});

// Save resume endpoint (no auth for WABB)
router.post('/save-resume', async (req, res) => {
  try {
    const { resumeData, jobDescription, email } = req.body;
    
    if (!resumeData || !jobDescription || !email) {
      return res.status(400).json({
        success: false,
        message: 'Resume data, job description, and email are required'
      });
    }

    // Find student profile
    let studentProfile = null;
    try {
      const { User } = require('../models/User');
      const user = await User.findOne({ email });
      if (user) {
        studentProfile = await Student.findOne({ userId: user._id }).lean();
      }
    } catch (error) {
      console.log('Could not fetch student profile:', error);
    }

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Convert to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: resumeData.personalInfo,
      summary: resumeData.summary,
      skills: (resumeData.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name || skill,
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resumeData.experience || []).map((exp: any) => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 1;
        const endYear = exp.duration && exp.duration.includes('Present') ? null : currentYear;
        
        return {
          title: exp.title || 'Position',
          company: exp.company || 'Company',
          location: '',
          startDate: new Date(startYear, 0, 1),
          endDate: endYear ? new Date(endYear, 11, 31) : null,
          description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
          responsibilities: Array.isArray(exp.description) ? exp.description : [exp.description || ''],
          current: !endYear
        };
      }),
      education: (resumeData.education || []).map((edu: any) => {
        const year = parseInt(edu.year) || new Date().getFullYear();
        return {
          degree: edu.degree || 'Degree',
          institution: edu.institution || 'Institution',
          year: edu.year || 'Year',
          startDate: new Date(year - 4, 0, 1),
          endDate: new Date(year, 11, 31)
        };
      }),
      projects: (resumeData.projects || []).map((project: any) => ({
        name: project.name || 'Project',
        description: project.description || 'Project description not available.',
        technologies: Array.isArray(project.technologies) ? project.technologies : [],
        startDate: new Date(2023, 0, 1),
        endDate: new Date(2023, 11, 31)
      }))
    };

    // Generate PDF
    const htmlContent = ResumeBuilderService.generateResumeHTML(pdfCompatibleResume);
    const pdfBuffer = await ResumeBuilderService.generatePDF(htmlContent);

    // Extract job title
    const jobTitle = 'AI Generated Resume';
    
    // Generate filename
    const fileName = `${resumeData.personalInfo.name || 'Resume'}_${jobTitle}_${Date.now()}.pdf`;

    // Create the resume in GeneratedResume collection
    const generatedResume = await GeneratedResumeService.createGeneratedResume({
      studentId: studentProfile._id.toString(),
      jobTitle,
      jobDescription,
      resumeData: pdfCompatibleResume,
      fileName,
      pdfBuffer,
      matchScore: 85,
      aiEnhancementUsed: true,
      matchedSkills: [],
      missingSkills: [],
      suggestions: [],
      generationType: 'ai'
    });

    console.log('✅ Resume saved with ID:', generatedResume.resumeId);

    res.json({
      success: true,
      message: 'Resume saved successfully',
      resumeId: generatedResume.resumeId,
      fileName: fileName
    });

  } catch (error: any) {
    console.error('❌ Save resume failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save resume',
      error: error.message
    });
  }
});

// Send to WhatsApp endpoint (no auth for WABB)
router.post('/send-to-whatsapp', async (req, res) => {
  try {
    const { resumeId, phoneNumber, jobTitle } = req.body;
    
    if (!resumeId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Resume ID and phone number are required'
      });
    }

    // Generate PDF URL for this resume
    const pdfUrl = await generateResumePdfUrl({}, resumeId);
    
    if (!pdfUrl) {
      return res.status(404).json({
        success: false,
        message: 'Failed to generate PDF URL'
      });
    }
    
    const whatsappResponse = await sendResumeToWhatsApp(phoneNumber, pdfUrl, jobTitle || 'Resume');
    
    res.json({
      success: whatsappResponse.success,
      message: whatsappResponse.message,
      pdfUrl: pdfUrl
    });

  } catch (error: any) {
    console.error('❌ Send to WhatsApp failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send to WhatsApp',
      error: error.message
    });
  }
});

// Test endpoint for debugging (no auth required)
router.post('/test-generate', async (req, res) => {
  try {
    console.log('🧪 Test resume generation endpoint');
    
    const { email, phone, jobDescription } = req.body;
    
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    console.log(`🧪 Test generation for ${email} (${phone})`);
    
    // Use the WABB resume creation service which doesn't require auth
    const result = await ResumeBuilderService.createTailoredResume(
      email,
      phone,
      jobDescription
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test resume generated successfully',
        data: {
          resumeId: result.resumeId,
          fileName: result.fileName,
          downloadUrl: result.downloadUrl,
          pdfSize: result.pdfBuffer?.length
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
  } catch (error: any) {
    console.error('❌ Test generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test generation failed',
      error: error.message
    });
  }
});

export default router;
