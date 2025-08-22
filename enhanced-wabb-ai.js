// Enhanced WABB Complete endpoint with robust Claude AI handling
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const ResumeBuilderService = require('../services/ResumeBuilderService');
const aiResumeMatchingService = require('../services/ai-resume-matching');
const WABBService = require('../services/WABBService');
const GeneratedResumeService = require('../services/GeneratedResumeService');

// EXACT SAME AI Resume Generation as ai-resume-builder.ts
async function generateAIResumeRobust({
  email,
  phone,
  jobDescription,
  studentProfile
}) {
  console.log('\n=== ROBUST AI RESUME GENERATION START ===');
  
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

  // Enhanced fallback data with REAL content
  const enhancedFallbackData = {
    personalInfo,
    summary: generateJobFocusedSummary(jobDescription, studentProfile),
    skills: generateEnhancedSkills(studentProfile, jobDescription),
    experience: generateEnhancedExperience(studentProfile, jobDescription),
    education: generateEnhancedEducation(studentProfile),
    projects: generateEnhancedProjects(studentProfile, jobDescription)
  };

  try {
    console.log('🤖 Attempting Claude AI generation...');
    
    // Prepare comprehensive user profile for AI
    const userProfileText = createComprehensiveProfile(personalInfo, studentProfile);
    
    // Create enhanced AI prompt
    const aiPrompt = createEnhancedAIPrompt(jobDescription, userProfileText);
    
    console.log('Profile Length:', userProfileText.length);
    console.log('Prompt Length:', aiPrompt.length);
    
    // Attempt Claude AI call with timeout and retry
    const aiResponse = await callClaudeWithRetry(aiPrompt);
    
    if (aiResponse && aiResponse.content) {
      console.log('✅ Claude AI Success - Content Length:', aiResponse.content.length);
      
      try {
        const aiContent = JSON.parse(aiResponse.content);
        
        // Create comprehensive AI-enhanced data
        const aiEnhancedData = {
          personalInfo,
          summary: aiContent.summary || enhancedFallbackData.summary,
          skills: (aiContent.skills || enhancedFallbackData.skills).slice(0, 12),
          experience: (aiContent.experience || enhancedFallbackData.experience).map(exp => ({
            title: exp.title,
            company: exp.company,
            duration: exp.duration || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
            description: Array.isArray(exp.description) ? exp.description : [exp.description || '']
          })),
          education: (aiContent.education || enhancedFallbackData.education).map(edu => ({
            degree: edu.degree || 'Degree',
            institution: edu.institution || 'Institution',
            year: edu.year || 'Year'
          })),
          projects: (aiContent.projects || enhancedFallbackData.projects).slice(0, 3)
        };

        console.log('✅ AI Resume Generation Complete');
        console.log('Summary Length:', aiEnhancedData.summary.length);
        console.log('Skills Count:', aiEnhancedData.skills.length);
        console.log('Experience Count:', aiEnhancedData.experience.length);
        
        return aiEnhancedData;
        
      } catch (parseError) {
        console.log('⚠️ Claude response parsing failed, using enhanced fallback');
        console.log('Parse Error:', parseError.message);
      }
    } else {
      console.log('⚠️ No valid Claude response, using enhanced fallback');
    }
    
  } catch (aiError) {
    console.log('⚠️ Claude AI failed, using enhanced fallback');
    console.log('AI Error:', aiError.message);
  }

  console.log('🔄 Using Enhanced Fallback with Rich Content');
  return enhancedFallbackData;
}

// Enhanced helper functions for generating rich content
function generateJobFocusedSummary(jobDescription, studentProfile) {
  const keywords = extractJobKeywords(jobDescription);
  const topSkills = keywords.slice(0, 3).join(', ');
  
  if (studentProfile?.experience?.length > 0) {
    return `Results-driven professional with experience in ${topSkills} seeking to leverage expertise in technology solutions. Proven track record of delivering projects and contributing to team success with strong problem-solving abilities and commitment to excellence in software development and technical innovation.`;
  } else {
    return `Motivated technology professional with strong foundation in ${topSkills}. Eager to apply technical skills and fresh perspective to drive innovation and contribute to organizational goals through dedicated effort, continuous learning, and passion for software development and emerging technologies.`;
  }
}

function generateEnhancedSkills(studentProfile, jobDescription) {
  const baseSkills = [
    ...(studentProfile?.skills?.map(skill => skill.name) || []),
    ...(studentProfile?.resumeAnalysis?.skills || [])
  ];
  
  const jobKeywords = extractJobKeywords(jobDescription);
  const relevantSkills = [...new Set([...jobKeywords, ...baseSkills])];
  
  // Ensure we have comprehensive skills
  const defaultSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'HTML', 'CSS', 
    'Git', 'SQL', 'Problem Solving', 'Team Collaboration',
    'API Development', 'Database Management'
  ];
  
  const finalSkills = [...new Set([...relevantSkills, ...defaultSkills])];
  return finalSkills.slice(0, 12);
}

