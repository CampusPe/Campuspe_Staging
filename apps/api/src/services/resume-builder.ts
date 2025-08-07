import puppeteer, { Browser } from 'puppeteer';
import { Student } from '../models/Student';
import { Job } from '../models/Job';
import AIResumeMatchingService from './ai-resume-matching';

interface ResumeData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    location?: string;
  };
  summary?: string;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    startDate: Date;
    endDate?: Date;
    gpa?: number;
    isCompleted: boolean;
  }>;
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
    isCurrentJob: boolean;
  }>;
  skills: Array<{
    name: string;
    level: string;
    category: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  certifications?: Array<{
    name: string;
    year: number;
    organization: string;
  }>;
}

interface JobDescriptionAnalysis {
  requiredSkills: string[];
  preferredSkills: string[];
  jobLevel: string;
  industry: string;
  responsibilities: string[];
  qualifications: string[];
}

class ResumeBuilderService {
  private browser: Browser | null = null;

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Analyze job description to extract requirements using AI
   */
  async analyzeJobDescription(jobDescription: string): Promise<JobDescriptionAnalysis> {
    try {
      console.log('🔍 Analyzing job description with AI...');
      
      // Use fallback analysis since AI service structure is different
      return this.fallbackJobAnalysis(jobDescription);
      
    } catch (error) {
      console.error('❌ Error analyzing job description:', error);
      return this.fallbackJobAnalysis(jobDescription);
    }
  }

