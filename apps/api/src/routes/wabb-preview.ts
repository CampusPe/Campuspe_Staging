import express from 'express';
import { Student } from '../models/Student';
import { User } from '../models/User';
import aiResumeMatchingService from '../services/ai-resume-matching';

const router = express.Router();

/**
 * WABB endpoint for generating resume preview
 * POST /api/wabb/generate-preview
 * 
 * This endpoint generates a resume preview that can be viewed before PDF generation
 */
router.post('/generate-preview', async (req, res) => {
  try {
    console.log('🚀 WABB Preview Generation Request:', req.body);
    
    const { email, phone, name, jobDescription } = req.body;
    
    // Validate required fields
    if (!email || !phone || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and job description are required',
        required: ['email', 'phone', 'jobDescription']
      });
    }
    
    // Clean phone number (remove any formatting)
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    console.log(`📱 Processing preview request for ${email} (${cleanPhone})`);
    
    // Find student profile
    let studentProfile = null;
    try {
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
        message: 'Student profile not found. Please complete your CampusPe profile first.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate AI resume content
    const personalInfo = {
      name: `${studentProfile.firstName} ${studentProfile.lastName}`.trim(),
      firstName: studentProfile.firstName,
      lastName: studentProfile.lastName,
      email,
      phone: cleanPhone,
      linkedin: studentProfile?.linkedinUrl || undefined,
      github: studentProfile?.githubUrl || undefined
    };

    // Create user profile text for AI processing
    const userProfileText = `
PERSONAL INFO:
Name: ${personalInfo.name}
Email: ${email}
Phone: ${cleanPhone}

SKILLS:
${(studentProfile?.skills || []).map((skill: any) => `- ${skill.name || skill}`).join('\n')}

EXPERIENCE:
${(studentProfile?.experience || []).map((exp: any) => 
  `- ${exp.title} at ${exp.company} (${exp.startDate || 'Date'} - ${exp.endDate || 'Present'})`
).join('\n')}

EDUCATION:
${(studentProfile?.education || []).map((edu: any) => 
  `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.endDate || 'In Progress'})`
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

    try {
      console.log('🤖 Calling Claude AI...');
      
      // Call Claude AI
      const aiResponse = await aiResumeMatchingService.callClaudeAPI(aiPrompt);
      
      console.log('🤖 AI Response received');
      console.log('Raw AI response:', JSON.stringify(aiResponse, null, 2));
      
      if (aiResponse && aiResponse.content) {
        try {
          console.log('📝 Raw AI content:', aiResponse.content);
          
          // Parse AI response
          const aiContent = JSON.parse(aiResponse.content);
          
          console.log('✅ AI content parsed successfully:', JSON.stringify(aiContent, null, 2));
          
          // Create preview data
          const previewData = {
            personalInfo,
            summary: aiContent.summary || 'Professional seeking to contribute technical expertise and drive organizational success.',
            skills: aiContent.skills || [],
            experience: (aiContent.experience || []).map((exp: any) => ({
              title: exp.title,
              company: exp.company,
              duration: exp.duration || `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
              description: Array.isArray(exp.description) ? exp.description : [exp.description || '']
            })),
            education: (aiContent.education || []).map((edu: any) => ({
              degree: edu.degree,
              institution: edu.institution,
              year: edu.year
            })),
            projects: aiContent.projects || []
          };

          // Return HTML preview
          const htmlPreview = generateResumePreviewHTML(previewData, jobDescription);
          
          res.setHeader('Content-Type', 'text/html');
          res.send(htmlPreview);
          
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          console.error('❌ Raw AI content that failed to parse:', aiResponse.content);
          
          return res.status(500).json({
            success: false,
            message: `AI response parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
            rawResponse: aiResponse.content,
            code: 'AI_PARSE_ERROR'
          });
        }
      } else {
        console.error('❌ AI service returned no content');
        return res.status(500).json({
          success: false,
          message: 'AI service returned no content',
          rawResponse: aiResponse,
          code: 'AI_NO_CONTENT'
        });
      }
    } catch (aiError: any) {
      console.error('❌ AI generation failed:', aiError);
      return res.status(500).json({
        success: false,
        message: `AI generation failed: ${aiError.message}`,
        error: aiError.stack,
        code: 'AI_SERVICE_ERROR'
      });
    }
    
  } catch (error) {
    console.error('❌ WABB Preview Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during preview generation',
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Generate HTML preview of the resume
 */
function generateResumePreviewHTML(resumeData: any, jobDescription: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Preview - ${resumeData.personalInfo.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f4f4f4; 
            padding: 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 10px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #2c3e50; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .header h1 { 
            color: #2c3e50; 
            font-size: 28px; 
            margin-bottom: 10px;
        }
        .contact { 
            font-size: 14px; 
            color: #666;
        }
        .section { 
            margin-bottom: 25px;
        }
        .section h2 { 
            color: #2c3e50; 
            font-size: 18px; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 5px; 
            margin-bottom: 15px;
        }
        .summary { 
            font-style: italic; 
            color: #555; 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px;
        }
        .skills { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px;
        }
        .skill { 
            background: #3498db; 
            color: white; 
            padding: 5px 12px; 
            border-radius: 20px; 
            font-size: 12px;
        }
        .experience-item, .education-item, .project-item { 
            margin-bottom: 20px; 
            padding: 15px; 
            border: 1px solid #e0e0e0; 
            border-radius: 5px;
        }
        .experience-item h3, .education-item h3, .project-item h3 { 
            color: #2c3e50; 
            margin-bottom: 5px;
        }
        .company, .institution { 
            color: #666; 
            font-weight: bold; 
            margin-bottom: 5px;
        }
        .duration { 
            color: #888; 
            font-size: 12px; 
            margin-bottom: 10px;
        }
        .description ul { 
            margin-left: 20px;
        }
        .description li { 
            margin-bottom: 5px;
        }
        .technologies { 
            margin-top: 10px;
        }
        .tech { 
            background: #e74c3c; 
            color: white; 
            padding: 3px 8px; 
            border-radius: 12px; 
            font-size: 11px; 
            margin-right: 5px;
        }
        .debug-info { 
            background: #fffbf0; 
            border: 1px solid #ffeaa7; 
            padding: 15px; 
            border-radius: 5px; 
            margin-top: 30px; 
            font-size: 12px;
        }
        .debug-info h3 { 
            color: #e17055; 
            margin-bottom: 10px;
        }
        .generate-pdf-btn {
            background: #27ae60;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin: 20px 0;
            display: block;
            width: 100%;
        }
        .generate-pdf-btn:hover {
            background: #229954;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${resumeData.personalInfo.name}</h1>
            <div class="contact">
                ${resumeData.personalInfo.email} • ${resumeData.personalInfo.phone}
                ${resumeData.personalInfo.linkedin ? ` • LinkedIn: ${resumeData.personalInfo.linkedin}` : ''}
                ${resumeData.personalInfo.github ? ` • GitHub: ${resumeData.personalInfo.github}` : ''}
            </div>
        </div>

        <div class="section">
            <h2>Professional Summary</h2>
            <div class="summary">${resumeData.summary}</div>
        </div>

        <div class="section">
            <h2>Skills</h2>
            <div class="skills">
                ${resumeData.skills.map((skill: string) => `<span class="skill">${skill}</span>`).join('')}
            </div>
        </div>

        ${resumeData.experience && resumeData.experience.length > 0 ? `
        <div class="section">
            <h2>Experience</h2>
            ${resumeData.experience.map((exp: any) => `
                <div class="experience-item">
                    <h3>${exp.title}</h3>
                    <div class="company">${exp.company}</div>
                    <div class="duration">${exp.duration}</div>
                    <div class="description">
                        <ul>
                            ${exp.description.map((desc: string) => `<li>${desc}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${resumeData.education && resumeData.education.length > 0 ? `
        <div class="section">
            <h2>Education</h2>
            ${resumeData.education.map((edu: any) => `
                <div class="education-item">
                    <h3>${edu.degree}</h3>
                    <div class="institution">${edu.institution}</div>
                    <div class="duration">${edu.year}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${resumeData.projects && resumeData.projects.length > 0 ? `
        <div class="section">
            <h2>Projects</h2>
            ${resumeData.projects.map((project: any) => `
                <div class="project-item">
                    <h3>${project.name}</h3>
                    <div class="description">${project.description}</div>
                    ${project.technologies && project.technologies.length > 0 ? `
                        <div class="technologies">
                            ${project.technologies.map((tech: string) => `<span class="tech">${tech}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <button class="generate-pdf-btn" onclick="generatePDF()">
            🔥 Generate PDF & Send to WhatsApp
        </button>

        <div class="debug-info">
            <h3>🔧 Debug Information</h3>
            <p><strong>Job Description:</strong> ${jobDescription.substring(0, 200)}...</p>
            <p><strong>Generated At:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Status:</strong> ✅ AI Resume Generation Successful</p>
        </div>
    </div>

    <script>
        function generatePDF() {
            const button = document.querySelector('.generate-pdf-btn');
            button.textContent = '⏳ Generating PDF...';
            button.disabled = true;
            
            // Here we would call the actual PDF generation endpoint
            fetch('/api/wabb/generate-and-share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: '${resumeData.personalInfo.email}',
                    phone: '${resumeData.personalInfo.phone}',
                    name: '${resumeData.personalInfo.name}',
                    jobDescription: \`${jobDescription}\`
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    button.textContent = '✅ PDF Generated & Sent!';
                    button.style.background = '#27ae60';
                } else {
                    button.textContent = '❌ Failed to Generate PDF';
                    button.style.background = '#e74c3c';
                    console.error('PDF generation failed:', data);
                }
            })
            .catch(error => {
                button.textContent = '❌ Error Occurred';
                button.style.background = '#e74c3c';
                console.error('Error:', error);
            });
        }
    </script>
</body>
</html>
  `;
}

export default router;