function generateEnhancedExperience(studentProfile, jobDescription) {
  const baseExperience = studentProfile?.experience || [];
  const keywords = extractJobKeywords(jobDescription);
  
  if (baseExperience.length > 0) {
    return baseExperience.map(exp => ({
      title: exp.title,
      company: exp.company,
      duration: `${exp.startDate || '2022'} - ${exp.endDate || 'Present'}`,
      description: [
        `${exp.description || 'Contributed to software development and technical initiatives'}`,
        `Utilized ${keywords.slice(0, 2).join(' and ')} to deliver high-quality solutions and drive project success.`,
        `Collaborated with cross-functional teams to implement innovative features and optimize system performance.`
      ]
    }));
  } else {
    // Generate meaningful default experience
    return [
      {
        title: 'Software Developer Intern',
        company: 'Technology Company',
        duration: '2023 - Present',
        description: [
          `Developed web applications using ${keywords.slice(0, 2).join(' and ')} technologies.`,
          'Collaborated with senior developers to implement new features and optimize existing systems.',
          'Participated in code reviews and contributed to improving development processes and best practices.'
        ]
      }
    ];
  }
}

function generateEnhancedEducation(studentProfile) {
  const baseEducation = studentProfile?.education || [];
  
  if (baseEducation.length > 0) {
    return baseEducation.map(edu => ({
      degree: `${edu.degree} in ${edu.field}`,
      institution: edu.institution,
      year: edu.endDate ? new Date(edu.endDate).getFullYear().toString() : 'In Progress'
    }));
  } else {
    return [
      {
        degree: 'Bachelor of Technology in Computer Science',
        institution: 'Technical University',
        year: '2024'
      }
    ];
  }
}

function generateEnhancedProjects(studentProfile, jobDescription) {
  const baseProjects = studentProfile?.projects || [];
  const keywords = extractJobKeywords(jobDescription);
  
  if (baseProjects.length > 0) {
    return baseProjects.slice(0, 3).map(project => ({
      name: project.name,
      description: `${project.description} Implemented using ${keywords.slice(0, 2).join(' and ')} to create scalable and efficient solutions.`,
      technologies: project.technologies || keywords.slice(0, 4)
    }));
  } else {
    return [
      {
        name: 'Full-Stack Web Application',
        description: `Developed a comprehensive web application using ${keywords.slice(0, 2).join(' and ')} with responsive design and modern architecture.`,
        technologies: keywords.slice(0, 4)
      },
      {
        name: 'API Development Project',
        description: 'Built RESTful APIs with database integration, authentication, and comprehensive testing suite.',
        technologies: ['Node.js', 'Express', 'MongoDB', 'JWT']
      }
    ];
  }
}

function extractJobKeywords(jobDescription) {
  const commonTechTerms = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Git', 'API', 'REST', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Angular', 'Vue',
    'Express', 'Django', 'Flask', 'Spring', 'Kubernetes', 'CI/CD', 'Agile', 'Scrum'
  ];
  
  return commonTechTerms.filter(term => 
    jobDescription.toLowerCase().includes(term.toLowerCase())
  ).slice(0, 8);
}

function createComprehensiveProfile(personalInfo, studentProfile) {
  return `
Name: ${personalInfo.name}
Contact: ${personalInfo.email}, ${personalInfo.phone}
${personalInfo.location ? `Location: ${personalInfo.location}` : ''}

EXPERIENCE:
${(studentProfile?.experience || []).map(exp => 
  `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${Array.isArray(exp.description) ? exp.description.join(', ') : (exp.description || 'Professional experience')}`
).join('\n') || 'Entry-level professional seeking opportunities'}

EDUCATION:
${(studentProfile?.education || []).map(edu => 
  `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.endDate || 'In Progress'})`
).join('\n') || 'Bachelor of Technology in Computer Science'}

SKILLS:
${[
  ...(studentProfile?.skills?.map(skill => skill.name) || []),
  ...(studentProfile?.resumeAnalysis?.skills || [])
].join(', ') || 'Programming, Web Development, Database Management'}

PROJECTS:
${(studentProfile?.projects || []).map(project => 
  `- ${project.name}: ${project.description || 'Technical project'}`
).join('\n') || 'Full-stack web applications and API development'}
  `.trim();
}

function createEnhancedAIPrompt(jobDescription, userProfileText) {
  return `
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
}

async function callClaudeWithRetry(prompt, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Claude API attempt ${attempt}/${maxRetries}`);
      
      const response = await aiResumeMatchingService.callClaudeAPI(prompt);
      
      if (response && response.content) {
        console.log(`✅ Claude API success on attempt ${attempt}`);
        return response;
      }
      
    } catch (error) {
      console.log(`❌ Claude API attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`💥 All Claude API attempts failed`);
        throw error;
      }
    }
  }
  
  return null;
}

module.exports = { generateAIResumeRobust };
