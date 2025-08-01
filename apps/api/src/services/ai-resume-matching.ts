import axios from 'axios';
import { IStudent } from '../models/Student';
import { IJob } from '../models/Job';

export interface ResumeMatchResult {
  matchScore: number; // 0-100
  explanation: string;
  suggestions: string[];
  skillsMatched: string[];
  skillsGap: string[];
}

export interface ResumeImprovementSuggestion {
  section: string;
  currentText: string;
  suggestedText: string;
  reason: string;
}

class AIResumeMatchingService {
  private claudeApiKey: string;
  private lastApiCall: number = 0;
  private readonly minDelayBetweenCalls = 1000; // 1 second minimum delay for Claude

  constructor() {
    // Use Claude API key from environment or fallback
    this.claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    if (!this.claudeApiKey) {
      console.warn('⚠️ Claude API key not found in environment variables. Please set CLAUDE_API_KEY or ANTHROPIC_API_KEY');
    }
  }

  /**
   * Rate limiting helper
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    
    if (timeSinceLastCall < this.minDelayBetweenCalls) {
      const delay = this.minDelayBetweenCalls - timeSinceLastCall;
      console.log(`⏱️ Rate limiting: waiting ${delay}ms before next Claude API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastApiCall = Date.now();
  }

  /**
   * Analyze resume against job description and provide match score using Claude Haiku
   */
  async analyzeResumeJobMatch(resumeText: string, jobDescription: string, jobTitle: string): Promise<ResumeMatchResult> {
    try {
      // Enforce rate limiting before making API call
      await this.enforceRateLimit();
      
      const prompt = `Compare the following resume content and job description. Return:
A match score (0–100)
A short explanation of the score
3–5 suggestions to improve the resume to match this job better.

Resume Content:
${resumeText}

Job Title: ${jobTitle}
Job Description:
${jobDescription}

Please respond in JSON format:
{
  "matchScore": number,
  "explanation": "string",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "skillsMatched": ["skill1", "skill2"],
  "skillsGap": ["missing_skill1", "missing_skill2"]
}`;

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${this.claudeApiKey}`,
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      const aiResponse = response.data.content[0].text;
      
      try {
        // Clean the response - remove markdown code blocks if present
        let cleanResponse = aiResponse.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Parse the JSON response
        const parsedResponse = JSON.parse(cleanResponse);
        return {
          matchScore: Math.min(100, Math.max(0, parsedResponse.matchScore || 0)),
          explanation: parsedResponse.explanation || 'No explanation available',
          suggestions: parsedResponse.suggestions || [],
          skillsMatched: parsedResponse.skillsMatched || [],
          skillsGap: parsedResponse.skillsGap || []
        };
      } catch (parseError) {
        console.error('Error parsing Claude AI response:', parseError);
        // Fallback response
        return this.generateFallbackMatch(resumeText, jobDescription);
      }

    } catch (error: any) {
      console.error('Error calling Claude API:', error);
      
      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        console.warn('⚠️ Claude API rate limit exceeded. Using enhanced fallback analysis.');
      }
      
      // Return enhanced fallback response
      return this.generateFallbackMatch(resumeText, jobDescription);
    }
  }

  /**
   * Get detailed resume improvement suggestions using Claude Haiku
   */
  async getResumeImprovementSuggestions(resumeText: string, jobDescription: string, jobTitle: string): Promise<ResumeImprovementSuggestion[]> {
    try {
      const prompt = `Analyze this resume and provide specific improvement suggestions for the job position.

Resume Content:
${resumeText}

Job Title: ${jobTitle}
Job Description:
${jobDescription}

Please provide detailed suggestions for improving specific sections of the resume. Return in JSON format:
[
  {
    "section": "Summary/Objective",
    "currentText": "current text from resume",
    "suggestedText": "improved version",
    "reason": "why this improvement helps"
  },
  {
    "section": "Skills",
    "currentText": "current skills section",
    "suggestedText": "enhanced skills section",
    "reason": "explanation of improvements"
  }
]`;

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${this.claudeApiKey}`,
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      const aiResponse = response.data.content[0].text;
      
      try {
        const parsedResponse = JSON.parse(aiResponse);
        return Array.isArray(parsedResponse) ? parsedResponse : [];
      } catch (parseError) {
        console.error('Error parsing improvement suggestions:', parseError);
        return this.generateFallbackImprovements();
      }

    } catch (error) {
      console.error('Error getting improvement suggestions:', error);
      return this.generateFallbackImprovements();
    }
  }

