"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class AIResumeMatchingService {
    constructor() {
        this.claudeApiKey = '';
        this.lastApiCall = 0;
        this.minDelayBetweenCalls = 1000;
        const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
        this.claudeApiKey = claudeApiKey || '';
        if (!this.claudeApiKey) {
            console.warn('⚠️ Claude API key not found in environment variables. Please set CLAUDE_API_KEY or ANTHROPIC_API_KEY');
        }
    }
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCall;
        if (timeSinceLastCall < this.minDelayBetweenCalls) {
            const delay = this.minDelayBetweenCalls - timeSinceLastCall;
            console.log(`⏱️ Rate limiting: waiting ${delay}ms before next Claude API call`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        this.lastApiCall = Date.now();
    }
    async callClaudeAPI(prompt, maxTokens = 2000) {
        if (!this.claudeApiKey) {
            throw new Error('Claude API key not available');
        }
        await this.enforceRateLimit();
        try {
            const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: maxTokens,
                messages: [{
                        role: 'user',
                        content: prompt
                    }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 30000
            });
            if (response.data?.content?.[0]?.text) {
                return {
                    content: response.data.content[0].text.trim(),
                    success: true
                };
            }
            else {
                throw new Error('Invalid response from Claude API');
            }
        }
        catch (error) {
            console.error('Claude API call failed:', error.message);
            throw error;
        }
    }
    async analyzeCompleteResume(resumeText) {
        console.log('🤖 Starting comprehensive resume analysis...');
        console.log('📝 Resume text length:', resumeText.length, 'characters');
        try {
            if (this.claudeApiKey && this.claudeApiKey.trim().length > 0) {
                console.log('🎯 Attempting Claude AI analysis...');
                await this.enforceRateLimit();
                const claudeTimeout = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Claude API timeout')), 10000);
                });
                const claudePromise = axios_1.default.post('https://api.anthropic.com/v1/messages', {
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 2000,
                    messages: [{
                            role: 'user',
                            content: `Analyze this resume comprehensively and extract all relevant information. Return ONLY a valid JSON object with the following structure:

{
  "personalInfo": {
    "name": "Full Name",
    "email": "email if found",
    "phone": "phone if found",
    "location": "location if found",
    "linkedIn": "LinkedIn URL if found",
    "github": "GitHub URL if found"
  },
  "skills": [
    {
      "name": "Skill Name",
      "level": "beginner|intermediate|advanced|expert",
      "category": "technical|business|operational|soft|language"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM or YYYY or Present",
      "description": "Job description and achievements",
      "isCurrentJob": true
    }
  ],
  "education": [
    {
      "degree": "Degree Type",
      "field": "Field of Study",
      "institution": "Institution Name",
      "startYear": 2020,
      "endYear": 2024,
      "gpa": "GPA if mentioned",
      "isCompleted": true
    }
  ],
  "jobPreferences": {
    "preferredRoles": ["inferred job roles based on experience"],
    "preferredIndustries": ["inferred industries based on background"],
    "experienceLevel": "entry|mid|senior|executive",
    "workMode": "remote|onsite|hybrid|any"
  },
  "analysisMetadata": {
    "confidence": 95,
    "extractionMethod": "AI",
    "totalYearsExperience": 5,
    "primarySkillCategory": "technical",
    "suggestedJobCategory": "Software Development"
  }
}

Resume Text:
${resumeText}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`
                        }]
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.claudeApiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    timeout: 10000
                });
                const response = await Promise.race([claudePromise, claudeTimeout]);
                if (response?.data?.content?.[0]?.text) {
                    const aiResponseText = response.data.content[0].text.trim();
                    console.log('✅ Claude AI response received');
                    console.log('📄 AI Response preview:', aiResponseText.substring(0, 200) + '...');
                    try {
                        const aiAnalysis = JSON.parse(aiResponseText);
                        aiAnalysis.analysisMetadata.analysisDate = new Date();
                        aiAnalysis.analysisMetadata.extractionMethod = 'AI';
                        console.log('🎉 Claude AI analysis successful!');
                        console.log('📊 Analysis summary:', {
                            skillsFound: aiAnalysis.skills?.length || 0,
                            experienceEntries: aiAnalysis.experience?.length || 0,
                            educationEntries: aiAnalysis.education?.length || 0,
                            confidence: aiAnalysis.analysisMetadata?.confidence || 0
                        });
                        return aiAnalysis;
                    }
                    catch (parseError) {
                        console.error('❌ Failed to parse Claude AI response as JSON:', parseError);
                        console.log('🔍 Raw AI response:', aiResponseText);
                        throw new Error('Invalid JSON response from Claude AI');
                    }
                }
                else {
                    throw new Error('No content in Claude AI response');
                }
            }
            else {
                console.log('⚠️ No Claude API key available, skipping AI analysis and using enhanced local fallback');
            }
        }
        catch (error) {
            console.error('❌ Claude AI analysis failed:', error);
            console.log('🔄 Falling back to enhanced local analysis...');
        }
        return this.comprehensiveFallbackAnalysis(resumeText);
    }
    comprehensiveFallbackAnalysis(resumeText) {
        console.log('🔧 Starting comprehensive fallback analysis...');
        const text = resumeText.toLowerCase();
        const personalInfo = this.extractPersonalInfo(resumeText);
        const skills = this.extractComprehensiveSkills(resumeText);
        const experience = this.extractExperience(resumeText);
        const education = this.extractEducation(resumeText);
        const jobPreferences = this.inferJobPreferences(resumeText, skills);
        const totalYearsExperience = this.calculateTotalExperience(experience);
        const primarySkillCategory = this.determinePrimarySkillCategory(skills);
        const analysis = {
            personalInfo,
            skills,
            experience,
            education,
            jobPreferences,
            analysisMetadata: {
                confidence: 75,
                extractionMethod: 'fallback',
                totalYearsExperience,
                primarySkillCategory,
                suggestedJobCategory: this.suggestJobCategory(skills, experience),
                analysisDate: new Date()
            }
        };
        console.log('✅ Comprehensive fallback analysis completed');
        console.log('📊 Fallback analysis summary:', {
            skillsFound: skills.length,
            experienceEntries: experience.length,
            educationEntries: education.length,
            primaryCategory: primarySkillCategory
        });
        return analysis;
    }
    extractPersonalInfo(resumeText) {
        const personalInfo = {
            name: 'Professional'
        };
        const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
        for (let i = 0; i < Math.min(3, lines.length); i++) {
            const line = lines[i].trim();
            const words = line.split(/\s+/);
            if (words.length >= 2 && words.length <= 4 &&
                words.every(word => /^[A-Za-z]+$/.test(word)) &&
                line.length < 50) {
                personalInfo.name = line;
                break;
            }
        }
        const emailMatch = resumeText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) {
            personalInfo.email = emailMatch[0];
        }
        const phoneMatch = resumeText.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
        if (phoneMatch) {
            personalInfo.phone = phoneMatch[0];
        }
        const linkedInMatch = resumeText.match(/(?:linkedin\.com\/in\/|linkedin\.com\/profile\/)[^\s]+/i);
        if (linkedInMatch) {
            personalInfo.linkedIn = linkedInMatch[0];
        }
        const githubMatch = resumeText.match(/(?:github\.com\/)[^\s]+/i);
        if (githubMatch) {
            personalInfo.github = githubMatch[0];
        }
        return personalInfo;
    }
    extractComprehensiveSkills(resumeText) {
        const text = resumeText.toLowerCase();
        const foundSkills = [];
        const skillCategories = {
            technical: [
                'javascript', 'python', 'java', 'react', 'node.js', 'html', 'css', 'sql', 'mongodb',
                'typescript', 'angular', 'vue.js', 'express.js', 'spring boot', 'django', 'flask',
                'aws', 'azure', 'docker', 'kubernetes', 'git', 'linux', 'windows', 'mysql', 'postgresql',
                'redis', 'elasticsearch', 'jenkins', 'terraform', 'ansible', 'prometheus', 'grafana',
                'microservices', 'rest api', 'graphql', 'oauth', 'jwt', 'ci/cd', 'devops', 'agile', 'scrum'
            ],
            business: [
                'project management', 'team leadership', 'strategic planning', 'business analysis',
                'financial analysis', 'budget management', 'stakeholder management', 'risk management',
                'process improvement', 'quality assurance', 'vendor management', 'contract negotiation',
                'customer relationship management', 'crm', 'sales', 'marketing', 'digital marketing',
                'social media marketing', 'content marketing', 'seo', 'sem', 'google analytics',
                'data analysis', 'reporting', 'kpi tracking', 'performance metrics', 'dashboard creation'
            ],
            operational: [
                'warehouse operations', 'inventory management', 'supply chain management', 'logistics',
                'forklift operation', 'pallet jack', 'order picking', 'shipping and receiving',
                'quality control', 'lean manufacturing', 'six sigma', 'kaizen', '5s methodology',
                'warehouse management system', 'wms', 'inventory control', 'cycle counting',
                'safety protocols', 'osha compliance', 'hazmat handling', 'cross-docking',
                'distribution', 'fulfillment', 'picking', 'packing', 'sorting', 'loading', 'unloading',
                'inventory tracking', 'stock management', 'procurement', 'vendor relations',
                'transportation', 'routing', 'scheduling', 'fleet management'
            ],
            soft: [
                'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
                'time management', 'organization', 'attention to detail', 'multitasking', 'adaptability',
                'creativity', 'innovation', 'customer service', 'conflict resolution', 'negotiation',
                'presentation', 'public speaking', 'training', 'mentoring', 'coaching', 'collaboration',
                'emotional intelligence', 'stress management', 'decision making', 'analytical thinking'
            ],
            language: [
                'english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'portuguese',
                'italian', 'russian', 'arabic', 'hindi', 'bilingual', 'multilingual', 'translation',
                'interpretation', 'native speaker', 'fluent', 'proficient', 'conversational'
            ]
        };
        for (const [category, skillList] of Object.entries(skillCategories)) {
            for (const skill of skillList) {
                if (text.includes(skill.toLowerCase())) {
                    let level = 'intermediate';
                    const skillContext = this.getSkillContext(text, skill);
                    if (skillContext.includes('expert') || skillContext.includes('advanced') ||
                        skillContext.includes('senior') || skillContext.includes('lead')) {
                        level = 'expert';
                    }
                    else if (skillContext.includes('experienced') || skillContext.includes('proficient')) {
                        level = 'advanced';
                    }
                    else if (skillContext.includes('basic') || skillContext.includes('beginner') ||
                        skillContext.includes('learning')) {
                        level = 'beginner';
                    }
                    foundSkills.push({
                        name: this.capitalizeSkill(skill),
                        level,
                        category: category
                    });
                }
            }
        }
        const uniqueSkills = foundSkills.filter((skill, index, self) => index === self.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase()));
        console.log(`🎯 Found ${uniqueSkills.length} unique skills across all categories`);
        return uniqueSkills;
    }
    getSkillContext(text, skill) {
        const skillIndex = text.toLowerCase().indexOf(skill.toLowerCase());
        if (skillIndex === -1)
            return '';
        const start = Math.max(0, skillIndex - 50);
        const end = Math.min(text.length, skillIndex + skill.length + 50);
        return text.substring(start, end).toLowerCase();
    }
    capitalizeSkill(skill) {
        const specialCases = {
            'javascript': 'JavaScript',
            'node.js': 'Node.js',
            'vue.js': 'Vue.js',
            'express.js': 'Express.js',
            'html': 'HTML',
            'css': 'CSS',
            'sql': 'SQL',
            'mongodb': 'MongoDB',
            'mysql': 'MySQL',
            'postgresql': 'PostgreSQL',
            'aws': 'AWS',
            'rest api': 'REST API',
            'graphql': 'GraphQL',
            'oauth': 'OAuth',
            'jwt': 'JWT',
            'ci/cd': 'CI/CD',
            'devops': 'DevOps',
            'crm': 'CRM',
            'seo': 'SEO',
            'sem': 'SEM',
            'wms': 'WMS',
            'osha': 'OSHA',
            '5s methodology': '5S Methodology'
        };
        if (specialCases[skill.toLowerCase()]) {
            return specialCases[skill.toLowerCase()];
        }
        return skill.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    extractExperience(resumeText) {
        const experience = [];
        const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let currentExperience = null;
        let inExperienceSection = false;
        let collectingDescription = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLower = line.toLowerCase();
            if (lineLower.includes('work experience') ||
                lineLower.includes('professional experience') ||
                lineLower.includes('employment') ||
                lineLower === 'experience') {
                inExperienceSection = true;
                continue;
            }
            if (inExperienceSection && (lineLower.includes('education') ||
                lineLower.includes('skills') ||
                lineLower.includes('projects') ||
                lineLower.includes('certificates'))) {
                if (currentExperience) {
                    experience.push(currentExperience);
                    currentExperience = null;
                }
                break;
            }
            if (inExperienceSection) {
                const jobTitlePattern = /^([A-Za-z\s&\/\-]+(?:Intern|Developer|Engineer|Manager|Analyst|Specialist|Coordinator|Assistant|Director|Lead|Senior|Junior|Associate)?)\s*$/;
                const datePattern = /(\d{2}\/\d{4}|\d{4}|\d{1,2}\/\d{4}|present|current)/i;
                if (datePattern.test(line)) {
                    if (currentExperience) {
                        experience.push(currentExperience);
                    }
                    const dateMatches = line.match(/(\d{2}\/\d{4}|\d{4}|\w+\s+\d{4})\s*[-–—]\s*(\d{2}\/\d{4}|\d{4}|\w+\s+\d{4}|present|current)/i);
                    let startDate = 'Unknown';
                    let endDate = 'Unknown';
                    let isCurrentJob = false;
                    if (dateMatches) {
                        startDate = dateMatches[1];
                        endDate = dateMatches[2];
                        isCurrentJob = dateMatches[2].toLowerCase().includes('present') || dateMatches[2].toLowerCase().includes('current');
                    }
                    const locationMatch = line.match(/[|,]\s*([A-Za-z\s,]+)$/);
                    const location = locationMatch ? locationMatch[1].trim() : 'Not specified';
                    let title = 'Professional';
                    let company = 'Company';
                    if (i > 0) {
                        const prevLine = lines[i - 1];
                        if (jobTitlePattern.test(prevLine)) {
                            title = prevLine.trim();
                        }
                    }
                    const beforeDates = line.split(dateMatches ? dateMatches[0] : '')[0];
                    if (beforeDates && beforeDates.trim()) {
                        company = beforeDates.trim();
                    }
                    else if (i > 1) {
                        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                            const checkLine = lines[j];
                            if (!jobTitlePattern.test(checkLine) && checkLine.length > 0) {
                                company = checkLine.trim();
                                break;
                            }
                        }
                    }
                    currentExperience = {
                        title: title,
                        company: company,
                        location: location,
                        startDate: startDate,
                        endDate: endDate,
                        description: '',
                        isCurrentJob: isCurrentJob
                    };
                    collectingDescription = true;
                }
                else if (collectingDescription && currentExperience && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
                    if (currentExperience.description) {
                        currentExperience.description += '\n';
                    }
                    currentExperience.description += line;
                }
                else if (jobTitlePattern.test(line) && collectingDescription) {
                    collectingDescription = false;
                }
            }
        }
        if (currentExperience) {
            experience.push(currentExperience);
        }
        return experience;
    }
    extractEducation(resumeText) {
        const education = [];
        const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let currentEducation = null;
        let inEducationSection = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineLower = line.toLowerCase();
            if (lineLower === 'education' ||
                lineLower.includes('educational background') ||
                lineLower.includes('academic') ||
                lineLower.includes('qualifications')) {
                inEducationSection = true;
                continue;
            }
            if (inEducationSection && (lineLower.includes('experience') ||
                lineLower.includes('skills') ||
                lineLower.includes('projects') ||
                lineLower.includes('certificates') ||
                lineLower.includes('achievements'))) {
                if (currentEducation) {
                    education.push(currentEducation);
                    currentEducation = null;
                }
                break;
            }
            if (inEducationSection) {
                const datePattern = /(\d{4})\s*[-–—]\s*(\d{4}|present|current|\d{4})/i;
                const degreePatterns = [
                    /^(b\.?tech|bachelor|b\.?sc|b\.?com|b\.?a|bs|ba|btech|bsc|bcom)\s*(.*)$/i,
                    /^(m\.?tech|master|m\.?sc|m\.?com|m\.?a|ms|ma|mtech|msc|mcom|mba)\s*(.*)$/i,
                    /^(ph\.?d|doctorate|doctoral)\s*(.*)$/i,
                    /^(diploma|certificate|associate)\s*(.*)$/i
                ];
                let degreeFound = false;
                for (const pattern of degreePatterns) {
                    const match = line.match(pattern);
                    if (match) {
                        if (currentEducation) {
                            education.push(currentEducation);
                        }
                        let degree = match[1];
                        let field = match[2] ? match[2].trim() : 'General Studies';
                        if (degree.toLowerCase().includes('tech') || degree.toLowerCase() === 'btech') {
                            degree = 'B.Tech';
                        }
                        else if (degree.toLowerCase().includes('bachelor') || degree.toLowerCase().startsWith('b.')) {
                            degree = 'Bachelor\'s Degree';
                        }
                        else if (degree.toLowerCase().includes('master') || degree.toLowerCase().startsWith('m.')) {
                            degree = 'Master\'s Degree';
                        }
                        else if (degree.toLowerCase().includes('phd') || degree.toLowerCase().includes('doctorate')) {
                            degree = 'PhD';
                        }
                        if (field.toLowerCase().includes('cse') || field.toLowerCase().includes('computer science')) {
                            field = 'Computer Science Engineering';
                        }
                        else if (field.toLowerCase().includes('engineering')) {
                            field = field + ' Engineering';
                        }
                        currentEducation = {
                            degree: degree,
                            field: field,
                            institution: 'Educational Institution',
                            startYear: null,
                            endYear: null,
                            gpa: null,
                            isCompleted: true
                        };
                        degreeFound = true;
                        break;
                    }
                }
                if (currentEducation && !degreeFound) {
                    if (line.match(/^[A-Z\s&\.]+$/) && line.length > 5) {
                        currentEducation.institution = line;
                    }
                    const dateMatch = line.match(datePattern);
                    if (dateMatch) {
                        currentEducation.startYear = parseInt(dateMatch[1]);
                        if (dateMatch[2].toLowerCase().includes('present') || dateMatch[2].toLowerCase().includes('current')) {
                            currentEducation.endYear = new Date().getFullYear();
                            currentEducation.isCompleted = false;
                        }
                        else {
                            currentEducation.endYear = parseInt(dateMatch[2]);
                        }
                    }
                    const singleYearMatch = line.match(/^(\d{4})$/);
                    if (singleYearMatch) {
                        currentEducation.endYear = parseInt(singleYearMatch[1]);
                        currentEducation.startYear = currentEducation.endYear - 4;
                    }
                    const institutionWithDates = line.match(/^(.+?)\s+(\d{4})\s*[-–—]\s*(\d{4}|\w+)$/);
                    if (institutionWithDates) {
                        currentEducation.institution = institutionWithDates[1].trim();
                        currentEducation.startYear = parseInt(institutionWithDates[2]);
                        if (institutionWithDates[3].toLowerCase().includes('present')) {
                            currentEducation.endYear = new Date().getFullYear();
                            currentEducation.isCompleted = false;
                        }
                        else {
                            currentEducation.endYear = parseInt(institutionWithDates[3]);
                        }
                    }
                }
            }
        }
        if (currentEducation) {
            education.push(currentEducation);
        }
        return education;
    }
    inferJobPreferences(resumeText, skills) {
        const text = resumeText.toLowerCase();
        const preferredRoles = [];
        const preferredIndustries = [];
        if (skills.some(s => s.category === 'technical')) {
            if (skills.some(s => s.name.toLowerCase().includes('react') || s.name.toLowerCase().includes('javascript'))) {
                preferredRoles.push('Frontend Developer', 'Full Stack Developer');
            }
            if (skills.some(s => s.name.toLowerCase().includes('node') || s.name.toLowerCase().includes('python'))) {
                preferredRoles.push('Backend Developer', 'Software Engineer');
            }
            if (skills.some(s => s.name.toLowerCase().includes('aws') || s.name.toLowerCase().includes('docker'))) {
                preferredRoles.push('DevOps Engineer', 'Cloud Engineer');
            }
            preferredIndustries.push('Technology', 'Software Development');
        }
        if (skills.some(s => s.category === 'operational')) {
            preferredRoles.push('Warehouse Associate', 'Logistics Coordinator', 'Operations Specialist');
            preferredIndustries.push('Logistics', 'Supply Chain', 'Manufacturing', 'Retail');
        }
        if (skills.some(s => s.category === 'business')) {
            preferredRoles.push('Business Analyst', 'Project Manager', 'Account Manager');
            preferredIndustries.push('Consulting', 'Finance', 'Marketing');
        }
        let experienceLevel = 'entry';
        if (text.includes('senior') || text.includes('lead') || text.includes('manager')) {
            experienceLevel = 'senior';
        }
        else if (text.includes('experienced') || text.includes('5+ years') || text.includes('3+ years')) {
            experienceLevel = 'mid';
        }
        return {
            preferredRoles: preferredRoles.length > 0 ? preferredRoles : ['General'],
            preferredIndustries: preferredIndustries.length > 0 ? preferredIndustries : ['General'],
            experienceLevel,
            workMode: 'any'
        };
    }
    calculateTotalExperience(experience) {
        if (experience.length === 0)
            return 0;
        let totalMonths = 0;
        for (const exp of experience) {
            const startDate = new Date(exp.startDate);
            const endDate = exp.endDate === 'Present' ? new Date() : new Date(exp.endDate);
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                const months = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
                totalMonths += months;
            }
        }
        return Math.round(totalMonths / 12 * 10) / 10;
    }
    determinePrimarySkillCategory(skills) {
        const categoryCounts = {};
        for (const skill of skills) {
            categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;
        }
        const primaryCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'general');
        return primaryCategory;
    }
    suggestJobCategory(skills, experience) {
        const primaryCategory = this.determinePrimarySkillCategory(skills);
        const categoryMap = {
            'technical': 'Software Development',
            'business': 'Business Operations',
            'operational': 'Operations & Logistics',
            'soft': 'General Management',
            'language': 'Communications'
        };
        return categoryMap[primaryCategory] || 'General';
    }
    extractSection(text, sectionNames) {
        const lowerText = text.toLowerCase();
        for (const sectionName of sectionNames) {
            const sectionIndex = lowerText.indexOf(sectionName.toLowerCase());
            if (sectionIndex !== -1) {
                const nextSectionIndex = this.findNextSectionIndex(lowerText, sectionIndex + sectionName.length);
                return text.substring(sectionIndex, nextSectionIndex);
            }
        }
        return null;
    }
    findNextSectionIndex(text, startIndex) {
        const majorSections = ['experience', 'education', 'skills', 'projects', 'certifications'];
        let nextIndex = text.length;
        for (const section of majorSections) {
            const index = text.indexOf(section, startIndex);
            if (index !== -1 && index < nextIndex) {
                nextIndex = index;
            }
        }
        return nextIndex;
    }
    parseDateRange(dateRange) {
        const cleaned = dateRange.replace(/[()]/g, '').trim();
        if (cleaned.includes(' - ')) {
            const [start, end] = cleaned.split(' - ');
            return {
                start: start.trim(),
                end: end.trim()
            };
        }
        if (cleaned.includes(' to ')) {
            const [start, end] = cleaned.split(' to ');
            return {
                start: start.trim(),
                end: end.trim()
            };
        }
        return {
            start: cleaned,
            end: 'Present'
        };
    }
    extractDegreeType(matchedText) {
        const lowerText = matchedText.toLowerCase();
        if (lowerText.includes('bachelor'))
            return 'Bachelor\'s';
        if (lowerText.includes('master'))
            return 'Master\'s';
        if (lowerText.includes('phd') || lowerText.includes('doctorate'))
            return 'PhD';
        if (lowerText.includes('associate'))
            return 'Associate';
        return 'Degree';
    }
    async analyzeResumeMatch(resumeText, jobDescription) {
        console.log('🔍 Starting resume-job match analysis...');
        try {
            if (!this.claudeApiKey) {
                console.log('⚠️ No Claude API key available, using fallback matching');
                return this.generateFallbackMatch(resumeText, jobDescription);
            }
            await this.enforceRateLimit();
            const prompt = `You are a resume analyzer. Analyze this resume against the job description and return ONLY a valid JSON response.

Resume:
${resumeText}

Job Description:
${jobDescription}

CRITICAL: Return ONLY the JSON object with no explanation, no markdown formatting, no additional text. Just pure JSON:

{
  "matchScore": 75,
  "explanation": "Good match with relevant experience...",
  "suggestions": ["Add specific project examples", "Highlight leadership experience"],
  "skillsMatched": ["JavaScript", "React", "Node.js"],
  "skillsGap": ["Docker", "AWS", "TypeScript"]
}`;
            const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1000,
                messages: [{
                        role: 'user',
                        content: prompt
                    }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 30000
            });
            if (response.data?.content?.[0]?.text) {
                try {
                    const responseText = response.data.content[0].text.trim();
                    let jsonStr = responseText;
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        jsonStr = jsonMatch[0];
                    }
                    const result = JSON.parse(jsonStr);
                    if (typeof result.matchScore !== 'number' || !result.explanation) {
                        throw new Error('Invalid JSON structure from Claude');
                    }
                    console.log('✅ Claude analysis successful - Match Score:', result.matchScore);
                    return result;
                }
                catch (parseError) {
                    console.error('❌ Failed to parse Claude response:', parseError);
                    console.error('Raw response:', response.data.content[0].text);
                    return this.generateFallbackMatch(resumeText, jobDescription);
                }
            }
        }
        catch (error) {
            console.error('❌ Claude API error:', error.response?.status, error.message);
            if (error.response?.status === 401) {
                console.error('🚫 Authentication failed - please check your Claude API key');
            }
        }
        return this.generateFallbackMatch(resumeText, jobDescription);
    }
    generateFallbackMatch(resumeText, jobDescription) {
        console.log('🔧 Generating fallback match analysis...');
        const resumeLower = resumeText.toLowerCase();
        const jobLower = jobDescription.toLowerCase();
        const jobKeywords = this.extractKeywords(jobLower);
        const resumeKeywords = this.extractKeywords(resumeLower);
        const matchingKeywords = jobKeywords.filter(keyword => resumeKeywords.some(resumeKeyword => resumeKeyword.includes(keyword) || keyword.includes(resumeKeyword)));
        const matchScore = Math.min(100, Math.round((matchingKeywords.length / Math.max(jobKeywords.length, 1)) * 100));
        const suggestions = [
            'Consider adding more specific technical skills mentioned in the job description',
            'Include quantifiable achievements and metrics',
            'Tailor your experience descriptions to match job requirements',
            'Add relevant keywords from the job posting'
        ];
        const skillsMatched = matchingKeywords.slice(0, 10);
        const skillsGap = jobKeywords.filter(keyword => !matchingKeywords.includes(keyword)).slice(0, 8);
        return {
            matchScore,
            explanation: `Based on keyword analysis, your resume has a ${matchScore}% match with this job. ${matchingKeywords.length} key terms align with the job requirements.`,
            suggestions,
            skillsMatched,
            skillsGap
        };
    }
    extractKeywords(text) {
        const keywords = [
            'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'typescript',
            'aws', 'azure', 'docker', 'kubernetes', 'git', 'sql', 'mongodb', 'postgresql',
            'project management', 'leadership', 'team', 'agile', 'scrum', 'communication',
            'problem solving', 'analysis', 'design', 'development', 'testing', 'deployment',
            'warehouse', 'logistics', 'inventory', 'supply chain', 'operations', 'quality',
            'safety', 'manufacturing', 'distribution', 'procurement', 'vendor management'
        ];
        return keywords.filter(keyword => text.includes(keyword));
    }
    async generateImprovementSuggestions(resumeText) {
        console.log('💡 Generating resume improvement suggestions...');
        try {
            if (!this.claudeApiKey) {
                return this.generateFallbackSuggestions(resumeText);
            }
            await this.enforceRateLimit();
            const prompt = `Analyze this resume and provide specific improvement suggestions for each section.

Resume:
${resumeText}

Please provide improvement suggestions in JSON format:
[
  {
    "section": "Summary",
    "currentText": "Current text from resume",
    "suggestedText": "Improved version",
    "reason": "Why this improvement helps"
  }
]

Focus on:
- Making achievements more quantifiable
- Using stronger action verbs
- Better keyword optimization
- Improving clarity and impact`;
            const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1500,
                messages: [{
                        role: 'user',
                        content: prompt
                    }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 30000
            });
            if (response.data?.content?.[0]?.text) {
                try {
                    const suggestions = JSON.parse(response.data.content[0].text.trim());
                    console.log('✅ Generated', suggestions.length, 'improvement suggestions');
                    return suggestions;
                }
                catch (parseError) {
                    console.error('❌ Failed to parse suggestions:', parseError);
                    return this.generateFallbackSuggestions(resumeText);
                }
            }
        }
        catch (error) {
            console.error('❌ Error generating suggestions:', error.message);
        }
        return this.generateFallbackSuggestions(resumeText);
    }
    generateFallbackSuggestions(resumeText) {
        return [
            {
                section: 'Overall',
                currentText: 'General resume structure',
                suggestedText: 'Add more quantifiable achievements and specific metrics',
                reason: 'Numbers and metrics make your accomplishments more credible and impactful'
            },
            {
                section: 'Experience',
                currentText: 'Job descriptions',
                suggestedText: 'Use strong action verbs and focus on results rather than responsibilities',
                reason: 'Action-oriented language demonstrates initiative and achievement'
            },
            {
                section: 'Skills',
                currentText: 'Skills list',
                suggestedText: 'Organize skills by category and include proficiency levels',
                reason: 'Categorized skills with levels help recruiters quickly assess your capabilities'
            }
        ];
    }
}
exports.default = new AIResumeMatchingService();
