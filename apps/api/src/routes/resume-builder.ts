import express from 'express';
import authMiddleware from '../middleware/auth';
import ResumeBuilderService from '../services/resume-builder';
import { Student } from '../models/Student';

const router = express.Router();

/**
 * Generate PDF resume from platform data
 * POST /api/resume-builder/generate
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    
    console.log('📄 Generating resume for user:', user._id);
    
    const result = await ResumeBuilderService.createResumeFromPlatform(user._id);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    // Set response headers for PDF download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Content-Length': result.pdfBuffer!.length
    });
    
    res.send(result.pdfBuffer);
    
  } catch (error) {
    console.error('Resume generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate resume'
    });
  }
});

/**
 * Preview resume as HTML
 * GET /api/resume-builder/preview
 */
router.get('/preview', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Find student data
    const student = await Student.findOne({ userId: user._id }).populate('userId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    const studentData = {
      personalInfo: {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || (student.userId as any)?.email || '',
        phone: student.phoneNumber || (student.userId as any)?.phone || '',
        linkedin: student.linkedinUrl,
        github: student.githubUrl,
        location: 'India'
      },
      education: student.education || [],
      experience: student.experience || [],
      skills: student.skills || [],
      projects: student.resumeAnalysis?.extractedDetails?.projects || [],
      certifications: student.resumeAnalysis?.extractedDetails?.certifications || []
    };
    
    // Calculate experience and generate summary
    const experienceYears = Math.floor(
      studentData.experience.reduce((total, exp) => {
        const start = new Date(exp.startDate);
        const end = exp.isCurrentJob ? new Date() : new Date(exp.endDate || new Date());
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return total + Math.max(0, months);
      }, 0) / 12
    );
    
    const topSkills = studentData.skills.slice(0, 5).map((s: any) => s.name).join(', ');
    
    (studentData as any).summary = `Professional with ${experienceYears > 0 ? `${experienceYears} year${experienceYears > 1 ? 's' : ''} of ` : ''}experience in software development. ${topSkills ? `Skilled in ${topSkills}. ` : ''}Passionate about technology and eager to contribute to innovative projects.`;
    
    // Generate HTML and return
    const htmlContent = (ResumeBuilderService as any).generateResumeHTML(studentData);
    
    res.set({
      'Content-Type': 'text/html'
    });
    
    res.send(htmlContent);
    
  } catch (error) {
    console.error('Resume preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate resume preview'
    });
  }
});

/**
 * Get resume data for editing
 * GET /api/resume-builder/data
 */
router.get('/data', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    
    const student = await Student.findOne({ userId: user._id }).populate('userId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    const resumeData = {
      personalInfo: {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || (student.userId as any)?.email || '',
        phone: student.phoneNumber || (student.userId as any)?.phone || '',
        linkedin: student.linkedinUrl,
        github: student.githubUrl,
        location: 'India'
      },
      education: student.education || [],
      experience: student.experience || [],
      skills: student.skills || [],
      projects: student.resumeAnalysis?.extractedDetails?.projects || [],
      certifications: student.resumeAnalysis?.extractedDetails?.certifications || []
    };
    
    res.json({
      success: true,
      data: resumeData
    });
    
  } catch (error) {
    console.error('Resume data fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume data'
    });
  }
});

/**
 * Update resume data (for platform-based editing)
 * PUT /api/resume-builder/data
 */
router.put('/data', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const updateData = req.body;
    
    const student = await Student.findOne({ userId: user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }
    
    // Update student data
    if (updateData.personalInfo) {
      const { personalInfo } = updateData;
      if (personalInfo.firstName) student.firstName = personalInfo.firstName;
      if (personalInfo.lastName) student.lastName = personalInfo.lastName;
      if (personalInfo.email) student.email = personalInfo.email;
      if (personalInfo.phone) student.phoneNumber = personalInfo.phone;
      if (personalInfo.linkedin) student.linkedinUrl = personalInfo.linkedin;
      if (personalInfo.github) student.githubUrl = personalInfo.github;
    }
    
    if (updateData.education) {
      student.education = updateData.education.map((edu: any) => ({
        degree: edu.degree,
        field: edu.field,
        institution: edu.institution,
        startDate: new Date(edu.startDate),
        endDate: edu.endDate ? new Date(edu.endDate) : undefined,
        gpa: edu.gpa,
        isCompleted: edu.isCompleted !== false
      }));
    }
    
    if (updateData.experience) {
      student.experience = updateData.experience.map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location,
        startDate: new Date(exp.startDate),
        endDate: exp.endDate ? new Date(exp.endDate) : undefined,
        description: exp.description,
        isCurrentJob: exp.isCurrentJob || false
      }));
    }
    
    if (updateData.skills) {
      student.skills = updateData.skills.map((skill: any) => ({
        name: skill.name,
        level: skill.level || 'intermediate',
        category: skill.category || 'technical'
      }));
    }
    
    // Update projects and certifications in resumeAnalysis
    if (updateData.projects || updateData.certifications) {
      if (!student.resumeAnalysis) {
        student.resumeAnalysis = {} as any;
      }
      if (!student.resumeAnalysis!.extractedDetails) {
        student.resumeAnalysis!.extractedDetails = {};
      }
      
      if (updateData.projects) {
        student.resumeAnalysis!.extractedDetails!.projects = updateData.projects;
      }
      
      if (updateData.certifications) {
        student.resumeAnalysis!.extractedDetails!.certifications = updateData.certifications;
      }
    }
    
    await student.save();
    
    res.json({
      success: true,
      message: 'Resume data updated successfully'
    });
    
  } catch (error) {
    console.error('Resume data update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resume data'
    });
  }
});

export default router;
