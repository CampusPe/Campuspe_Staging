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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// PDF text extraction using pdf-parse
const extractResumeText = async (filePath: string): Promise<string> => {
  try {
    console.log('Extracting text from PDF:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }
    
    const fileStats = fs.statSync(filePath);
    console.log('File size:', fileStats.size, 'bytes');
    
    if (fileStats.size === 0) {
      throw new Error('PDF file is empty');
    }
    
    const dataBuffer = fs.readFileSync(filePath);
    
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text could be extracted from PDF - file may be image-based or corrupted');
    }
    
    console.log('Successfully extracted text, length:', data.text.length);
    return data.text.trim();
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to calculate profile completeness
const calculateProfileCompleteness = (student: any): number => {
  let score = 0;
  const maxScore = 100;
  
  // Basic info (20 points)
  if (student.firstName) score += 5;
  if (student.lastName) score += 5;
  if (student.email) score += 5;
  if (student.phoneNumber) score += 5;
  
  // Resume (20 points)
  if (student.resumeText && student.resumeText.length > 100) score += 20;
  
  // Skills (20 points)
  if (student.skills && student.skills.length > 0) {
    score += Math.min(20, student.skills.length * 2);
  }
  
  // Experience (20 points)
  if (student.experience && student.experience.length > 0) {
    score += Math.min(20, student.experience.length * 10);
  }
  
  // Education (20 points)
  if (student.education && student.education.length > 0) {
    score += Math.min(20, student.education.length * 10);
  }
  
  return Math.min(maxScore, score);
};

// ========================================
// STREAMLINED AI-POWERED RESUME ANALYSIS
// ========================================
router.post('/analyze-resume-ai', authMiddleware, upload.single('resume'), async (req, res) => {
  console.log('🚀 AI-Powered Resume Analysis Flow Started');
  
  try {
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ 
        success: false, 
        error: 'No resume file uploaded' 
      });
    }

    console.log('📁 File received:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const user = (req as any).user;
    const filePath = req.file.path;

    // ========================================
    // STEP 1: EXTRACT FULL TEXT FROM PDF
    // ========================================
    console.log('🔍 Step 1: Extracting full text from PDF...');
    let resumeText = '';
    
    try {
      resumeText = await extractResumeText(filePath);
      console.log('✅ PDF text extraction successful');
      console.log('📝 Text length:', resumeText.length, 'characters');
      console.log('📄 Text preview:', resumeText.substring(0, 300) + '...');
    } catch (extractError) {
      console.error('❌ PDF text extraction failed:', extractError);
      
      // Clean up file
      try { fs.unlinkSync(filePath); } catch {}
      
      return res.status(400).json({
        success: false,
        error: `Failed to extract text from PDF: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`
      });
    }

    // ========================================
    // STEP 2: SAVE RESUME TEXT TO DATABASE
    // ========================================
    console.log('🗃️ Step 2: Saving resume text to student record...');
    
    let student = await Student.findOne({ userId: user._id }) as any;
    
    if (!student) {
      console.log('👤 Student not found, creating new profile...');
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

    // Save full resume text and file path
    student.resumeText = resumeText; // Complete text for AI analysis
    student.resumeFile = filePath;   // File path for future reference
    student.updatedAt = new Date();

    console.log('✅ Resume text saved to database');
    console.log('📊 Saved text length:', resumeText.length, 'characters');

    // ========================================
    // STEP 3: ANALYZE WITH CLAUDE AI
    // ========================================
    console.log('🤖 Step 3: Analyzing resume with Claude AI...');
    
    let aiAnalysis: any = {};
    
    try {
      // Use the comprehensive AI analysis
      aiAnalysis = await AIResumeMatchingService.analyzeCompleteResume(resumeText);
      console.log('✅ Claude AI analysis completed successfully');
      console.log('🎯 AI Analysis Summary:', {
        personalInfoExtracted: !!aiAnalysis.personalInfo?.name,
        skillsCount: aiAnalysis.skills?.length || 0,
        experienceCount: aiAnalysis.experience?.length || 0,
        educationCount: aiAnalysis.education?.length || 0,
        jobPreferencesInferred: !!aiAnalysis.jobPreferences,
        confidence: aiAnalysis.analysisMetadata?.confidence || 0,
        extractionMethod: aiAnalysis.analysisMetadata?.extractionMethod || 'unknown'
      });
      
    } catch (aiError) {
      console.error('❌ Claude AI analysis failed:', aiError);
      // Continue with fallback - the service should handle this internally
      aiAnalysis = {
        personalInfo: { name: 'Professional' },
        skills: [],
        experience: [],
        education: [],
        jobPreferences: { 
          preferredRoles: [], 
          preferredIndustries: [], 
          experienceLevel: 'entry', 
          workMode: 'any' 
        },
        analysisMetadata: { 
          confidence: 30, 
          extractionMethod: 'error', 
          totalYearsExperience: 0, 
          primarySkillCategory: 'general', 
          suggestedJobCategory: 'General' 
        }
      };
    }

    // ========================================
    // STEP 4: SAVE AI ANALYSIS TO DATABASE
    // ========================================
    console.log('💾 Step 4: Saving AI analysis to database...');

    // Update personal information from AI
    if (aiAnalysis.personalInfo?.name && aiAnalysis.personalInfo.name !== 'Professional') {
      const nameParts = aiAnalysis.personalInfo.name.split(' ');
      student.firstName = nameParts[0] || student.firstName;
      student.lastName = nameParts.slice(1).join(' ') || student.lastName;
    }
    
    if (aiAnalysis.personalInfo?.email && !student.email) {
      student.email = aiAnalysis.personalInfo.email;
    }
    
    if (aiAnalysis.personalInfo?.phone && !student.phoneNumber) {
      student.phoneNumber = aiAnalysis.personalInfo.phone;
    }

    // Update skills from AI analysis
    if (aiAnalysis.skills && aiAnalysis.skills.length > 0) {
      student.skills = aiAnalysis.skills.map((skill: any) => ({
        name: skill.name,
        level: skill.level || 'intermediate',
        category: skill.category || 'technical'
      }));
      console.log('✅ Updated skills:', student.skills.length, 'skills from AI');
    }

    // Update experience from AI analysis
    if (aiAnalysis.experience && aiAnalysis.experience.length > 0) {
      student.experience = aiAnalysis.experience.map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location || '',
        startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
        endDate: exp.endDate && exp.endDate !== 'Present' ? new Date(exp.endDate) : undefined,
        description: exp.description || '',
        isCurrentJob: exp.isCurrentJob || exp.endDate === 'Present'
      }));
      console.log('✅ Updated experience:', student.experience.length, 'entries from AI');
    }

    // Update education from AI analysis
    if (aiAnalysis.education && aiAnalysis.education.length > 0) {
      student.education = aiAnalysis.education.map((edu: any) => ({
        degree: edu.degree,
        field: edu.field,
        institution: edu.institution,
        startDate: edu.startYear ? new Date(`${edu.startYear}-01-01`) : undefined,
        endDate: edu.endYear ? new Date(`${edu.endYear}-01-01`) : undefined,
        gpa: edu.gpa ? parseFloat(edu.gpa) : undefined,
        isCompleted: edu.isCompleted !== false
      }));
      console.log('✅ Updated education:', student.education.length, 'entries from AI');
    }

    // Update job preferences from AI analysis
    if (aiAnalysis.jobPreferences) {
      student.jobPreferences = {
        jobTypes: aiAnalysis.jobPreferences.preferredRoles || [],
        preferredLocations: ['Any'], // Default
        workMode: aiAnalysis.jobPreferences.workMode || 'any',
        expectedSalary: aiAnalysis.jobPreferences.expectedSalaryRange || {
          min: 40000,
          max: 70000,
          currency: 'USD'
        }
      };
      console.log('✅ Updated job preferences from AI analysis');
    }

    // Save comprehensive resume analysis metadata
    student.resumeAnalysis = {
      uploadDate: new Date(),
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      aiAnalysis: aiAnalysis, // Complete AI analysis result
      analysisMetadata: aiAnalysis.analysisMetadata,
      confidence: aiAnalysis.analysisMetadata?.confidence || 70,
      extractionMethod: aiAnalysis.analysisMetadata?.extractionMethod || 'AI'
    };

    // Update profile completeness
    const completenessScore = calculateProfileCompleteness(student);
    student.profileCompleteness = completenessScore;

    // ========================================
    // STEP 5: SAVE TO DATABASE
    // ========================================
    console.log('💾 Step 5: Saving complete student profile...');
    
    await student.save();
    console.log('✅ Student profile saved successfully');

    // ========================================
    // STEP 6: PREPARE RESPONSE
    // ========================================
    console.log('📤 Step 6: Preparing response...');

    const responseData = {
      success: true,
      message: 'Resume analyzed successfully with AI and profile updated',
      analysis: {
        personalInfo: aiAnalysis.personalInfo,
        skills: aiAnalysis.skills || [],
        skillsCount: aiAnalysis.skills?.length || 0,
        experience: aiAnalysis.experience || [],
        experienceCount: aiAnalysis.experience?.length || 0,
        education: aiAnalysis.education || [],
        educationCount: aiAnalysis.education?.length || 0,
        jobPreferences: aiAnalysis.jobPreferences,
        analysisMetadata: aiAnalysis.analysisMetadata,
        profileCompleteness: completenessScore
      },
      studentId: student._id,
      debug: {
        textLength: resumeText.length,
        extractionMethod: aiAnalysis.analysisMetadata?.extractionMethod,
        confidence: aiAnalysis.analysisMetadata?.confidence,
        aiSuccess: aiAnalysis.analysisMetadata?.extractionMethod === 'AI'
      }
    };

    console.log('🎉 Resume analysis flow completed successfully!');
    console.log('📊 Final Summary:', {
      textSaved: resumeText.length > 0,
      aiAnalysisSuccess: aiAnalysis.analysisMetadata?.extractionMethod === 'AI',
      skillsExtracted: aiAnalysis.skills?.length || 0,
      experienceExtracted: aiAnalysis.experience?.length || 0,
      educationExtracted: aiAnalysis.education?.length || 0,
      profileCompleteness: completenessScore
    });

    res.json(responseData);

  } catch (error) {
    console.error('❌ Resume analysis flow failed:', error);
    
    // Clean up file on error
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    
    res.status(500).json({
      success: false,
      error: 'Resume analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
