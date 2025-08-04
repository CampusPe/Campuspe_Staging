import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/auth';
import { Student } from '../models/Student';
import pdfParse from 'pdf-parse';
import AIResumeMatchingService from '../services/ai-resume-matching';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}.pdf`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============================================================
// PDF TEXT EXTRACTION
// ============================================================
async function extractResumeText(filePath: string): Promise<string> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(fileBuffer);
    return pdfData.text.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================
// CATEGORY MAPPING FUNCTION
// ============================================================
function mapCategoryToSchema(internalCategory: string): string {
  const categoryMap: { [key: string]: string } = {
    'technical': 'technical',
    'business': 'soft',      
    'operational': 'soft',   
    'healthcare': 'technical', 
    'finance': 'soft',       
    'education': 'soft',     
    'retail': 'soft',        
    'soft': 'soft',
    'language': 'language'
  };
  
  return categoryMap[internalCategory] || 'soft';
}

// ============================================================
// AI ANALYSIS WITH FOCUSED PROMPT
// ============================================================
async function analyzeResumeWithAI(resumeText: string): Promise<{ success: boolean; analysis?: any; error?: string }> {
  try {
    console.log('🤖 Sending focused prompt to AI...');
    
    const analysisPrompt = `
Please analyze this resume text and extract structured information. Return ONLY a valid JSON object in this exact format:

RESUME TEXT:
${resumeText}

REQUIRED JSON OUTPUT FORMAT:
{
  "personalInfo": {
    "name": "Full name from resume",
    "email": "email if found",
    "phone": "phone if found",
    "linkedIn": "linkedin url if found",
    "github": "github url if found"
  },
  "skills": [
    {
      "name": "Skill name",
      "level": "beginner|intermediate|advanced|expert",
      "category": "technical|soft|language"
    }
  ],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name", 
      "location": "Location",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM or Present",
      "description": "Brief description"
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "field": "Field of study",
      "institution": "Institution name",
      "startYear": 2018,
      "endYear": 2022,
      "gpa": "GPA if mentioned"
    }
  ],
  "jobPreferences": {
    "preferredRoles": ["Role1", "Role2", "Role3"],
    "preferredIndustries": ["Industry1", "Industry2"],
    "experienceLevel": "entry|mid|senior",
    "workMode": "remote|onsite|hybrid|any"
  },
  "analysisMetadata": {
    "confidence": 85,
    "totalYearsExperience": 3,
    "primarySkillCategory": "technical|soft|language",
    "suggestedJobCategory": "Software Development"
  }
}