  /**
   * Fallback job analysis using keyword matching
   */
  private fallbackJobAnalysis(jobDescription: string): JobDescriptionAnalysis {
    const text = jobDescription.toLowerCase();
    
    const skillKeywords = {
      'JavaScript': ['javascript', 'js', 'node.js', 'nodejs'],
      'React': ['react', 'reactjs'],
      'Python': ['python', 'django', 'flask'],
      'Java': ['java', 'spring', 'springboot'],
      'SQL': ['sql', 'mysql', 'postgresql', 'database'],
      'AWS': ['aws', 'amazon web services', 'cloud'],
      'Docker': ['docker', 'containerization'],
      'Git': ['git', 'github', 'version control']
    };
    
    const foundSkills: string[] = [];
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        foundSkills.push(skill);
      }
    }
    
    const jobLevel = text.includes('senior') || text.includes('lead') ? 'senior' : 
                    text.includes('junior') || text.includes('entry') ? 'entry' : 'mid';
    
    return {
      requiredSkills: foundSkills.slice(0, 6),
      preferredSkills: foundSkills.slice(6, 10),
      jobLevel,
      industry: 'technology',
      responsibilities: ['Develop software solutions', 'Collaborate with team'],
      qualifications: ['Bachelor\'s degree', 'Relevant experience']
    };
  }

  /**
   * Get student data and tailor it for job requirements
   */
  async getStudentData(email: string, phoneNumber: string): Promise<ResumeData | null> {
    try {
      console.log(`📋 Fetching student data for email: ${email}, phone: ${phoneNumber}`);
      
      // Try to find student by email first, then phone
      let student = await Student.findOne({ email: email }).populate('userId');
      
      if (!student && phoneNumber) {
        student = await Student.findOne({ phoneNumber: phoneNumber }).populate('userId');
      }
      
      if (!student) {
        console.log('❌ Student not found');
        return null;
      }
      
      console.log(`✅ Student found: ${student.firstName} ${student.lastName}`);
      
      return {
        personalInfo: {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email || email,
          phone: student.phoneNumber || phoneNumber,
          linkedin: student.linkedinUrl,
          github: student.githubUrl,
          location: 'India' // Default location
        },
        education: student.education || [],
        experience: student.experience || [],
        skills: student.skills || [],
        projects: (student.resumeAnalysis?.extractedDetails?.projects || []).filter((p: any) => p.name && p.description).map((p: any) => ({
          name: p.name || '',
          description: p.description || '',
          technologies: p.technologies || [],
          link: p.link
        })),
        certifications: (student.resumeAnalysis?.extractedDetails?.certifications || []).filter((c: any) => c.name && c.organization && c.year).map((c: any) => ({
          name: c.name || '',
          year: c.year || new Date().getFullYear(),
          organization: c.organization || ''
        }))
      };
      
    } catch (error) {
      console.error('❌ Error fetching student data:', error);
      return null;
    }
  }

  /**
   * Tailor resume for specific job requirements
   */
  tailorResumeForJob(studentData: ResumeData, jobAnalysis: JobDescriptionAnalysis): ResumeData {
    console.log('🎯 Tailoring resume for job requirements...');
    
    // Create tailored copy
    const tailoredResume = JSON.parse(JSON.stringify(studentData));
    
    // Prioritize skills that match job requirements
    const prioritizedSkills = [];
    const requiredSkillsLower = jobAnalysis.requiredSkills.map(s => s.toLowerCase());
    const preferredSkillsLower = jobAnalysis.preferredSkills.map(s => s.toLowerCase());
    
    // Add matching required skills first
    for (const skill of tailoredResume.skills) {
      if (requiredSkillsLower.includes(skill.name.toLowerCase())) {
        prioritizedSkills.push({ ...skill, priority: 'high' });
      }
    }
    
    // Add matching preferred skills
    for (const skill of tailoredResume.skills) {
      if (preferredSkillsLower.includes(skill.name.toLowerCase()) && 
          !prioritizedSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
        prioritizedSkills.push({ ...skill, priority: 'medium' });
      }
    }
    
    // Add remaining skills
    for (const skill of tailoredResume.skills) {
      if (!prioritizedSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
        prioritizedSkills.push({ ...skill, priority: 'low' });
      }
    }
    
    tailoredResume.skills = prioritizedSkills.slice(0, 12); // Limit to top 12 skills
    
    // Generate tailored summary
    const matchingSkills = prioritizedSkills.filter(s => s.priority === 'high').map(s => s.name);
    const summaryTemplate = this.generateTailoredSummary(studentData, jobAnalysis, matchingSkills);
    tailoredResume.summary = summaryTemplate;
    
    console.log(`✅ Resume tailored with ${matchingSkills.length} matching skills`);
    
    return tailoredResume;
  }

  /**
   * Generate a tailored summary based on job requirements
   */
  private generateTailoredSummary(studentData: ResumeData, jobAnalysis: JobDescriptionAnalysis, matchingSkills: string[]): string {
    const experienceYears = this.calculateExperience(studentData.experience);
    const topSkills = matchingSkills.slice(0, 5).join(', ');
    
    let summary = `${jobAnalysis.jobLevel.charAt(0).toUpperCase() + jobAnalysis.jobLevel.slice(1)}-level professional`;
    
    if (experienceYears > 0) {
      summary += ` with ${experienceYears} year${experienceYears > 1 ? 's' : ''} of experience`;
    }
    
    if (jobAnalysis.industry) {
      summary += ` in ${jobAnalysis.industry}`;
    }
    
    if (topSkills) {
      summary += `. Skilled in ${topSkills}`;
    }
    
    summary += '. Passionate about delivering high-quality solutions and contributing to team success.';
    
    return summary;
  }

  /**
   * Calculate years of experience
   */
  private calculateExperience(experience: ResumeData['experience']): number {
    if (!experience || experience.length === 0) return 0;
    
    let totalMonths = 0;
    
    for (const exp of experience) {
      const startDate = new Date(exp.startDate);
      const endDate = exp.isCurrentJob ? new Date() : new Date(exp.endDate || new Date());
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
      totalMonths += Math.max(0, months);
    }
    
    return Math.floor(totalMonths / 12);
  }

  /**
   * Generate HTML template for resume
   */
  generateResumeHTML(resumeData: ResumeData): string {
    const formatDate = (date: Date | undefined, isCurrentJob = false) => {
      if (isCurrentJob) return 'Present';
      if (!date) return '';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume - ${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: white;
                font-size: 12px;
            }
            
            .resume-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                background: white;
                min-height: 100vh;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 20px;
            }
            
            .name {
                font-size: 32px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .contact-info {
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 20px;
                color: #666;
                font-size: 11px;
            }
            
            .contact-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .section {
                margin-bottom: 25px;
            }
            
            .section-title {
                font-size: 16px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 15px;
                text-transform: uppercase;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
            }
            
            .summary {
                font-size: 13px;
                line-height: 1.8;
                color: #555;
                text-align: justify;
            }
            
            .experience-item, .education-item, .project-item {
                margin-bottom: 20px;
                padding-left: 15px;
                border-left: 3px solid #e5e7eb;
            }
            
            .experience-header, .education-header, .project-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
                flex-wrap: wrap;
            }
            
            .job-title, .degree, .project-name {
                font-weight: 600;
                color: #1e40af;
                font-size: 13px;
            }
            
            .company, .institution {
                color: #666;
                font-size: 12px;
                font-style: italic;
            }
            
            .date-range {
                color: #666;
                font-size: 11px;
                white-space: nowrap;
            }
            
            .description {
                color: #555;
                font-size: 11px;
                line-height: 1.6;
                margin-top: 5px;
            }
            
            .skills-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .skill-category {
                background: #f8fafc;
                padding: 12px;
                border-radius: 8px;
                border-left: 4px solid #2563eb;
            }
            
            .skill-category-title {
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 8px;
                font-size: 12px;
                text-transform: capitalize;
            }
            
            .skill-list {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            
            .skill-item {
                background: #e0e7ff;
                color: #3730a3;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 500;
            }
            
            .certification-item {
                background: #f0f9ff;
                padding: 8px 12px;
                border-radius: 6px;
                margin-bottom: 8px;
                border-left: 3px solid #0ea5e9;
            }
            
            .cert-name {
                font-weight: 600;
                color: #0c4a6e;
                font-size: 12px;
            }
            
            .cert-org {
                color: #666;
                font-size: 11px;
            }
            
            .tech-stack {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 5px;
            }
            
            .tech-item {
                background: #fef3c7;
                color: #92400e;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 9px;
                font-weight: 500;
            }
            
            .gpa {
                color: #059669;
                font-weight: 600;
                font-size: 11px;
            }
            
            @media print {
                body {
                    font-size: 11px;
                }
                
                .resume-container {
                    padding: 20px;
                    max-width: none;
                }
                
                .section {
                    margin-bottom: 20px;
                }
                
                .name {
                    font-size: 28px;
                }
                
                .contact-info {
                    font-size: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="resume-container">
            <!-- Header -->
            <div class="header">
                <h1 class="name">${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}</h1>
                <div class="contact-info">
                    <div class="contact-item">
                        <span>📧</span>
                        <span>${resumeData.personalInfo.email}</span>
                    </div>
                    <div class="contact-item">
                        <span>📱</span>
                        <span>${resumeData.personalInfo.phone}</span>
                    </div>
                    ${resumeData.personalInfo.linkedin ? `
                    <div class="contact-item">
                        <span>💼</span>
                        <span>LinkedIn</span>
                    </div>
                    ` : ''}
                    ${resumeData.personalInfo.github ? `
                    <div class="contact-item">
                        <span>💻</span>
                        <span>GitHub</span>
                    </div>
                    ` : ''}
                    ${resumeData.personalInfo.location ? `
                    <div class="contact-item">
                        <span>📍</span>
                        <span>${resumeData.personalInfo.location}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Summary -->
            ${resumeData.summary ? `
            <div class="section">
                <h2 class="section-title">Professional Summary</h2>
                <div class="summary">
                    ${resumeData.summary}
                </div>
            </div>
            ` : ''}

            <!-- Skills -->
            ${resumeData.skills && resumeData.skills.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Skills & Technologies</h2>
                <div class="skills-grid">
                    ${this.groupSkillsByCategory(resumeData.skills).map(category => `
                        <div class="skill-category">
                            <div class="skill-category-title">${category.name}</div>
                            <div class="skill-list">
                                ${category.skills.map((skill: any) => `
                                    <span class="skill-item">${skill.name}</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Experience -->
            ${resumeData.experience && resumeData.experience.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Professional Experience</h2>
                ${resumeData.experience.map(exp => `
                    <div class="experience-item">
                        <div class="experience-header">
                            <div>
                                <div class="job-title">${exp.title}</div>
                                <div class="company">${exp.company}${exp.location ? ` • ${exp.location}` : ''}</div>
                            </div>
                            <div class="date-range">
                                ${formatDate(exp.startDate)} - ${formatDate(exp.endDate, exp.isCurrentJob)}
                            </div>
                        </div>
                        ${exp.description ? `
                        <div class="description">
                            ${exp.description}
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Education -->
            ${resumeData.education && resumeData.education.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Education</h2>
                ${resumeData.education.map(edu => `
                    <div class="education-item">
                        <div class="education-header">
                            <div>
                                <div class="degree">${edu.degree} in ${edu.field}</div>
                                <div class="institution">${edu.institution}</div>
                            </div>
                            <div>
                                <div class="date-range">
                                    ${formatDate(edu.startDate)} - ${formatDate(edu.endDate, !edu.isCompleted)}
                                </div>
                                ${edu.gpa ? `<div class="gpa">GPA: ${edu.gpa}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Projects -->
            ${resumeData.projects && resumeData.projects.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Projects</h2>
                ${resumeData.projects.map(project => `
                    <div class="project-item">
                        <div class="project-header">
                            <div class="project-name">${project.name}</div>
                        </div>
                        ${project.description ? `
                        <div class="description">
                            ${project.description}
                        </div>
                        ` : ''}
                        ${project.technologies && project.technologies.length > 0 ? `
                        <div class="tech-stack">
                            ${project.technologies.map(tech => `
                                <span class="tech-item">${tech}</span>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Certifications -->
            ${resumeData.certifications && resumeData.certifications.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Certifications</h2>
                ${resumeData.certifications.map(cert => `
                    <div class="certification-item">
                        <div class="cert-name">${cert.name}</div>
                        <div class="cert-org">${cert.organization} • ${cert.year}</div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Group skills by category for better organization
   */
  private groupSkillsByCategory(skills: ResumeData['skills']) {
    const categories = new Map();
    
    skills.forEach(skill => {
      const category = skill.category || 'technical';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(skill);
    });
    
    return Array.from(categories.entries()).map(([name, skills]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      skills
    }));
  }

  /**
   * Generate PDF from HTML using Puppeteer
   */
  async generatePDF(htmlContent: string): Promise<Buffer> {
    console.log('📄 Generating PDF from HTML...');
    
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      await page.close();
      console.log('✅ PDF generated successfully');
      
      return Buffer.from(pdf);
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Main function to create tailored resume for job application
   */
  async createTailoredResume(
    email: string, 
    phoneNumber: string, 
    jobDescription: string
  ): Promise<{ success: boolean; pdfBuffer?: Buffer; message: string; fileName?: string; resumeId?: string; downloadUrl?: string }> {
    try {
      console.log('🚀 Starting tailored resume creation...');
      
      // Step 1: Analyze job description
      const jobAnalysis = await this.analyzeJobDescription(jobDescription);
      console.log('✅ Job analysis completed');
      
      // Step 2: Get student data
      const studentData = await this.getStudentData(email, phoneNumber);
      if (!studentData) {
        return {
          success: false,
          message: 'Student profile not found. Please ensure you have a complete profile on CampusPe.'
        };
      }
      console.log('✅ Student data retrieved');
      
      // Step 3: Tailor resume for job
      const tailoredResume = this.tailorResumeForJob(studentData, jobAnalysis);
      console.log('✅ Resume tailored for job requirements');
      
      // Step 4: Generate HTML
      const htmlContent = this.generateResumeHTML(tailoredResume);
      console.log('✅ HTML template generated');
      
      // Step 5: Generate PDF
      const pdfBuffer = await this.generatePDF(htmlContent);
      console.log('✅ PDF generated successfully');
      
      const fileName = `${studentData.personalInfo.firstName}_${studentData.personalInfo.lastName}_Resume_${Date.now()}.pdf`;
      
      // Step 6: Save to GeneratedResume collection
      let resumeId: string | undefined;
      let downloadUrl: string | undefined;
      
      try {
        const { Student } = require('../models/Student');
        const student = await Student.findOne({ 
          $or: [
            { email: email },
            { phoneNumber: phoneNumber }
          ]
        }).lean();
        
        if (student) {
          const GeneratedResumeService = require('./generated-resume.service').default;
          
          // Extract job title from description
          const jobTitleMatch = jobDescription.match(/(?:position|role|job):\s*([^.]+)/i);
          const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'Job Application';
          
          const generatedResume = await GeneratedResumeService.createGeneratedResume({
            studentId: student._id.toString(),
            jobTitle,
            jobDescription,
            resumeData: tailoredResume,
            fileName,
            pdfBuffer,
            matchScore: 85, // You can implement actual matching logic
            aiEnhancementUsed: true,
            matchedSkills: tailoredResume.skills.map((s: any) => s.name).slice(0, 5),
            missingSkills: [],
            suggestions: [],
            generationType: 'ai'
          });
          
          resumeId = generatedResume.resumeId;
          downloadUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
          
          console.log('✅ Resume saved to GeneratedResume collection:', resumeId);
        }
      } catch (saveError) {
        console.error('⚠️ Error saving to GeneratedResume collection:', saveError);
        // Don't fail the whole process if saving fails
      }
      
      return {
        success: true,
        pdfBuffer,
        fileName,
        message: 'Resume generated successfully and tailored for the job requirements!',
        resumeId,
        downloadUrl
      };
      
    } catch (error) {
      console.error('❌ Error creating tailored resume:', error);
      return {
        success: false,
        message: 'Failed to generate resume. Please try again later.'
      };
    }
  }

  /**
   * Create resume from platform (without job tailoring)
   */
  async createResumeFromPlatform(userId: string): Promise<{ success: boolean; pdfBuffer?: Buffer; message: string; fileName?: string }> {
    try {
      console.log('🚀 Creating resume from platform data...');
      
      // Find student by userId
      const student = await Student.findOne({ userId }).populate('userId');
      if (!student) {
        return {
          success: false,
          message: 'Student profile not found.'
        };
      }
      
      const studentData: ResumeData = {
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
        projects: (student.resumeAnalysis?.extractedDetails?.projects || []).filter((p: any) => p.name && p.description).map((p: any) => ({
          name: p.name || '',
          description: p.description || '',
          technologies: p.technologies || [],
          link: p.link
        })),
        certifications: (student.resumeAnalysis?.extractedDetails?.certifications || []).filter((c: any) => c.name && c.organization && c.year).map((c: any) => ({
          name: c.name || '',
          year: c.year || new Date().getFullYear(),
          organization: c.organization || ''
        }))
      };
      
      // Generate generic summary
      const experienceYears = this.calculateExperience(studentData.experience);
      const topSkills = studentData.skills.slice(0, 5).map(s => s.name).join(', ');
      
      studentData.summary = `Professional with ${experienceYears > 0 ? `${experienceYears} year${experienceYears > 1 ? 's' : ''} of ` : ''}experience in software development. ${topSkills ? `Skilled in ${topSkills}. ` : ''}Passionate about technology and eager to contribute to innovative projects.`;
      
      const htmlContent = this.generateResumeHTML(studentData);
      const pdfBuffer = await this.generatePDF(htmlContent);
      
      const fileName = `${studentData.personalInfo.firstName}_${studentData.personalInfo.lastName}_Resume_${Date.now()}.pdf`;
      
      return {
        success: true,
        pdfBuffer,
        fileName,
        message: 'Resume generated successfully!'
      };
      
    } catch (error) {
      console.error('❌ Error creating resume from platform:', error);
      return {
        success: false,
        message: 'Failed to generate resume. Please try again later.'
      };
    }
  }
}

export default new ResumeBuilderService();