  /**
   * Generate enhanced resume content using Claude Haiku
   */
  async generateEnhancedResume(resumeText: string, jobDescription: string): Promise<string> {
    try {
      const prompt = `Please enhance this resume to better match the job requirements while keeping it truthful and professional.

Original Resume:
${resumeText}

Job Requirements:
${jobDescription}

Enhanced Resume (maintain all original experience and education, just improve presentation and highlight relevant skills):`;

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 2500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4
      }, {
        headers: {
          'Authorization': `Bearer ${this.claudeApiKey}`,
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        }
      });

      return response.data.content[0].text || resumeText;

    } catch (error) {
      console.error('Error generating enhanced resume:', error);
      return resumeText; // Return original if enhancement fails
    }
  }

  /**
   * Enhanced fallback match analysis when AI fails
   */
  private generateFallbackMatch(resumeText: string, jobDescription: string): ResumeMatchResult {
    // Enhanced keyword matching as fallback
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();
    
    // Comprehensive skills database for better matching
    const allSkills = [
      // Programming Languages
      'javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'rust', 'go', 'php', 'ruby',
      // Web Technologies
      'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'html', 'css', 'sass', 'bootstrap',
      // DevOps & Cloud
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible', 'ci/cd', 'cicd', 'devops',
      // Databases
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'database',
      // Tools & Others
      'git', 'github', 'gitlab', 'jira', 'figma', 'photoshop', 'linux', 'windows', 'macos',
      // Data Science & AI
      'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'scikit-learn', 'ml', 'ai',
      // Soft Skills
      'communication', 'leadership', 'teamwork', 'project management', 'agile', 'scrum'
    ];
    
    // More flexible skill matching using substring search
    const matchedSkills = allSkills.filter(skill => {
      const skillInResume = resumeLower.includes(skill);
      const skillInJob = jobLower.includes(skill);
      return skillInResume && skillInJob;
    });

    // Calculate more sophisticated match score
    const skillsInJob = allSkills.filter(skill => jobLower.includes(skill));

    const baseScore = skillsInJob.length > 0 ? (matchedSkills.length / skillsInJob.length) * 100 : 35;
    
    // Add bonus for experience level matching
    let experienceBonus = 0;
    
    if ((resumeLower.includes('senior') && jobLower.includes('senior')) ||
        (resumeLower.includes('lead') && jobLower.includes('lead')) ||
        (resumeLower.includes('junior') && jobLower.includes('junior'))) {
      experienceBonus = 10;
    }

    const matchScore = Math.min(100, Math.round(baseScore + experienceBonus));

    return {
      matchScore: matchScore,
      explanation: `Enhanced analysis shows ${matchedSkills.length} matching skills out of ${skillsInJob.length} required. ${matchScore >= 70 ? 'Good match!' : 'Consider adding missing skills.'} (AI analysis temporarily unavailable due to rate limits)`,
      suggestions: [
        'Add relevant technical skills mentioned in the job description',
        'Include specific project examples that demonstrate required abilities',
        'Quantify your achievements with numbers and metrics',
        'Highlight experience with the most important technologies for this role'
      ],
      skillsMatched: matchedSkills,
      skillsGap: skillsInJob.filter(skill => !matchedSkills.includes(skill))
    };
  }

  /**
   * Fallback improvement suggestions
   */
  private generateFallbackImprovements(): ResumeImprovementSuggestion[] {
    return [
      {
        section: 'Summary',
        currentText: 'Current professional summary',
        suggestedText: 'Add a compelling professional summary that highlights your key strengths',
        reason: 'A strong summary immediately captures employer attention'
      },
      {
        section: 'Skills',
        currentText: 'Current skills list',
        suggestedText: 'Organize skills by relevance and include proficiency levels',
        reason: 'Clear skill organization helps recruiters quickly assess fit'
      },
      {
        section: 'Experience',
        currentText: 'Current experience descriptions',
        suggestedText: 'Use action verbs and quantify achievements where possible',
        reason: 'Specific achievements demonstrate your impact and value'
      }
    ];
  }

  /**
   * Batch analyze resumes for multiple jobs
   */
  async batchAnalyzeResumes(resumeText: string, jobs: any[]): Promise<{jobId: string, matchResult: ResumeMatchResult}[]> {
    const results = [];
    
    for (const job of jobs) {
      try {
        const matchResult = await this.analyzeResumeJobMatch(
          resumeText, 
          job.description, 
          job.title
        );
        results.push({
          jobId: job._id.toString(),
          matchResult
        });
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error analyzing job ${job._id}:`, error);
        results.push({
          jobId: job._id.toString(),
          matchResult: this.generateFallbackMatch(resumeText, job.description)
        });
      }
    }
    
    return results;
  }

  /**
   * Extract structured data from resume text using Claude Haiku
   */
  async extractResumeStructure(resumeText: string): Promise<{
    personalInfo: { name?: string; email?: string; phone?: string; location?: string; summary?: string };
    education: Array<{ degree: string; field: string; institution: string; startYear?: number; endYear?: number; gpa?: string; isCompleted: boolean }>;
    experience: Array<{ title: string; company: string; location?: string; startDate?: string; endDate?: string; description?: string; isCurrentJob: boolean }>;
    skills: Array<{ name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert'; category: 'technical' | 'soft' | 'language' }>;
    projects?: Array<{ name: string; description: string; technologies?: string[]; url?: string }>;
    certifications?: Array<{ name: string; issuer: string; date?: string; url?: string }>;
  }> {
    if (!this.claudeApiKey) {
      console.warn('⚠️ Claude API key not configured, returning fallback structure');
      return this.generateFallbackResumeStructure(resumeText);
    }

    try {
      await this.enforceRateLimit();

      const prompt = `Please analyze this resume and extract structured information. Return ONLY a valid JSON object with no additional text or formatting.

Resume Text:
${resumeText}

Extract and structure the following information:

{
  "personalInfo": {
    "name": "Full name of the person",
    "email": "Email address",
    "phone": "Phone number", 
    "location": "City, State/Country",
    "summary": "Professional summary or objective"
  },
  "education": [
    {
      "degree": "Degree type (e.g., Bachelor of Science, Master's, etc.)",
      "field": "Field of study (e.g., Computer Science, Business)",
      "institution": "University/College name",
      "startYear": 2020,
      "endYear": 2024,
      "gpa": "GPA if mentioned",
      "isCompleted": true
    }
  ],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Work location",
      "startDate": "Start date",
      "endDate": "End date or 'Present'",
      "description": "Brief description of responsibilities",
      "isCurrentJob": false
    }
  ],
  "skills": [
    {
      "name": "Skill name",
      "level": "beginner|intermediate|advanced|expert",
      "category": "technical|soft|language"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Project description",
      "technologies": ["Tech1", "Tech2"],
      "url": "Project URL if available"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Date obtained",
      "url": "Certificate URL if available"
    }
  ]
}

Guidelines:
- Extract only information that is explicitly mentioned in the resume
- For skills, infer appropriate levels based on context (years of experience, project complexity, etc.)
- Categorize skills as technical (programming, tools), soft (communication, leadership), or language
- Use null for missing information
- For dates, use consistent format (YYYY-MM-DD or "Present" for current)
- Set isCurrentJob to true only if explicitly mentioned as current position`;

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 2000,
          temperature: 0.1,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000
        }
      );

      const content = response.data.content[0].text;
      
      // Try to parse the JSON response
      try {
        const structuredData = JSON.parse(content);
        console.log('✅ Successfully extracted structured resume data using Claude');
        return structuredData;
      } catch (parseError) {
        console.error('❌ Failed to parse Claude response as JSON:', parseError);
        console.log('Raw response:', content);
        return this.generateFallbackResumeStructure(resumeText);
      }

    } catch (error) {
      console.error('❌ Claude resume structure extraction failed:', error);
      return this.generateFallbackResumeStructure(resumeText);
    }
  }

  /**
   * Generate fallback structured data when AI is not available
   */
  private generateFallbackResumeStructure(resumeText: string) {
    const text = resumeText.toLowerCase();
    
    // Extract basic info using regex patterns
    const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = resumeText.match(/[\+]?[1-9][\d\s\-\(\)]{8,}/);
    
    // Extract skills using common patterns
    const commonTechSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'html', 'css', 'sql', 'mongodb', 
      'git', 'docker', 'aws', 'typescript', 'angular', 'vue', 'php', 'c++', 'c#'
    ];
    
    const foundSkills = commonTechSkills
      .filter(skill => text.includes(skill))
      .map(skill => ({
        name: skill.charAt(0).toUpperCase() + skill.slice(1),
        level: 'intermediate' as const,
        category: 'technical' as const
      }));

    return {
      personalInfo: {
        name: undefined,
        email: emailMatch ? emailMatch[0] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        location: undefined,
        summary: undefined
      },
      education: [] as Array<{ degree: string; field: string; institution: string; startYear?: number; endYear?: number; gpa?: string; isCompleted: boolean }>,
      experience: [] as Array<{ title: string; company: string; location?: string; startDate?: string; endDate?: string; description?: string; isCurrentJob: boolean }>,
      skills: foundSkills,
      projects: [] as Array<{ name: string; description: string; technologies?: string[]; url?: string }>,
      certifications: [] as Array<{ name: string; issuer: string; date?: string; url?: string }>
    };
  }
}

export default new AIResumeMatchingService();
