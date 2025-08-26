"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const models_1 = require("../models");
class AIMatchingService {
    constructor() {
        this.jobEmbeddings = new Map();
        this.studentEmbeddings = new Map();
        this.claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
        console.log('AI Matching Service initialized with Claude API key:', this.claudeApiKey ? 'Present' : 'Missing');
    }
    async analyzeJobDescription(jobDescription) {
        const prompt = `
You are a professional AI Career Assistant designed to extract structured data from Job Descriptions.

TASK: Analyze the following Job Description and extract structured information in JSON format.

JOB DESCRIPTION:
"""
${jobDescription}
"""

RETURN JSON STRUCTURE:
{
    "type": "job",
    "category": "Tech | Non-Tech | Core",
    "work_mode": "Onsite | Remote | Hybrid",
    "skills": ["skill1", "skill2", "skill3"],
    "tools": ["tool1", "tool2"],
    "job_function": "Job Function like Software Development, Marketing, Sales, Data Analysis",
    "role_summary": "One short professional summary of the role"
}

RULES:
- Always return valid JSON with no extra text
- All skills and tools must be lowercase
- Focus on job-relevant technical and domain skills
- Use concise professional phrasing
- Only output the JSON object
        `.trim();
        try {
            const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1500,
                messages: [
                    {
                        role: 'user',
                        content: `You are an expert job analysis AI. Return only valid JSON.\n\n${prompt}`
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
            try {
                const analysis = JSON.parse(response.data.content[0].text);
                return analysis;
            }
            catch (parseError) {
                console.error('Error parsing job analysis JSON:', parseError);
                let cleanResponse = response.data.content[0].text.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                }
                else if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                const analysis = JSON.parse(cleanResponse);
                return analysis;
            }
        }
        catch (error) {
            console.error('Error analyzing job description:', error);
            return this.fallbackJobAnalysis(jobDescription);
        }
    }
    async analyzeStudentResume(resumeText) {
        const prompt = `
You are a professional AI Career Assistant designed to extract structured data from Student Resumes.

TASK: Analyze the following Student Resume and extract structured information in JSON format.

RESUME TEXT:
"""
${resumeText}
"""

RETURN JSON STRUCTURE:
{
    "type": "resume",
    "skills": ["skill1", "skill2", "skill3"],
    "tools": ["tool1", "tool2"],
    "work_mode_preference": "Onsite | Remote | Hybrid | Any",
    "category_preference": "Tech | Non-Tech | Core",
    "experience_years": "X years",
    "education": "Highest Degree or Qualification",
    "career_summary": "Brief 1-2 sentence professional summary"
}

RULES:
- Always return valid JSON with no extra text
- All skills and tools must be lowercase
- Focus on technical, domain, or industry skills
- Use concise professional phrasing
- Only output the JSON object
        `.trim();
        try {
            const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1500,
                messages: [
                    {
                        role: 'user',
                        content: `You are an expert resume analysis AI. Return only valid JSON.\n\n${prompt}`
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
            try {
                const analysis = JSON.parse(response.data.content[0].text);
                return analysis;
            }
            catch (parseError) {
                console.error('Error parsing resume analysis JSON:', parseError);
                let cleanResponse = response.data.content[0].text.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                }
                else if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
                }
                const analysis = JSON.parse(cleanResponse);
                return analysis;
            }
        }
        catch (error) {
            console.error('Error analyzing resume:', error);
            return this.fallbackResumeAnalysis(resumeText);
        }
    }
    async createJobEmbedding(jobId, jobData) {
        const jobText = `${jobData.title} ${jobData.description} ${jobData.requirements?.map((r) => r.skill).join(' ')}`;
        try {
            const embedding = await this.generateEmbedding(jobText);
            const aiAnalysis = await this.analyzeJobDescription(jobData.description);
            const jobEmbedding = {
                jobId,
                embedding,
                metadata: aiAnalysis,
                createdAt: new Date()
            };
            this.jobEmbeddings.set(jobId.toString(), jobEmbedding);
            return jobEmbedding;
        }
        catch (error) {
            console.error('Error creating job embedding:', error);
            throw error;
        }
    }
    async createStudentEmbedding(studentId, studentData) {
        const resumeText = this.buildResumeText(studentData);
        try {
            const embedding = await this.generateEmbedding(resumeText);
            const aiAnalysis = await this.analyzeStudentResume(resumeText);
            const studentEmbedding = {
                studentId,
                embedding,
                metadata: aiAnalysis,
                createdAt: new Date()
            };
            this.studentEmbeddings.set(studentId.toString(), studentEmbedding);
            return studentEmbedding;
        }
        catch (error) {
            console.error('Error creating student embedding:', error);
            throw error;
        }
    }
    async calculateAdvancedMatch(studentId, jobId) {
        const student = await models_1.Student.findById(studentId).lean();
        const job = await models_1.Job.findById(jobId).lean();
        if (!student || !job) {
            throw new Error('Student or Job not found');
        }
        let studentEmbedding = this.studentEmbeddings.get(studentId.toString());
        if (!studentEmbedding) {
            studentEmbedding = await this.createStudentEmbedding(studentId, student);
        }
        let jobEmbedding = this.jobEmbeddings.get(jobId.toString());
        if (!jobEmbedding) {
            jobEmbedding = await this.createJobEmbedding(jobId, job);
        }
        const studentSkills = studentEmbedding.metadata.skills;
        const studentTools = studentEmbedding.metadata.tools;
        const jobSkills = jobEmbedding.metadata.skills;
        const jobTools = jobEmbedding.metadata.tools;
        const matchedSkills = studentSkills.filter(skill => jobSkills.some(jobSkill => skill.includes(jobSkill) || jobSkill.includes(skill)));
        const matchedTools = studentTools.filter(tool => jobTools.some(jobTool => tool.includes(jobTool) || jobTool.includes(tool)));
        const skillMatch = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0;
        const toolMatch = jobTools.length > 0 ? matchedTools.length / jobTools.length : 0;
        const categoryMatch = studentEmbedding.metadata.category_preference === jobEmbedding.metadata.category ? 1 : 0;
        const workModeMatch = this.calculateWorkModeMatch(studentEmbedding.metadata.work_mode_preference, jobEmbedding.metadata.work_mode);
        const semanticSimilarity = this.cosineSimilarity(studentEmbedding.embedding, jobEmbedding.embedding);
        const finalMatchScore = (skillMatch * 0.5) +
            (toolMatch * 0.1) +
            (categoryMatch * 0.1) +
            (workModeMatch * 0.1) +
            (semanticSimilarity * 0.2);
        return {
            studentId,
            jobId,
            finalMatchScore,
            skillMatch,
            toolMatch,
            categoryMatch,
            workModeMatch,
            semanticSimilarity,
            matchedSkills,
            matchedTools
        };
    }
    async findMatchingStudents(jobId, threshold = 0.70) {
        console.log(`🔍 Finding matching students for job ${jobId} with threshold ${threshold * 100}%`);
        const eligibleStudents = await models_1.Student.find({
            isActive: true
        }).select('_id firstName lastName').lean();
        console.log(`📊 Found ${eligibleStudents.length} total active students to analyze`);
        const matches = [];
        let processedCount = 0;
        let errorCount = 0;
        for (const student of eligibleStudents) {
            try {
                processedCount++;
                const matchResult = await this.calculateAdvancedMatch(student._id, jobId);
                console.log(`Student ${student.firstName} ${student.lastName}: ${Math.round(matchResult.finalMatchScore * 100)}% match`);
                if (matchResult.finalMatchScore >= threshold) {
                    matches.push(matchResult);
                    console.log(`✅ Match found: ${student.firstName} ${student.lastName} - ${Math.round(matchResult.finalMatchScore * 100)}%`);
                }
                else {
                    console.log(`❌ Below threshold: ${student.firstName} ${student.lastName} - ${Math.round(matchResult.finalMatchScore * 100)}%`);
                }
                if (processedCount % 10 === 0) {
                    console.log(`📈 Progress: ${processedCount}/${eligibleStudents.length} students processed, ${matches.length} matches found`);
                }
            }
            catch (error) {
                errorCount++;
                console.error(`❌ Error calculating match for student ${student._id} (${student.firstName} ${student.lastName}):`, error);
            }
        }
        console.log(`🎯 Matching complete: ${processedCount} students analyzed, ${matches.length} matches found, ${errorCount} errors`);
        matches.sort((a, b) => b.finalMatchScore - a.finalMatchScore);
        return matches;
    }
    async generateEmbedding(text) {
        console.log('📊 Using fallback embedding generation (Claude does not provide embeddings)');
        return this.generateSimpleEmbedding(text);
    }
    generateSimpleEmbedding(text) {
        const words = text.toLowerCase().split(/\s+/);
        const embedding = new Array(384).fill(0);
        words.forEach((word, index) => {
            const hash = this.simpleHash(word);
            const embeddingIndex = Math.abs(hash) % embedding.length;
            embedding[embeddingIndex] += 1;
        });
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length)
            return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    calculateWorkModeMatch(studentPreference, jobMode) {
        if (studentPreference === 'Any')
            return 1;
        if (studentPreference === jobMode)
            return 1;
        if (studentPreference === 'Hybrid' && (jobMode === 'Remote' || jobMode === 'Onsite'))
            return 0.7;
        return 0;
    }
    buildResumeText(studentData) {
        let resumeText = '';
        if (studentData.firstName && studentData.lastName) {
            resumeText += `${studentData.firstName} ${studentData.lastName}\n\n`;
        }
        if (studentData.skills && Array.isArray(studentData.skills)) {
            resumeText += 'Skills: ' + studentData.skills.map((skill) => skill.name || skill).join(', ') + '\n\n';
        }
        if (studentData.experience && Array.isArray(studentData.experience)) {
            resumeText += 'Experience:\n';
            studentData.experience.forEach((exp) => {
                resumeText += `${exp.title} at ${exp.company}. ${exp.description || ''}\n`;
            });
            resumeText += '\n';
        }
        if (studentData.education && Array.isArray(studentData.education)) {
            resumeText += 'Education:\n';
            studentData.education.forEach((edu) => {
                resumeText += `${edu.degree} in ${edu.field} from ${edu.institution}\n`;
            });
        }
        return resumeText || 'No resume information available';
    }
    fallbackJobAnalysis(jobDescription) {
        const skills = this.extractSkillsFromText(jobDescription);
        const isRemote = /remote|work from home|wfh/i.test(jobDescription);
        const isHybrid = /hybrid|flexible/i.test(jobDescription);
        const workMode = isRemote ? 'Remote' : isHybrid ? 'Hybrid' : 'Onsite';
        const isTech = /software|developer|programmer|engineer|tech|coding|programming/i.test(jobDescription);
        const category = isTech ? 'Tech' : 'Non-Tech';
        return {
            type: 'job',
            category,
            work_mode: workMode,
            skills: skills.slice(0, 10),
            tools: this.extractToolsFromText(jobDescription).slice(0, 5),
            job_function: 'General',
            role_summary: jobDescription.slice(0, 100) + '...'
        };
    }
    fallbackResumeAnalysis(resumeText) {
        const skills = this.extractSkillsFromText(resumeText);
        const tools = this.extractToolsFromText(resumeText);
        const isTech = /software|developer|engineer|programming|coding|tech/i.test(resumeText);
        const category = isTech ? 'Tech' : 'Non-Tech';
        return {
            type: 'resume',
            skills: skills.slice(0, 10),
            tools: tools.slice(0, 5),
            work_mode_preference: 'Any',
            category_preference: category,
            experience_years: '0-2 years',
            education: 'Bachelor\'s Degree',
            career_summary: resumeText.slice(0, 100) + '...'
        };
    }
    extractSkillsFromText(text) {
        const commonSkills = [
            'javascript', 'python', 'java', 'react', 'nodejs', 'angular', 'vue',
            'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'docker',
            'kubernetes', 'git', 'typescript', 'express', 'flask', 'django',
            'spring', 'laravel', 'php', 'ruby', 'golang', 'c++', 'c#',
            'marketing', 'sales', 'accounting', 'finance', 'hr', 'design',
            'photoshop', 'illustrator', 'figma', 'sketch', 'communication'
        ];
        const lowerText = text.toLowerCase();
        return commonSkills.filter(skill => lowerText.includes(skill));
    }
    extractToolsFromText(text) {
        const commonTools = [
            'jira', 'slack', 'trello', 'github', 'gitlab', 'jenkins', 'tableau',
            'powerbi', 'excel', 'word', 'powerpoint', 'salesforce', 'hubspot',
            'google analytics', 'adobe', 'canva', 'notion', 'confluence'
        ];
        const lowerText = text.toLowerCase();
        return commonTools.filter(tool => lowerText.includes(tool));
    }
}
exports.default = new AIMatchingService();