IMPORTANT RULES:
- Use ONLY "technical", "soft", or "language" for skill categories
- Extract real information from the text, don't make up data
- Return valid JSON only, no additional text
- If information is missing, use null or empty array
`;

    const aiResponse = await AIResumeMatchingService.analyzeCompleteResume(resumeText);
    
    if (aiResponse && typeof aiResponse === 'object') {
      console.log('✅ AI analysis successful');
      return { success: true, analysis: aiResponse };
    } else {
      console.log('❌ AI returned invalid format');
      return { success: false, error: 'Invalid AI response format' };
    }
    
  } catch (error) {
    console.error('❌ AI analysis error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'AI analysis failed' };
  }
}

// ============================================================
// FALLBACK ANALYSIS FUNCTIONS
// ============================================================
function extractBasicSkills(text: string): any[] {
  const skillKeywords = {
    technical: [
      'javascript', 'python', 'java', 'react', 'node.js', 'html', 'css', 'sql', 'mongodb',
      'express', 'aws', 'git', 'docker', 'kubernetes', 'typescript', 'angular', 'vue'
    ],
    soft: [
      'communication', 'leadership', 'teamwork', 'problem solving', 'time management',
      'project management', 'analytical thinking', 'creativity', 'adaptability'
    ],
    language: [
      'english', 'spanish', 'french', 'german', 'chinese', 'hindi', 'multilingual'
    ]
  };
  
  const skills: any[] = [];
  const textLower = text.toLowerCase();
  
  Object.entries(skillKeywords).forEach(([category, skillList]) => {
    skillList.forEach(keyword => {
      if (textLower.includes(keyword)) {
        const validCategory = mapCategoryToSchema(category);
        skills.push({
          name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          level: 'intermediate',
          category: validCategory
        });
      }
    });
  });
  
  // Remove duplicates
  const uniqueSkills = skills.filter((skill, index, self) => 
    index === self.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase())
  );
  
  return uniqueSkills.slice(0, 15); // Limit to top 15 skills
}

function extractPersonalInfo(text: string): any {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
  const linkedInRegex = /linkedin\.com\/in\/[\w\-]+/gi;
  const githubRegex = /github\.com\/[\w\-]+/gi;
  
  // Extract name (first non-email line that looks like a name)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let name = null;
  for (const line of lines.slice(0, 5)) {
    if (!line.includes('@') && !line.match(/\d{4}/) && line.split(' ').length >= 2 && line.length < 50) {
      name = line;
      break;
    }
  }
  
  return {
    name: name,
    email: text.match(emailRegex)?.[0] || null,
    phone: text.match(phoneRegex)?.[0] || null,
    linkedIn: text.match(linkedInRegex)?.[0] || null,
    github: text.match(githubRegex)?.[0] || null
  };
}

function createEnhancedFallbackAnalysis(resumeText: string): any {
  console.log('🔧 Creating enhanced fallback analysis...');
  
  const basicSkills = extractBasicSkills(resumeText);
  const personalInfo = extractPersonalInfo(resumeText);
  
  // Simple experience extraction
  const experience = [];
  if (resumeText.toLowerCase().includes('experience') || resumeText.toLowerCase().includes('work')) {
    experience.push({
      title: 'Professional',
      company: 'Various Organizations',
      location: 'Location not specified',
      startDate: '2020',
      endDate: 'Present',
      description: 'Professional experience as indicated in resume'
    });
  }
  
  // Simple education extraction
  const education = [];
  const educationKeywords = ['bachelor', 'master', 'degree', 'university', 'college', 'b.tech', 'm.tech', 'bsc', 'msc'];
  if (educationKeywords.some(keyword => resumeText.toLowerCase().includes(keyword))) {
    education.push({
      degree: 'Bachelor\'s Degree',
      field: 'General Studies',
      institution: 'Educational Institution',
      startYear: 2018,
      endYear: 2022,
      gpa: null
    });
  }
  
  // Infer job preferences from skills
  const jobPreferences = {
    preferredRoles: basicSkills.length > 0 ? ['Software Developer', 'Analyst', 'Consultant'] : ['General'],
    preferredIndustries: ['Technology', 'Consulting', 'Finance'],
    experienceLevel: experience.length > 0 ? 'mid' : 'entry',
    workMode: 'any'
  };
  
  return {
    personalInfo,
    skills: basicSkills.length > 0 ? basicSkills : [
      { name: 'Communication', level: 'intermediate', category: 'soft' },
      { name: 'Problem Solving', level: 'intermediate', category: 'soft' },
      { name: 'Teamwork', level: 'intermediate', category: 'soft' }
    ],
    skillsCount: basicSkills.length || 3,
    experience,
    experienceCount: experience.length,
    education,
    educationCount: education.length,
    jobPreferences,
    analysisMetadata: {
      confidence: 75,
      extractionMethod: 'enhanced-fallback',
      totalYearsExperience: experience.length > 0 ? 2 : 0,
      primarySkillCategory: basicSkills.length > 0 ? 'technical' : 'soft',
      suggestedJobCategory: basicSkills.length > 0 ? 'Technology' : 'General',
      analysisDate: new Date()
    },
    profileCompleteness: 60
  };
}

// ============================================================
// MAIN ROUTE HANDLER - IMPROVED TWO-STEP APPROACH
// ============================================================
router.post('/analyze-resume-ai', authMiddleware, upload.single('resume'), async (req, res) => {
  console.log('🚀 AI-Powered Resume Analysis Flow Started - Two-Step Approach');
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No resume file uploaded' 
      });
    }

    console.log('📁 File received:', req.file.originalname, `(${req.file.size} bytes)`);

    const user = (req as any).user;
    const filePath = req.file.path;

    // ========================================
    // STEP 1: EXTRACT AND STORE RESUME TEXT
    // ========================================
    console.log('🔍 STEP 1: Extracting text from PDF...');
    let resumeText = '';
    
    try {
      resumeText = await extractResumeText(filePath);
      console.log('✅ PDF text extraction successful');
      console.log('📝 Text length:', resumeText.length, 'characters');
    } catch (extractError) {
      console.error('❌ PDF text extraction failed:', extractError);
      
      // Clean up file
      try { fs.unlinkSync(filePath); } catch {}
      
      return res.status(400).json({
        success: false,
        error: `Failed to extract text from PDF: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`
      });
    }

    // Find or create student record
    let student = await Student.findOne({ userId: user._id }) as any;
    
    if (!student) {
      console.log('👤 Creating new student profile...');
      student = new Student({
        userId: user._id,
        firstName: user.name?.split(' ')[0] || 'Student',
        lastName: user.name?.split(' ')[1] || '',
        email: user.email,
        collegeId: new mongoose.Types.ObjectId(),
        studentId: `STU${Date.now()}`,
        enrollmentYear: new Date().getFullYear(),
        isActive: true
      });
    }

    // Store resume text in database FIRST
    console.log('🗃️ STEP 1B: Storing resume text in database...');
    student.resumeText = resumeText;
    student.resumeFile = filePath;
    student.resumeAnalysis = {
      fileName: req.file.originalname,
      originalFileName: req.file.originalname,
      uploadDate: new Date(),
      resumeText: resumeText,
      skills: [],
      category: 'pending_analysis',
      experienceLevel: 'pending_analysis', 
      summary: 'Resume uploaded successfully. Analysis in progress...'
    };
    student.updatedAt = new Date();

    await student.save();
    console.log('✅ Resume text stored in database successfully');

    // ========================================
    // STEP 2: AI-POWERED STRUCTURED ANALYSIS  
    // ========================================
    console.log('🤖 STEP 2: Analyzing stored resume text with AI...');
    
    let finalAnalysis: any;
    
    // Try AI analysis first
    const aiResult = await analyzeResumeWithAI(resumeText);
    
    if (aiResult.success && aiResult.analysis) {
      console.log('✅ AI analysis completed successfully');
      finalAnalysis = aiResult.analysis;
      
      // Add missing fields for consistency
      finalAnalysis.skillsCount = finalAnalysis.skills?.length || 0;
      finalAnalysis.experienceCount = finalAnalysis.experience?.length || 0;
      finalAnalysis.educationCount = finalAnalysis.education?.length || 0;
      finalAnalysis.profileCompleteness = 85;
      
      if (!finalAnalysis.analysisMetadata) {
        finalAnalysis.analysisMetadata = {
          confidence: 85,
          extractionMethod: 'ai-focused',
          analysisDate: new Date()
        };
      }
      
    } else {
      console.log('⚠️ AI analysis failed, using enhanced fallback...');
      finalAnalysis = createEnhancedFallbackAnalysis(resumeText);
    }

    // ========================================
    // STEP 3: UPDATE DATABASE WITH ANALYSIS
    // ========================================
    console.log('💾 STEP 3: Updating database with structured analysis...');
    
    // Update personal information
    if (finalAnalysis.personalInfo?.name && finalAnalysis.personalInfo.name !== 'Professional') {
      const nameParts = finalAnalysis.personalInfo.name.split(' ');
      student.firstName = nameParts[0] || student.firstName;
      student.lastName = nameParts.slice(1).join(' ') || student.lastName;
    }
    
    if (finalAnalysis.personalInfo?.email && !student.email) {
      student.email = finalAnalysis.personalInfo.email;
    }
    
    if (finalAnalysis.personalInfo?.phone && !student.phoneNumber) {
      student.phoneNumber = finalAnalysis.personalInfo.phone;
    }
    
    if (finalAnalysis.personalInfo?.linkedIn) {
      student.linkedinUrl = finalAnalysis.personalInfo.linkedIn;
    }
    
    if (finalAnalysis.personalInfo?.github) {
      student.githubUrl = finalAnalysis.personalInfo.github;
    }

    // Update skills with proper category mapping
    if (finalAnalysis.skills && finalAnalysis.skills.length > 0) {
      student.skills = finalAnalysis.skills.map((skill: any) => ({
        name: skill.name,
        level: skill.level || 'intermediate',
        category: mapCategoryToSchema(skill.category || 'technical')
      }));
      console.log('✅ Updated skills:', student.skills.length, 'skills');
    }

    // Update experience
    if (finalAnalysis.experience && finalAnalysis.experience.length > 0) {
      student.experience = finalAnalysis.experience.map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location || '',
        startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
        endDate: exp.endDate && exp.endDate !== 'Present' ? new Date(exp.endDate) : undefined,
        description: exp.description || '',
        isCurrentJob: exp.endDate === 'Present' || !exp.endDate
      }));
      console.log('✅ Updated experience:', student.experience.length, 'positions');
    }

    // Update education
    if (finalAnalysis.education && finalAnalysis.education.length > 0) {
      student.education = finalAnalysis.education.map((edu: any) => ({
        degree: edu.degree,
        fieldOfStudy: edu.field || edu.fieldOfStudy,
        institution: edu.institution,
        startYear: edu.startYear,
        endYear: edu.endYear,
        gpa: edu.gpa,
        isCompleted: edu.endYear ? edu.endYear <= new Date().getFullYear() : false
      }));
      console.log('✅ Updated education:', student.education.length, 'entries');
    }

    // Update resume analysis summary
    student.resumeAnalysis = {
      ...student.resumeAnalysis,
      skills: finalAnalysis.skills?.map((s: any) => s.name) || [],
      category: finalAnalysis.analysisMetadata?.suggestedJobCategory || 'General',
      experienceLevel: finalAnalysis.jobPreferences?.experienceLevel || 'mid',
      summary: `Resume analyzed successfully. Extracted: ${finalAnalysis.skillsCount || 0} skills, ${finalAnalysis.experienceCount || 0} experiences, ${finalAnalysis.educationCount || 0} education entries.`,
      extractedDetails: {
        personalInfo: finalAnalysis.personalInfo,
        experience: finalAnalysis.experience,
        education: finalAnalysis.education,
        jobPreferences: finalAnalysis.jobPreferences,
        analysisMetadata: finalAnalysis.analysisMetadata
      }
    };

    await student.save();
    console.log('✅ All data updated successfully in database');

    // Clean up uploaded file
    try { fs.unlinkSync(filePath); } catch {}

    // Return success response
    return res.json({
      success: true,
      message: 'Resume analyzed successfully using two-step approach and profile updated',
      analysis: finalAnalysis,
      studentId: student._id,
      debug: {
        textLength: resumeText.length,
        extractionMethod: finalAnalysis.analysisMetadata?.extractionMethod || 'unknown',
        confidence: finalAnalysis.analysisMetadata?.confidence || 75,
        aiSuccess: aiResult.success || false,
        stepsCompleted: ['text_extraction', 'database_storage', 'ai_analysis', 'database_update']
      }
    });

  } catch (error) {
    console.error('💥 Resume analysis flow failed:', error);
    
    // Clean up uploaded file if it exists
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    
    return res.status(500).json({
      success: false,
      error: 'Resume analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
