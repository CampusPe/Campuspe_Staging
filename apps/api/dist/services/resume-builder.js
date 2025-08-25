"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const Student_1 = require("../models/Student");
const pdfkit_1 = __importDefault(require("pdfkit"));
const azure_pdf_service_1 = __importDefault(require("./azure-pdf-service"));
const htmlToPdf = require('html-pdf-node');
class ResumeBuilderService {
    constructor() {
        this.browser = null;
    }
    async initBrowser() {
        if (!this.browser) {
            const isAzure = process.env.WEBSITE_SITE_NAME || process.env.NODE_ENV === 'production';
            let puppeteerConfig = {
                headless: true,
                timeout: 60000,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-ipc-flooding-protection',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--memory-pressure-off',
                    '--max_old_space_size=4096',
                    '--ignore-certificate-errors',
                    '--ignore-ssl-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--disable-features=TranslateUI'
                ]
            };
            if (isAzure) {
                try {
                    const chromium = require('chrome-aws-lambda');
                    puppeteerConfig = {
                        ...puppeteerConfig,
                        args: [...chromium.args, ...puppeteerConfig.args],
                        defaultViewport: chromium.defaultViewport,
                        executablePath: await chromium.executablePath,
                        headless: chromium.headless,
                    };
                    console.log('✅ Using chrome-aws-lambda for Azure compatibility');
                }
                catch (chromiumError) {
                    console.log('⚠️ chrome-aws-lambda not available, trying system Chrome paths...');
                    const possiblePaths = [
                        '/usr/bin/google-chrome-stable',
                        '/usr/bin/google-chrome',
                        '/usr/bin/chromium-browser',
                        '/usr/bin/chromium',
                        '/opt/google/chrome/chrome',
                        process.env.CHROME_BIN
                    ].filter(Boolean);
                    for (const chromePath of possiblePaths) {
                        try {
                            const fs = require('fs');
                            if (fs.existsSync(chromePath)) {
                                puppeteerConfig.executablePath = chromePath;
                                console.log(`🔍 Found Chrome at: ${chromePath}`);
                                break;
                            }
                        }
                        catch (e) {
                        }
                    }
                    if (!puppeteerConfig.executablePath) {
                        console.log('⚠️ No Chrome executable found on Azure');
                    }
                }
            }
            else {
                puppeteerConfig.args = [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ];
            }
            console.log('🌐 Initializing browser for', isAzure ? 'Azure' : 'local', 'environment');
            console.log('🔧 Puppeteer config args count:', puppeteerConfig.args.length);
            try {
                this.browser = await puppeteer_1.default.launch(puppeteerConfig);
                console.log('✅ Browser initialized successfully');
                const testPage = await this.browser.newPage();
                await testPage.goto('data:text/html,<h1>Test</h1>', { waitUntil: 'load', timeout: 10000 });
                await testPage.close();
                console.log('✅ Browser test successful');
            }
            catch (error) {
                console.error('❌ Failed to initialize browser:', error);
                console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
                console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
                this.browser = null;
                console.log('⚠️ Browser initialization failed, PDF generation will use fallback');
                throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        return this.browser;
    }
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    async analyzeJobDescription(jobDescription) {
        try {
            console.log('🔍 Analyzing job description with AI...');
            return this.fallbackJobAnalysis(jobDescription);
        }
        catch (error) {
            console.error('❌ Error analyzing job description:', error);
            return this.fallbackJobAnalysis(jobDescription);
        }
    }
    fallbackJobAnalysis(jobDescription) {
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
        const foundSkills = [];
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
    async getStudentData(email, phoneNumber) {
        try {
            console.log(`📋 Fetching student data for email: ${email}, phone: ${phoneNumber}`);
            let student = await Student_1.Student.findOne({ email: email }).populate('userId');
            if (!student && phoneNumber) {
                student = await Student_1.Student.findOne({ phoneNumber: phoneNumber }).populate('userId');
            }
            if (!student) {
                console.log('📋 Student not found in students collection, checking users collection...');
                const { User } = require('../models/User');
                let user = await User.findOne({ email: email });
                if (!user && phoneNumber) {
                    user = await User.findOne({ phone: phoneNumber });
                }
                if (user) {
                    console.log(`✅ User found in users collection: ${user.email}`);
                    const mongoose = require('mongoose');
                    const studentData = {
                        userId: user._id,
                        firstName: user.firstName || user.name?.split(' ')[0] || 'Student',
                        lastName: user.lastName || user.name?.split(' ')[1] || 'User',
                        email: user.email || email,
                        phoneNumber: user.phone || phoneNumber,
                        collegeId: new mongoose.Types.ObjectId(),
                        studentId: `STU${Date.now()}`,
                        enrollmentYear: new Date().getFullYear(),
                        education: [],
                        experience: [],
                        skills: [
                            { name: 'JavaScript', level: 'intermediate', category: 'technical' },
                            { name: 'React', level: 'intermediate', category: 'technical' },
                            { name: 'Node.js', level: 'intermediate', category: 'technical' },
                            { name: 'Problem Solving', level: 'advanced', category: 'soft' }
                        ],
                        jobPreferences: {
                            jobTypes: ['Software Engineer'],
                            preferredLocations: ['Any'],
                            workMode: 'any'
                        },
                        profileCompleteness: 40,
                        isActive: true,
                        isPlacementReady: false
                    };
                    student = new Student_1.Student(studentData);
                    await student.save();
                    console.log('✅ Created basic student profile from user data');
                }
                else {
                    console.log('❌ User not found in any collection');
                    return null;
                }
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
                    location: 'India'
                },
                education: student.education && student.education.length > 0 ? student.education : [
                    {
                        degree: 'Bachelor of Technology',
                        field: 'Computer Science',
                        institution: 'University',
                        startDate: new Date(new Date().getFullYear() - 4, 0, 1),
                        endDate: new Date(),
                        isCompleted: true
                    }
                ],
                experience: student.experience && student.experience.length > 0 ? student.experience : [
                    {
                        title: 'Software Developer',
                        company: 'Tech Company',
                        location: 'India',
                        startDate: new Date(new Date().getFullYear() - 1, 0, 1),
                        endDate: new Date(),
                        description: 'Developed web applications using modern technologies and frameworks. Collaborated with cross-functional teams to deliver high-quality software solutions.',
                        isCurrentJob: true
                    }
                ],
                skills: student.skills && student.skills.length > 0 ? student.skills : [
                    { name: 'JavaScript', level: 'intermediate', category: 'technical' },
                    { name: 'React', level: 'intermediate', category: 'technical' },
                    { name: 'Node.js', level: 'intermediate', category: 'technical' },
                    { name: 'MongoDB', level: 'intermediate', category: 'technical' },
                    { name: 'Problem Solving', level: 'advanced', category: 'soft' },
                    { name: 'Team Collaboration', level: 'advanced', category: 'soft' }
                ],
                projects: (student.resumeAnalysis?.extractedDetails?.projects || []).filter((p) => p.name && p.description).map((p) => ({
                    name: p.name || '',
                    description: p.description || '',
                    technologies: p.technologies || [],
                    link: p.link
                })),
                certifications: (student.resumeAnalysis?.extractedDetails?.certifications || []).filter((c) => c.name && c.organization && c.year).map((c) => ({
                    name: c.name || '',
                    year: c.year || new Date().getFullYear(),
                    organization: c.organization || ''
                }))
            };
        }
        catch (error) {
            console.error('❌ Error fetching student data:', error);
            return null;
        }
    }
    tailorResumeForJob(studentData, jobAnalysis) {
        console.log('🎯 Tailoring resume for job requirements...');
        const tailoredResume = JSON.parse(JSON.stringify(studentData));
        const prioritizedSkills = [];
        const requiredSkillsLower = jobAnalysis.requiredSkills.map(s => s.toLowerCase());
        const preferredSkillsLower = jobAnalysis.preferredSkills.map(s => s.toLowerCase());
        for (const skill of tailoredResume.skills) {
            if (requiredSkillsLower.includes(skill.name.toLowerCase())) {
                prioritizedSkills.push({ ...skill, priority: 'high' });
            }
        }
        for (const skill of tailoredResume.skills) {
            if (preferredSkillsLower.includes(skill.name.toLowerCase()) &&
                !prioritizedSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
                prioritizedSkills.push({ ...skill, priority: 'medium' });
            }
        }
        for (const skill of tailoredResume.skills) {
            if (!prioritizedSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase())) {
                prioritizedSkills.push({ ...skill, priority: 'low' });
            }
        }
        tailoredResume.skills = prioritizedSkills.slice(0, 12);
        const matchingSkills = prioritizedSkills.filter(s => s.priority === 'high').map(s => s.name);
        const summaryTemplate = this.generateTailoredSummary(studentData, jobAnalysis, matchingSkills);
        tailoredResume.summary = summaryTemplate;
        console.log(`✅ Resume tailored with ${matchingSkills.length} matching skills`);
        return tailoredResume;
    }
    generateTailoredSummary(studentData, jobAnalysis, matchingSkills) {
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
    calculateExperience(experience) {
        if (!experience || experience.length === 0)
            return 0;
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
    generateResumeHTML(resumeData) {
        const formatDate = (date, isCurrentJob = false) => {
            if (isCurrentJob)
                return 'Present';
            if (!date)
                return '';
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
                                ${category.skills.map((skill) => `
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
    groupSkillsByCategory(skills) {
        const categories = new Map();
        skills.forEach(skill => {
            const category = skill.category || 'Technical';
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category).push(skill);
        });
        return Array.from(categories.entries()).map(([name, skills]) => ({
            name: this.formatCategoryName(name),
            skills
        }));
    }
    formatCategoryName(categoryName) {
        const categoryMappings = {
            'technical': 'Technical',
            'Technical': 'Technical',
            'soft': 'Soft Skills',
            'language': 'Languages',
            'languages': 'Languages',
            'certification': 'Certifications',
            'tool': 'Tools & Platforms',
            'tools': 'Tools & Platforms',
            'framework': 'Frameworks',
            'frameworks': 'Frameworks'
        };
        const lowerName = categoryName.toLowerCase();
        return categoryMappings[lowerName] || categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    }
    async generatePDF(htmlContent) {
        console.log('📄 Starting Azure-optimized PDF generation...');
        try {
            console.log('� Attempting structured PDF generation...');
            const resumeData = this.parseResumeHTML(htmlContent);
            const pdfBuffer = await this.generateStructuredPDF(resumeData);
            console.log('✅ Structured PDF generated successfully, size:', pdfBuffer.length, 'bytes');
            return pdfBuffer;
        }
        catch (structuredError) {
            console.log('⚠️ Structured PDF failed:', structuredError?.message || 'Unknown error');
        }
        try {
            console.log('�️ Attempting Azure PDF Service...');
            if (await azure_pdf_service_1.default.healthCheck()) {
                const pdfBuffer = await azure_pdf_service_1.default.generatePDF(htmlContent);
                console.log('✅ Azure PDF Service generated successfully, size:', pdfBuffer.length, 'bytes');
                return pdfBuffer;
            }
            else {
                console.log('⚠️ Azure PDF Service not available, trying next strategy...');
            }
        }
        catch (azureError) {
            console.log('⚠️ Azure PDF Service failed:', azureError?.message || 'Unknown error');
        }
        try {
            console.log('📄 Attempting html-pdf-node generation...');
            const pdfBuffer = await this.generateHtmlToPdfFallback(htmlContent);
            console.log('✅ html-pdf-node PDF generated successfully, size:', pdfBuffer.length, 'bytes');
            return pdfBuffer;
        }
        catch (htmlPdfError) {
            console.log('⚠️ html-pdf-node failed:', htmlPdfError?.message || 'Unknown error');
        }
        try {
            console.log('🔄 Using enhanced fallback PDF generation...');
            const pdfBuffer = await this.generateEnhancedFallbackPDF(htmlContent);
            console.log('✅ Enhanced fallback PDF generated successfully, size:', pdfBuffer.length, 'bytes');
            return pdfBuffer;
        }
        catch (fallbackError) {
            console.error('❌ All PDF generation strategies failed:', fallbackError?.message || 'Unknown error');
            throw new Error('PDF generation failed: All strategies exhausted. Please try again later or contact support.');
        }
    }
    async generateHtmlToPdfFallback(htmlContent) {
        console.log('📄 Using html-pdf-node fallback PDF generation...');
        try {
            const options = {
                format: 'A4',
                border: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                },
                printBackground: true,
                displayHeaderFooter: false,
                preferCSSPageSize: false,
                timeout: 30000,
                height: '11.7in',
                width: '8.27in'
            };
            const file = { content: htmlContent };
            console.log('🔄 Converting HTML to PDF with html-pdf-node...');
            const pdfBuffer = await new Promise((resolve, reject) => {
                htmlToPdf.generatePdf(file, options)
                    .then((buffer) => {
                    console.log('✅ PDF generated successfully with html-pdf-node, size:', buffer.length, 'bytes');
                    resolve(buffer);
                })
                    .catch((error) => {
                    console.error('❌ html-pdf-node generation error:', error);
                    reject(error);
                });
            });
            return pdfBuffer;
        }
        catch (error) {
            console.error('❌ html-pdf-node PDF generation failed:', error);
            throw new Error(`html-pdf-node fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateStructuredPDF(resumeData) {
        console.log('🎨 Generating professional structured PDF...');
        try {
            const doc = new pdfkit_1.default({
                size: 'A4',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    console.log('✅ Professional PDF generated successfully, size:', pdfBuffer.length, 'bytes');
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);
                const colors = {
                    primaryBlue: '#4472C4',
                    darkBlue: '#2F5497',
                    lightBlue: '#D9E2F3',
                    textDark: '#333333',
                    textGray: '#666666',
                    textLight: '#999999',
                    lineColor: '#CCCCCC'
                };
                const pageWidth = 595.28;
                const pageHeight = 841.89;
                const leftMargin = 40;
                const rightMargin = 40;
                const contentWidth = pageWidth - leftMargin - rightMargin;
                let yPos = 40;
                const checkPageBreak = (requiredHeight) => {
                    if (yPos + requiredHeight > 760) {
                        doc.addPage();
                        yPos = 40;
                    }
                };
                const drawSectionHeader = (title, y) => {
                    doc.rect(leftMargin, y - 5, contentWidth, 22)
                        .fillColor(colors.lightBlue)
                        .fill();
                    doc.fontSize(12)
                        .fillColor(colors.primaryBlue)
                        .font('Helvetica-Bold')
                        .text(title, leftMargin + 8, y + 3);
                };
                const fullName = `${resumeData.personalInfo.firstName.toUpperCase()} ${resumeData.personalInfo.lastName.toUpperCase()}`;
                doc.fontSize(24)
                    .fillColor(colors.darkBlue)
                    .font('Helvetica-Bold')
                    .text(fullName, leftMargin, yPos, {
                    width: contentWidth,
                    align: 'center'
                });
                yPos += 30;
                let jobTitle = '';
                if (resumeData.experience && resumeData.experience.length > 0) {
                    jobTitle = resumeData.experience[0].title.toUpperCase();
                }
                else {
                    jobTitle = 'PROFESSIONAL';
                }
                doc.fontSize(12)
                    .fillColor(colors.primaryBlue)
                    .font('Helvetica')
                    .text(jobTitle, leftMargin, yPos, {
                    width: contentWidth,
                    align: 'center'
                });
                yPos += 20;
                const contactItems = [];
                if (resumeData.personalInfo.email)
                    contactItems.push(resumeData.personalInfo.email);
                if (resumeData.personalInfo.phone)
                    contactItems.push(resumeData.personalInfo.phone);
                if (resumeData.personalInfo.linkedin)
                    contactItems.push('LinkedIn');
                if (resumeData.personalInfo.github)
                    contactItems.push('GitHub');
                const contactText = contactItems.join(' • ');
                doc.fontSize(9)
                    .fillColor(colors.textGray)
                    .font('Helvetica')
                    .text(contactText, leftMargin, yPos, {
                    width: contentWidth,
                    align: 'center'
                });
                yPos += 20;
                doc.moveTo(leftMargin, yPos)
                    .lineTo(pageWidth - rightMargin, yPos)
                    .strokeColor(colors.primaryBlue)
                    .lineWidth(2)
                    .stroke();
                yPos += 25;
                if (resumeData.summary) {
                    checkPageBreak(80);
                    drawSectionHeader('PROFESSIONAL SUMMARY', yPos);
                    yPos += 30;
                    doc.fontSize(10)
                        .fillColor(colors.textDark)
                        .font('Helvetica')
                        .text(resumeData.summary, leftMargin + 5, yPos, {
                        width: contentWidth - 10,
                        align: 'justify',
                        lineGap: 4
                    });
                    yPos += doc.heightOfString(resumeData.summary, { width: contentWidth - 10, lineGap: 4 }) + 20;
                }
                if (resumeData.skills && resumeData.skills.length > 0) {
                    checkPageBreak(120);
                    drawSectionHeader('SKILLS & TECHNOLOGIES', yPos);
                    yPos += 30;
                    const skillGroups = this.groupSkillsByCategory(resumeData.skills);
                    skillGroups.forEach((group, index) => {
                        if (index > 0)
                            checkPageBreak(30);
                        doc.fontSize(10)
                            .fillColor(colors.primaryBlue)
                            .font('Helvetica-Bold')
                            .text(`${group.name}:`, leftMargin + 5, yPos, { width: 80 });
                        const skillsList = group.skills.map((skill) => skill.name).join(' • ');
                        doc.fontSize(9)
                            .fillColor(colors.textDark)
                            .font('Helvetica')
                            .text(skillsList, leftMargin + 90, yPos, {
                            width: contentWidth - 95,
                            lineGap: 2,
                            align: 'left'
                        });
                        const skillsHeight = doc.heightOfString(skillsList, {
                            width: contentWidth - 95,
                            lineGap: 2
                        });
                        yPos += Math.max(16, skillsHeight + 4);
                    });
                    yPos += 15;
                }
                if (resumeData.experience && resumeData.experience.length > 0) {
                    checkPageBreak(100);
                    drawSectionHeader('PROFESSIONAL EXPERIENCE', yPos);
                    yPos += 30;
                    resumeData.experience.forEach((exp, index) => {
                        checkPageBreak(70);
                        doc.fontSize(11)
                            .fillColor(colors.primaryBlue)
                            .font('Helvetica-Bold')
                            .text(exp.title, leftMargin + 5, yPos);
                        const endDate = exp.isCurrentJob ? 'Present' :
                            exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
                        const startDate = new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                        const dateRange = `${startDate} - ${endDate}`;
                        doc.fontSize(9)
                            .fillColor(colors.textGray)
                            .font('Helvetica')
                            .text(dateRange, pageWidth - rightMargin - 120, yPos, {
                            width: 120,
                            align: 'right'
                        });
                        yPos += 14;
                        doc.fontSize(10)
                            .fillColor(colors.textDark)
                            .font('Helvetica-Oblique')
                            .text(`${exp.company}${exp.location ? ` • ${exp.location}` : ''}`, leftMargin + 5, yPos);
                        yPos += 16;
                        if (exp.description) {
                            const descriptions = exp.description.split('\n').filter(line => line.trim());
                            descriptions.forEach(desc => {
                                if (desc.trim()) {
                                    checkPageBreak(15);
                                    doc.fontSize(9)
                                        .fillColor(colors.textDark)
                                        .font('Helvetica')
                                        .text('•', leftMargin + 10, yPos);
                                    doc.text(desc.trim(), leftMargin + 20, yPos, {
                                        width: contentWidth - 25,
                                        lineGap: 2
                                    });
                                    yPos += doc.heightOfString(desc.trim(), { width: contentWidth - 25, lineGap: 2 }) + 3;
                                }
                            });
                        }
                        yPos += index < resumeData.experience.length - 1 ? 18 : 12;
                    });
                }
                if (resumeData.education && resumeData.education.length > 0) {
                    checkPageBreak(80);
                    drawSectionHeader('EDUCATION', yPos);
                    yPos += 30;
                    resumeData.education.forEach((edu) => {
                        checkPageBreak(50);
                        doc.fontSize(11)
                            .fillColor(colors.primaryBlue)
                            .font('Helvetica-Bold')
                            .text(`${edu.degree} in ${edu.field}`, leftMargin + 5, yPos);
                        const endDate = !edu.isCompleted ? 'Present' :
                            edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
                        const startDate = new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                        const dateRange = `${startDate} - ${endDate}`;
                        doc.fontSize(9)
                            .fillColor(colors.textGray)
                            .font('Helvetica')
                            .text(dateRange, pageWidth - rightMargin - 120, yPos, {
                            width: 120,
                            align: 'right'
                        });
                        yPos += 14;
                        doc.fontSize(10)
                            .fillColor(colors.textDark)
                            .font('Helvetica-Oblique')
                            .text(edu.institution, leftMargin + 5, yPos);
                        if (edu.gpa) {
                            doc.fontSize(9)
                                .fillColor(colors.primaryBlue)
                                .font('Helvetica-Bold')
                                .text(`GPA: ${edu.gpa}`, pageWidth - rightMargin - 80, yPos, {
                                width: 80,
                                align: 'right'
                            });
                        }
                        yPos += 25;
                    });
                }
                if (resumeData.projects && resumeData.projects.length > 0) {
                    checkPageBreak(80);
                    drawSectionHeader('PROJECTS', yPos);
                    yPos += 30;
                    resumeData.projects.forEach((project) => {
                        checkPageBreak(60);
                        doc.fontSize(11)
                            .fillColor(colors.primaryBlue)
                            .font('Helvetica-Bold')
                            .text(project.name, leftMargin + 5, yPos);
                        yPos += 16;
                        if (project.description) {
                            doc.fontSize(9)
                                .fillColor(colors.textDark)
                                .font('Helvetica')
                                .text(project.description, leftMargin + 5, yPos, {
                                width: contentWidth - 10,
                                align: 'justify',
                                lineGap: 2
                            });
                            yPos += doc.heightOfString(project.description, { width: contentWidth - 10, lineGap: 2 }) + 8;
                        }
                        if (project.technologies && project.technologies.length > 0) {
                            doc.fontSize(8)
                                .fillColor(colors.textGray)
                                .font('Helvetica-Bold')
                                .text(`Technologies: ${project.technologies.join(', ')}`, leftMargin + 5, yPos);
                            yPos += 15;
                        }
                        yPos += 10;
                    });
                }
                if (resumeData.certifications && resumeData.certifications.length > 0) {
                    checkPageBreak(80);
                    drawSectionHeader('CERTIFICATIONS', yPos);
                    yPos += 30;
                    resumeData.certifications.forEach((cert) => {
                        checkPageBreak(30);
                        doc.fontSize(10)
                            .fillColor(colors.primaryBlue)
                            .font('Helvetica-Bold')
                            .text(cert.name, leftMargin + 5, yPos);
                        yPos += 12;
                        doc.fontSize(9)
                            .fillColor(colors.textGray)
                            .font('Helvetica')
                            .text(`${cert.organization} • ${cert.year}`, leftMargin + 5, yPos);
                        yPos += 20;
                    });
                }
                doc.end();
            });
        }
        catch (error) {
            console.error('❌ Structured PDF generation failed:', error);
            throw new Error(`Structured PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateEnhancedFallbackPDF(htmlContent) {
        console.log('📄 Using enhanced fallback PDF generation method...');
        try {
            const doc = new pdfkit_1.default({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            return new Promise((resolve, reject) => {
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    console.log('✅ Enhanced fallback PDF generated successfully, size:', pdfBuffer.length, 'bytes');
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);
                const resumeData = this.parseResumeHTML(htmlContent);
                const primaryColor = '#1e40af';
                const secondaryColor = '#666';
                const lightBlue = '#e0e7ff';
                let yPosition = 70;
                doc.fontSize(24)
                    .fillColor(primaryColor)
                    .font('Helvetica-Bold')
                    .text(resumeData.name, 50, yPosition, { align: 'center' });
                yPosition += 35;
                doc.fontSize(10)
                    .fillColor(secondaryColor)
                    .font('Helvetica')
                    .text(resumeData.contact, 50, yPosition, { align: 'center' });
                yPosition += 30;
                doc.rect(50, yPosition, 500, 2)
                    .fillColor(primaryColor)
                    .fill();
                yPosition += 25;
                if (resumeData.summary) {
                    doc.fontSize(14)
                        .fillColor(primaryColor)
                        .font('Helvetica-Bold')
                        .text('PROFESSIONAL SUMMARY', 50, yPosition);
                    yPosition += 20;
                    doc.fontSize(11)
                        .fillColor('#333')
                        .font('Helvetica')
                        .text(resumeData.summary, 50, yPosition, {
                        width: 500,
                        align: 'justify',
                        lineGap: 2
                    });
                    yPosition += doc.heightOfString(resumeData.summary, { width: 500, lineGap: 2 }) + 15;
                }
                if (resumeData.education.length > 0) {
                    doc.fontSize(14)
                        .fillColor(primaryColor)
                        .font('Helvetica-Bold')
                        .text('EDUCATION', 50, yPosition);
                    yPosition += 20;
                    resumeData.education.forEach((edu) => {
                        doc.fontSize(12)
                            .fillColor('#333')
                            .font('Helvetica-Bold')
                            .text(edu.degree, 50, yPosition);
                        doc.fontSize(11)
                            .fillColor(secondaryColor)
                            .font('Helvetica')
                            .text(edu.institution, 50, yPosition + 15);
                        if (edu.gpa) {
                            doc.text(`GPA: ${edu.gpa}`, 400, yPosition + 15);
                        }
                        yPosition += 35;
                    });
                    yPosition += 10;
                }
                if (resumeData.skills.length > 0) {
                    doc.fontSize(14)
                        .fillColor(primaryColor)
                        .font('Helvetica-Bold')
                        .text('SKILLS', 50, yPosition);
                    yPosition += 20;
                    const skillsPerRow = 3;
                    const skillWidth = 160;
                    let currentRow = 0;
                    let currentCol = 0;
                    resumeData.skills.forEach((skill, index) => {
                        const xPos = 50 + (currentCol * skillWidth);
                        const yPos = yPosition + (currentRow * 20);
                        doc.fontSize(10)
                            .fillColor('#333')
                            .font('Helvetica')
                            .text(`• ${skill}`, xPos, yPos);
                        currentCol++;
                        if (currentCol >= skillsPerRow) {
                            currentCol = 0;
                            currentRow++;
                        }
                    });
                    yPosition += (Math.ceil(resumeData.skills.length / skillsPerRow) * 20) + 15;
                }
                if (resumeData.experience.length > 0) {
                    doc.fontSize(14)
                        .fillColor(primaryColor)
                        .font('Helvetica-Bold')
                        .text('EXPERIENCE', 50, yPosition);
                    yPosition += 20;
                    resumeData.experience.forEach((exp) => {
                        if (yPosition > 700) {
                            doc.addPage();
                            yPosition = 50;
                        }
                        doc.fontSize(12)
                            .fillColor('#333')
                            .font('Helvetica-Bold')
                            .text(exp.title, 50, yPosition);
                        doc.fontSize(11)
                            .fillColor(secondaryColor)
                            .font('Helvetica')
                            .text(exp.company, 50, yPosition + 15);
                        doc.text(exp.dates, 400, yPosition + 15);
                        if (exp.description) {
                            yPosition += 35;
                            doc.fontSize(10)
                                .fillColor('#333')
                                .font('Helvetica')
                                .text(exp.description, 70, yPosition, {
                                width: 480,
                                align: 'left',
                                lineGap: 1
                            });
                            yPosition += doc.heightOfString(exp.description, { width: 480, lineGap: 1 }) + 10;
                        }
                        else {
                            yPosition += 30;
                        }
                    });
                }
                if (resumeData.projects.length > 0) {
                    yPosition += 15;
                    if (yPosition > 650) {
                        doc.addPage();
                        yPosition = 50;
                    }
                    doc.fontSize(14)
                        .fillColor(primaryColor)
                        .font('Helvetica-Bold')
                        .text('PROJECTS', 50, yPosition);
                    yPosition += 20;
                    resumeData.projects.forEach((project) => {
                        if (yPosition > 700) {
                            doc.addPage();
                            yPosition = 50;
                        }
                        doc.fontSize(12)
                            .fillColor('#333')
                            .font('Helvetica-Bold')
                            .text(project.name, 50, yPosition);
                        yPosition += 15;
                        if (project.description) {
                            doc.fontSize(10)
                                .fillColor('#333')
                                .font('Helvetica')
                                .text(project.description, 70, yPosition, {
                                width: 480,
                                align: 'left',
                                lineGap: 1
                            });
                            yPosition += doc.heightOfString(project.description, { width: 480, lineGap: 1 }) + 5;
                        }
                        if (project.technologies && project.technologies.length > 0) {
                            doc.fontSize(9)
                                .fillColor(secondaryColor)
                                .font('Helvetica')
                                .text(`Technologies: ${project.technologies.join(', ')}`, 70, yPosition);
                            yPosition += 20;
                        }
                        else {
                            yPosition += 15;
                        }
                    });
                }
                doc.end();
            });
        }
        catch (fallbackError) {
            console.error('❌ Enhanced fallback PDF generation also failed:', fallbackError);
            throw new Error('PDF generation is currently unavailable. Please try again later or contact support.');
        }
    }
    parseResumeHTML(htmlContent) {
        const nameMatch = htmlContent.match(/<h1[^>]*class="name"[^>]*>([^<]+)<\/h1>/);
        const name = nameMatch ? nameMatch[1].trim() : 'Resume';
        const contactMatches = htmlContent.match(/<div[^>]*class="contact-item"[^>]*>.*?<span>([^<]+)<\/span>.*?<\/div>/g);
        const contact = contactMatches
            ? contactMatches.map(match => {
                const textMatch = match.match(/<span>([^<]+)<\/span>/g);
                return textMatch ? textMatch.map(t => t.replace(/<[^>]*>/g, '')).join(' ') : '';
            }).filter(c => c && !c.includes('📧') && !c.includes('📱') && !c.includes('💼') && !c.includes('💻') && !c.includes('📍')).join(' | ')
            : '';
        const summaryMatch = htmlContent.match(/<div[^>]*class="summary"[^>]*>(.*?)<\/div>/s);
        const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        const educationMatches = htmlContent.match(/<div[^>]*class="education-item"[^>]*>(.*?)<\/div>/gs);
        const education = educationMatches
            ? educationMatches.map(match => {
                const degreeMatch = match.match(/<div[^>]*class="degree"[^>]*>([^<]+)<\/div>/);
                const institutionMatch = match.match(/<div[^>]*class="institution"[^>]*>([^<]+)<\/div>/);
                const gpaMatch = match.match(/<span[^>]*class="gpa"[^>]*>GPA: ([^<]+)<\/span>/);
                return {
                    degree: degreeMatch ? degreeMatch[1].trim() : '',
                    institution: institutionMatch ? institutionMatch[1].trim() : '',
                    gpa: gpaMatch ? gpaMatch[1].trim() : null
                };
            }).filter(edu => edu.degree || edu.institution)
            : [];
        const skillMatches = htmlContent.match(/<span[^>]*class="skill-item"[^>]*>([^<]+)<\/span>/g);
        const skills = skillMatches
            ? skillMatches.map(match => match.replace(/<[^>]*>/g, '').trim()).filter(skill => skill)
            : [];
        const experienceMatches = htmlContent.match(/<div[^>]*class="experience-item"[^>]*>(.*?)<\/div>/gs);
        const experience = experienceMatches
            ? experienceMatches.map(match => {
                const titleMatch = match.match(/<div[^>]*class="job-title"[^>]*>([^<]+)<\/div>/);
                const companyMatch = match.match(/<div[^>]*class="company"[^>]*>([^<]+)<\/div>/);
                const datesMatch = match.match(/<div[^>]*class="dates"[^>]*>([^<]+)<\/div>/);
                const descMatch = match.match(/<div[^>]*class="description"[^>]*>(.*?)<\/div>/s);
                return {
                    title: titleMatch ? titleMatch[1].trim() : '',
                    company: companyMatch ? companyMatch[1].trim() : '',
                    dates: datesMatch ? datesMatch[1].trim() : '',
                    description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : ''
                };
            }).filter(exp => exp.title || exp.company)
            : [];
        const projectMatches = htmlContent.match(/<div[^>]*class="project-item"[^>]*>(.*?)<\/div>/gs);
        const projects = projectMatches
            ? projectMatches.map(match => {
                const nameMatch = match.match(/<div[^>]*class="project-name"[^>]*>([^<]+)<\/div>/);
                const descMatch = match.match(/<div[^>]*class="project-description"[^>]*>(.*?)<\/div>/s);
                const techMatches = match.match(/<span[^>]*class="tech-item"[^>]*>([^<]+)<\/span>/g);
                return {
                    name: nameMatch ? nameMatch[1].trim() : '',
                    description: descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '',
                    technologies: techMatches ? techMatches.map(t => t.replace(/<[^>]*>/g, '').trim()) : []
                };
            }).filter(project => project.name)
            : [];
        return {
            name,
            contact,
            summary,
            education,
            skills,
            experience,
            projects
        };
    }
    async createTailoredResume(email, phoneNumber, jobDescription) {
        try {
            console.log('🚀 Starting tailored resume creation...');
            const jobAnalysis = await this.analyzeJobDescription(jobDescription);
            console.log('✅ Job analysis completed');
            const studentData = await this.getStudentData(email, phoneNumber);
            if (!studentData) {
                return {
                    success: false,
                    message: 'Student profile not found. Please ensure you have a complete profile on CampusPe.'
                };
            }
            console.log('✅ Student data retrieved');
            const tailoredResume = this.tailorResumeForJob(studentData, jobAnalysis);
            console.log('✅ Resume tailored for job requirements');
            const htmlContent = this.generateResumeHTML(tailoredResume);
            console.log('✅ HTML template generated');
            let pdfBuffer;
            console.log('📄 Starting PDF generation with reliable fallback chain...');
            try {
                console.log('🎨 Attempting structured PDF generation...');
                pdfBuffer = await this.generateStructuredPDF(tailoredResume);
                console.log('✅ Structured PDF generated successfully, size:', pdfBuffer.length, 'bytes');
            }
            catch (structuredError) {
                console.log('⚠️ Structured PDF failed, trying Azure PDF service...', structuredError?.message || 'Unknown error');
                try {
                    if (await azure_pdf_service_1.default.healthCheck()) {
                        console.log('🏗️ Azure PDF Service is available, generating PDF...');
                        pdfBuffer = await azure_pdf_service_1.default.generatePDF(htmlContent);
                        console.log('✅ Azure PDF generated successfully, size:', pdfBuffer.length, 'bytes');
                    }
                    else {
                        throw new Error('Azure PDF Service not available');
                    }
                }
                catch (azureError) {
                    console.log('⚠️ Azure PDF service failed, trying html-pdf-node...', azureError?.message || 'Unknown error');
                    try {
                        const htmlPdf = require('html-pdf-node');
                        const options = { format: 'A4', border: { top: '0.5in', bottom: '0.5in' } };
                        const file = { content: htmlContent };
                        pdfBuffer = await htmlPdf.generatePdf(file, options);
                        console.log('✅ html-pdf-node PDF generated successfully, size:', pdfBuffer.length, 'bytes');
                    }
                    catch (htmlPdfError) {
                        console.log('⚠️ html-pdf-node failed, using enhanced fallback...', htmlPdfError?.message || 'Unknown error');
                        pdfBuffer = await this.generateEnhancedFallbackPDF(htmlContent);
                        console.log('✅ Enhanced fallback PDF generated successfully, size:', pdfBuffer.length, 'bytes');
                    }
                }
            }
            const fileName = `${studentData.personalInfo.firstName}_${studentData.personalInfo.lastName}_Resume_${Date.now()}.pdf`;
            let resumeId;
            let downloadUrl;
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
                    const jobTitleMatch = jobDescription.match(/(?:position|role|job):\s*([^.]+)/i);
                    const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'Job Application';
                    const generatedResume = await GeneratedResumeService.createGeneratedResume({
                        studentId: student._id.toString(),
                        jobTitle,
                        jobDescription,
                        resumeData: tailoredResume,
                        fileName,
                        pdfBuffer,
                        matchScore: 85,
                        aiEnhancementUsed: true,
                        matchedSkills: tailoredResume.skills.map((s) => s.name).slice(0, 5),
                        missingSkills: [],
                        suggestions: [],
                        generationType: 'ai'
                    });
                    resumeId = generatedResume.resumeId;
                    downloadUrl = `${process.env.API_BASE_URL || 'http://localhost:5001'}/api/generated-resume/download-public/${resumeId}`;
                    console.log('✅ Resume saved to GeneratedResume collection:', resumeId);
                }
            }
            catch (saveError) {
                console.error('⚠️ Error saving to GeneratedResume collection:', saveError);
            }
            return {
                success: true,
                pdfBuffer,
                fileName,
                message: 'Resume generated successfully and tailored for the job requirements!',
                resumeId,
                downloadUrl
            };
        }
        catch (error) {
            console.error('❌ Error creating tailored resume:', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : 'No stack trace',
                type: error instanceof Error ? error.constructor.name : typeof error
            });
            return {
                success: false,
                message: 'Failed to generate resume. Please try again later.'
            };
        }
    }
    async createResumeFromPlatform(userId) {
        try {
            console.log('🚀 Creating resume from platform data...');
            const student = await Student_1.Student.findOne({ userId }).populate('userId');
            if (!student) {
                return {
                    success: false,
                    message: 'Student profile not found.'
                };
            }
            const studentData = {
                personalInfo: {
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email || student.userId?.email || '',
                    phone: student.phoneNumber || student.userId?.phone || '',
                    linkedin: student.linkedinUrl,
                    github: student.githubUrl,
                    location: 'India'
                },
                education: student.education || [],
                experience: student.experience || [],
                skills: student.skills || [],
                projects: (student.resumeAnalysis?.extractedDetails?.projects || []).filter((p) => p.name && p.description).map((p) => ({
                    name: p.name || '',
                    description: p.description || '',
                    technologies: p.technologies || [],
                    link: p.link
                })),
                certifications: (student.resumeAnalysis?.extractedDetails?.certifications || []).filter((c) => c.name && c.organization && c.year).map((c) => ({
                    name: c.name || '',
                    year: c.year || new Date().getFullYear(),
                    organization: c.organization || ''
                }))
            };
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
        }
        catch (error) {
            console.error('❌ Error creating resume from platform:', error);
            return {
                success: false,
                message: 'Failed to generate resume. Please try again later.'
            };
        }
    }
}
exports.default = new ResumeBuilderService();
