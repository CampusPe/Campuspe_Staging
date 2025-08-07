import express from 'express';
import auth from '../middleware/auth';
import { Student } from '../models/Student';
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
    const userId = req.user.id;

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

    // Store the generated resume in the new GeneratedResume collection
    if (studentProfile) {
      try {
        console.log('=== SAVING RESUME TO NEW COLLECTION ===');
        console.log('Student ID:', studentProfile._id);

        // First generate the PDF to get the buffer
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

        const htmlContent = ResumeBuilderService.generateResumeHTML(pdfCompatibleResume);
        const pdfBuffer = await ResumeBuilderService.generatePDF(htmlContent);

        // Extract job title from description
        const jobTitle = extractJobTitleFromDescription(jobDescription);
        
        // Generate filename
        const fileName = `${resumeData.personalInfo.name || 'Resume'}_${jobTitle || 'AI_Generated'}_${Date.now()}.pdf`;

        // Create the resume in GeneratedResume collection
        const generatedResume = await GeneratedResumeService.createGeneratedResume({
          studentId: studentProfile._id.toString(),
          jobTitle,
          jobDescription,
          resumeData: pdfCompatibleResume,
          fileName,
          pdfBuffer,
          matchScore: 85, // Default score, can be enhanced with actual AI matching
          aiEnhancementUsed: true,
          matchedSkills: [], // Can be enhanced with actual skill matching
          missingSkills: [],
          suggestions: [],
          generationType: 'ai'
        });

        generatedResumeId = generatedResume.resumeId;
        historySaved = true;
        
        console.log('✅ Resume saved to GeneratedResume collection:', generatedResumeId);

      } catch (error) {
        console.error('❌ ERROR saving resume to new collection:', error);
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
    const userId = req.user.id;
    
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
    const userId = req.user.id;

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

    // Convert frontend resume data to PDF-compatible format
    const pdfCompatibleResume = {
      personalInfo: resume.personalInfo,
      summary: resume.summary,
      skills: (resume.skills || []).map((skill: any) => ({
        name: typeof skill === 'string' ? skill : skill.name,
        level: 'intermediate',
        category: 'technical'
      })),
      experience: (resume.experience || []).map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location,
        startDate: new Date(),
        endDate: exp.duration?.includes('Present') ? undefined : new Date(),
        description: Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || ''),
        isCurrentJob: exp.duration?.includes('Present') || false
      })),
      education: (resume.education || []).map((edu: any) => ({
        degree: edu.degree || 'Degree',
        field: 'Field',
        institution: edu.institution || 'Institution',
        startDate: new Date(),
        endDate: edu.year === 'In Progress' ? undefined : new Date(),
        isCompleted: edu.year !== 'In Progress'
      })),
      projects: resume.projects || []
    };

    const resumeBuilder = ResumeBuilderService;
    
    // Generate HTML from resume data
    const htmlContent = resumeBuilder.generateResumeHTML(pdfCompatibleResume);
    const pdfBuffer = await resumeBuilder.generatePDF(htmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AI_Resume_${Date.now()}.pdf"`);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    // Generate HTML from resume data
    const htmlContent = resumeBuilder.generateResumeHTML(pdfCompatibleResume);
    const pdfBuffer = await resumeBuilder.generatePDF(htmlContent);

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
    
    // Generate HTML from resume data
    const htmlContent = resumeBuilder.generateResumeHTML(pdfCompatibleResume);
    const pdfBuffer = await resumeBuilder.generatePDF(htmlContent);

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
    return `${process.env.BASE_URL || 'http://localhost:5001'}/api/ai-resume/download-pdf-public/${resumeId}`;
    
  } catch (error) {
    console.error('Error generating PDF URL:', error);
    return null;
  }
}

// Helper function to send resume to WhatsApp via Wabb
async function sendResumeToWhatsApp(phoneNumber: string, pdfUrl: string, jobTitle: string): Promise<any> {
  try {
    const wabbWebhookUrl = 'https://api.wabb.in/api/v1/webhooks-automation/catch/220/ORlQYXvg8qk9/';
    
    const payload = {
      number: phoneNumber,
      document: pdfUrl // Document URL for Wabb
    };

    console.log('Sending to Wabb:', payload);

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
    console.error('Error sending to WhatsApp:', error);
    return {
      success: false,
      error: error?.message || 'Unknown error'
    };
  }
}

export default router;
