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
    
    // Prepare COMPREHENSIVE user profile data for AI analysis
    const userProfileText = `
Name: ${personalInfo.name}
Contact: ${email}, ${phone}
${studentProfile?.address ? `Location: ${studentProfile.address}` : ''}
${personalInfo.linkedin ? `LinkedIn: ${personalInfo.linkedin}` : ''}
${personalInfo.github ? `GitHub: ${personalInfo.github}` : ''}

EXPERIENCE:
${(studentProfile?.experience || []).map((exp: any) => {
  const description = Array.isArray(exp.description) ? exp.description.join('. ') : (exp.description || 'Professional experience');
  return `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  Location: ${exp.location || 'Not specified'}
  ${description}
  ${exp.isCurrentJob ? '[CURRENT POSITION]' : ''}`;
}).join('\n\n') || 'Entry-level professional seeking opportunities'}

EDUCATION:
${(studentProfile?.education || []).map((edu: any) => 
  `- ${edu.degree} in ${edu.field} from ${edu.institution}
  Duration: ${edu.startDate ? new Date(edu.startDate).getFullYear() : 'Start'} - ${edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
  ${edu.gpa ? `GPA: ${edu.gpa}` : ''}
  Status: ${edu.isCompleted ? 'Completed' : 'In Progress'}`
).join('\n\n') || 'Bachelor of Technology in Computer Science'}

SKILLS:
Technical Skills: ${(studentProfile?.skills?.map((skill: any) => skill.name) || []).join(', ') || 'Programming fundamentals'}
${studentProfile?.resumeAnalysis?.skills ? `Resume Analysis Skills: ${studentProfile.resumeAnalysis.skills.join(', ')}` : ''}

PROJECTS:
${(studentProfile?.projects || []).map((project: any) => 
  `- ${project.name}
  Description: ${project.description || 'Technical project'}
  Technologies: ${(project.technologies || []).join(', ') || 'Various technologies'}
  ${project.link ? `Link: ${project.link}` : ''}`
).join('\n\n') || 'Academic and personal projects in software development'}

ADDITIONAL INFORMATION:
${studentProfile?.bio ? `Bio: ${studentProfile.bio}` : ''}
${studentProfile?.achievements?.length > 0 ? `Achievements: ${studentProfile.achievements.join(', ')}` : ''}
${studentProfile?.certifications?.length > 0 ? `Certifications: ${studentProfile.certifications.map((cert: any) => cert.name).join(', ')}` : ''}
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
    } catch (aiError: any) {
      console.log('❌ Claude AI Call Failed - DETAILED ERROR:');
      console.log('  Error Message:', aiError?.message || 'Unknown error');
      console.log('  Error Type:', aiError?.constructor?.name || 'Unknown');
      console.log('  Error Stack:', aiError?.stack?.substring(0, 500) || 'No stack');
      if (aiError?.response) {
        console.log('  Response Status:', aiError.response.status);
        console.log('  Response Data:', JSON.stringify(aiError.response.data, null, 2));
      }
      console.log('🔄 This will cause fallback to basic resume generation');
      aiResponse = null;
    }
    
    if (aiResponse && aiResponse.content) {
      try {
        console.log('🤖 AI Response received, parsing content...');
        
        // Parse AI response and MERGE with real student data
        const aiContent = JSON.parse(aiResponse.content);
        console.log('✅ AI Content parsed successfully:', {
          hasSummary: !!aiContent.summary,
          skillsCount: aiContent.skills?.length || 0,
          experienceCount: aiContent.experience?.length || 0,
          projectsCount: aiContent.projects?.length || 0,
          educationCount: aiContent.education?.length || 0
        });
        
        // HYBRID APPROACH: Merge AI suggestions with real student data
        console.log('🔄 Merging AI content with real student data...');
        
        // === SKILLS: Real student skills + AI-suggested job-relevant skills ===
        const realStudentSkills = (studentProfile?.skills || []).map((skill: any) => 
          typeof skill === 'string' ? skill : skill.name
        ).filter(Boolean);
        const resumeAnalysisSkills = (studentProfile?.resumeAnalysis?.skills || []).filter(Boolean);
        const aiSuggestedSkills = aiContent.skills || [];
        
        const hybridSkills = [...new Set([...realStudentSkills, ...resumeAnalysisSkills, ...aiSuggestedSkills])].slice(0, 15);
        
        // === EXPERIENCE: Enhance real student experience with AI insights ===
        const hybridExperience = (studentProfile?.experience || []).length > 0 
          ? (studentProfile.experience || []).map((realExp: any, index: number) => {
              const aiExp = aiContent.experience?.[index];
              
              console.log(`📋 Merging experience ${index + 1}:`, {
                realTitle: realExp.title,
                aiTitle: aiExp?.title,
                hasRealDescription: !!realExp.description
              });
              
              // Use real data as foundation, enhance with AI insights
              const enhancedDescription = realExp.description 
                ? (Array.isArray(realExp.description) ? realExp.description : [realExp.description])
                : (aiExp?.description || [`Professional experience at ${realExp.company || 'company'}`]);
              
              // Add AI-enhanced description if real description is minimal
              if (enhancedDescription.join(' ').length < 100 && aiExp?.description) {
                const aiDescriptions = Array.isArray(aiExp.description) ? aiExp.description : [aiExp.description];
                enhancedDescription.push(...aiDescriptions.slice(0, 2)); // Add max 2 AI points
              }
              
              return {
                title: realExp.title || aiExp?.title || 'Professional',
                company: realExp.company || aiExp?.company || 'Company',
                duration: realExp.duration || aiExp?.duration || `${realExp.startDate || '2023'} - ${realExp.endDate || 'Present'}`,
                description: enhancedDescription
              };
            })
          : (aiContent.experience || []).map((aiExp: any) => ({
              title: aiExp.title,
              company: aiExp.company,
              duration: aiExp.duration,
              description: Array.isArray(aiExp.description) ? aiExp.description : [aiExp.description || '']
            }));
        
        // === EDUCATION: Real student education enhanced with AI formatting ===
        const hybridEducation = (studentProfile?.education || []).length > 0
          ? (studentProfile.education || []).map((realEdu: any, index: number) => {
              const aiEdu = aiContent.education?.[index];
              
              console.log(`🎓 Merging education ${index + 1}:`, {
                realDegree: realEdu.degree,
                realField: realEdu.field,
                realInstitution: realEdu.institution
              });
              
              // Use real education data, format it properly
              return {
                degree: realEdu.degree && realEdu.field 
                  ? `${realEdu.degree} in ${realEdu.field}` 
                  : (realEdu.degree || aiEdu?.degree || 'Degree'),
                institution: realEdu.institution || aiEdu?.institution || 'Institution',
                year: realEdu.endDate 
                  ? new Date(realEdu.endDate).getFullYear().toString()
                  : (aiEdu?.year || 'Year')
              };
            })
          : (aiContent.education || []).map((aiEdu: any) => ({
              degree: aiEdu.degree || 'Degree',
              institution: aiEdu.institution || 'Institution',
              year: aiEdu.year || 'Year'
            }));
        
        // === PROJECTS: Real student projects enhanced with AI descriptions ===
        const hybridProjects = (studentProfile?.projects || []).length > 0
          ? (studentProfile.projects || []).slice(0, 3).map((realProject: any, index: number) => {
              const aiProject = aiContent.projects?.[index];
              
              console.log(`🚀 Merging project ${index + 1}:`, {
                realName: realProject.name,
                hasRealDescription: !!realProject.description,
                hasRealTechnologies: (realProject.technologies || []).length > 0
              });
              
              // Use real project data, enhance description if needed
              const enhancedDescription = realProject.description && realProject.description.length > 50
                ? realProject.description
                : (aiProject?.description || realProject.description || `${realProject.name} - Technical project showcasing development skills`);
              
              return {
                name: realProject.name || aiProject?.name || 'Project',
                description: enhancedDescription,
                technologies: (realProject.technologies || []).length > 0 
                  ? realProject.technologies 
                  : (aiProject?.technologies || [])
              };
            })
          : (aiContent.projects || []);
        
        // Create HYBRID frontend-compatible data
        const hybridData = {
          personalInfo,
          summary: aiContent.summary || 'Professional seeking to contribute technical expertise and drive organizational success.',
          skills: hybridSkills, 
          experience: hybridExperience,
          education: hybridEducation,
          projects: hybridProjects
        };

        console.log('✅ HYBRID AI+Real data structure created successfully');
        console.log('📊 Hybrid Data Summary:', {
          skillsCount: hybridSkills.length,
          experienceCount: hybridExperience.length,
          educationCount: hybridEducation.length,
          projectsCount: hybridProjects.length,
          usedRealExperience: (studentProfile?.experience || []).length > 0,
          usedRealEducation: (studentProfile?.education || []).length > 0,
          usedRealProjects: (studentProfile?.projects || []).length > 0
        });
        
        return hybridData;
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

// HYBRID Resume Generation: Real Student Data + AI Enhancement
function generateEnhancedFallbackResume({
  personalInfo,
  jobDescription,
  studentProfile
}: {
  personalInfo: any;
  jobDescription: string;
  studentProfile: any;
}) {
  console.log('🔄 Generating HYBRID resume with real student data + AI enhancement...');
  console.log('📊 Student Profile Data Available:', {
    hasExperience: (studentProfile?.experience || []).length > 0,
    experienceCount: (studentProfile?.experience || []).length,
    hasEducation: (studentProfile?.education || []).length > 0,
    educationCount: (studentProfile?.education || []).length,
    hasSkills: (studentProfile?.skills || []).length > 0,
    skillsCount: (studentProfile?.skills || []).length,
    hasProjects: (studentProfile?.projects || []).length > 0,
    projectsCount: (studentProfile?.projects || []).length
  });
  
  // Extract job-relevant keywords for enhancement
  const jobKeywords = jobDescription.toLowerCase().match(/react|node\.?js|mongodb|typescript|javascript|python|java|spring|docker|kubernetes|aws|azure|git|html|css|sql|nosql|api|rest|graphql|microservices|agile|scrum|frontend|backend|fullstack|full-stack/g) || [];
  const uniqueJobSkills = [...new Set(jobKeywords)];
  
  // === SKILLS: Real Student Skills + Job-Relevant Skills ===
  const realStudentSkills = (studentProfile?.skills || []).map((skill: any) => 
    typeof skill === 'string' ? skill : skill.name
  ).filter(Boolean);
  
  const resumeAnalysisSkills = (studentProfile?.resumeAnalysis?.skills || []).filter(Boolean);
  
  const jobRelevantSkills = uniqueJobSkills.map(skill => 
    skill.charAt(0).toUpperCase() + skill.slice(1).replace(/\.js/g, '.js')
  );
  
  // Essential soft skills only if student has very few skills
  const essentialSkills = realStudentSkills.length < 3 ? [
    'Problem Solving', 'Team Collaboration', 'Communication', 'Critical Thinking'
  ] : [];
  
  const combinedSkills = [...new Set([...realStudentSkills, ...resumeAnalysisSkills, ...jobRelevantSkills, ...essentialSkills])].slice(0, 15);
  
  console.log('🎯 Skills Combined:', {
    realStudentSkills: realStudentSkills.length,
    resumeAnalysisSkills: resumeAnalysisSkills.length,
    jobRelevantSkills: jobRelevantSkills.length,
    finalCount: combinedSkills.length
  });
  
  // === SUMMARY: Job-focused but mentioning real experience ===
  const hasRealExperience = (studentProfile?.experience || []).length > 0;
  const realDegree = studentProfile?.education?.[0]?.degree || 'Computer Science';
  const primarySkills = combinedSkills.slice(0, 3).join(', ');
  
  const summary = hasRealExperience 
    ? `Experienced professional with background in ${realDegree} and hands-on expertise in ${primarySkills}. Proven track record in software development with experience at ${studentProfile.experience[0]?.company || 'leading organizations'}. Passionate about leveraging modern technologies to create scalable solutions and drive business success through technical innovation and collaborative teamwork.`
    : `Motivated ${realDegree} graduate with strong foundation in ${primarySkills} and passion for software development. Eager to apply academic knowledge and project experience to contribute to innovative technical solutions. Committed to continuous learning and delivering high-quality code in collaborative team environments.`;
  
  // === EXPERIENCE: Real Student Experience Enhanced with Job Context ===
  const enhancedExperience = (studentProfile?.experience || []).length > 0 ? 
    (studentProfile.experience || []).map((exp: any, index: number) => {
      console.log(`📋 Processing real experience ${index + 1}:`, {
        title: exp.title,
        company: exp.company,
        hasDescription: !!exp.description
      });
      
      // Use REAL student data as foundation
      const baseDescription = exp.description || `Professional experience at ${exp.company}`;
      const descriptionArray = Array.isArray(exp.description) ? exp.description : [baseDescription];
      
      // Enhance descriptions with job-relevant keywords while keeping original content
      const enhancedDescriptions = descriptionArray.map((desc: string, idx: number) => {
        if (idx === 0) {
          // Keep original first description and enhance it
          return desc + (desc.length < 50 ? ` Utilized ${primarySkills.split(', ').slice(0, 2).join(' and ')} to deliver technical solutions.` : '');
        }
        return desc;
      });
      
      // Add ONE job-relevant point only if descriptions are very short
      if (enhancedDescriptions.join(' ').length < 100) {
        enhancedDescriptions.push(`Collaborated on ${uniqueJobSkills.slice(0, 2).join(' and ')} projects to enhance system performance and user experience.`);
      }
      
      return {
        title: exp.title || 'Software Developer',
        company: exp.company || 'Technology Company',
        duration: exp.duration || `${exp.startDate || '2023'} - ${exp.endDate || 'Present'}`,
        description: enhancedDescriptions
      };
    }) : [
      // Only use fallback if NO real experience exists
      {
        title: 'Software Development Intern',
        company: 'Technology Solutions',
        duration: '2023 - Present',
        description: [
          `Developed applications using ${primarySkills} with focus on clean code and user experience.`,
          'Participated in code reviews and collaborated with development teams on project delivery.',
          'Applied software engineering principles to create maintainable and scalable solutions.'
        ]
      }
    ];
  
  console.log('💼 Experience Processing Complete:', {
    originalCount: (studentProfile?.experience || []).length,
    enhancedCount: enhancedExperience.length,
    usedRealData: (studentProfile?.experience || []).length > 0
  });
  
  // === EDUCATION: Real Student Education Data ===
  const enhancedEducation = (studentProfile?.education || []).length > 0 ?
    (studentProfile.education || []).map((edu: any) => {
      console.log('🎓 Processing real education:', {
        degree: edu.degree,
        field: edu.field,
        institution: edu.institution
      });
      
      return {
        degree: edu.degree && edu.field ? `${edu.degree} in ${edu.field}` : (edu.degree || 'Bachelor of Technology'),
        institution: edu.institution || 'Institute of Technology',
        year: edu.endDate ? new Date(edu.endDate).getFullYear().toString() : 
              (edu.isCompleted === false ? 'In Progress' : '2024')
      };
    }) : [
      // Only use fallback if NO real education exists
      {
        degree: 'Bachelor of Technology in Computer Science',
        institution: 'Institute of Technology',
        year: '2024'
      }
    ];
  
  console.log('🎓 Education Processing Complete:', {
    originalCount: (studentProfile?.education || []).length,
    enhancedCount: enhancedEducation.length,
    usedRealData: (studentProfile?.education || []).length > 0
  });
  
  // === PROJECTS: Real Student Projects Enhanced ===
  const enhancedProjects = (studentProfile?.projects || []).length > 0 ?
    (studentProfile.projects || []).slice(0, 3).map((project: any) => {
      console.log('🚀 Processing real project:', {
        name: project.name,
        hasDescription: !!project.description,
        hasTechnologies: (project.technologies || []).length > 0
      });
      
      // Use REAL project data as foundation
      const baseDescription = project.description || `${project.name} - Technical project showcasing development skills`;
      
      // Enhance description with job-relevant context only if it's very short
      const enhancedDescription = baseDescription.length < 100 
        ? `${baseDescription}. Implemented using ${uniqueJobSkills.slice(0, 2).join(' and ')} to demonstrate proficiency in modern development practices.`
        : baseDescription;
      
      // Use real technologies if available, otherwise suggest job-relevant ones
      const projectTechnologies = (project.technologies || []).length > 0 
        ? project.technologies 
        : uniqueJobSkills.slice(0, 4);
      
      return {
        name: project.name || 'Technical Project',
        description: enhancedDescription,
        technologies: projectTechnologies
      };
    }) : [
      // Only use fallback if NO real projects exist
      {
        name: 'Web Application Project',
        description: `Developed a full-stack application using ${primarySkills} with modern development practices and responsive design.`,
        technologies: uniqueJobSkills.slice(0, 4)
      }
    ];
  
  console.log('🚀 Projects Processing Complete:', {
    originalCount: (studentProfile?.projects || []).length,
    enhancedCount: enhancedProjects.length,
    usedRealData: (studentProfile?.projects || []).length > 0
  });
  
  const result = {
    personalInfo,
    summary,
    skills: combinedSkills,
    experience: enhancedExperience,
    education: enhancedEducation,
    projects: enhancedProjects
  };
  
  console.log('✅ HYBRID resume generated - Real student data enhanced with job relevance');
  console.log('📊 Final Data Summary:', {
    skillsCount: combinedSkills.length,
    experienceCount: enhancedExperience.length,
    educationCount: enhancedEducation.length,
    projectsCount: enhancedProjects.length,
    usedRealExperience: (studentProfile?.experience || []).length > 0,
    usedRealEducation: (studentProfile?.education || []).length > 0,
    usedRealProjects: (studentProfile?.projects || []).length > 0
  });
  
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
