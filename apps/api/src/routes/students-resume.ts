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
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }
    
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF
    const data = await pdfParse(dataBuffer);
    
    const extractedText = data.text;
    console.log('Extracted text length:', extractedText.length);
    console.log('Extracted text preview:', extractedText.substring(0, 200) + '...');
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    
    // Return a fallback error message that indicates the issue
    throw new Error(`Failed to extract text from resume PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced resume details extraction
const extractResumeDetails = async (resumeText: string): Promise<any> => {
  console.log('Starting comprehensive resume details extraction...');
  
  // Extract personal information
  const personalInfo = extractPersonalInfo(resumeText);
  
  // Extract work experience
  const experience = extractWorkExperience(resumeText);
  
  // Extract education details
  const education = extractEducation(resumeText);
  
  // Extract contact information
  const contactInfo = extractContactInfo(resumeText);
  
  // Extract other relevant sections
  const projects = extractProjects(resumeText);
  const certifications = extractCertifications(resumeText);
  const languages = extractLanguages(resumeText);
  
  return {
    personalInfo,
    experience,
    education,
    contactInfo,
    projects,
    certifications,
    languages
  };
};

// Extract personal information from resume
const extractPersonalInfo = (text: string): any => {
  const nameRegex = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/m;
  const nameMatch = text.match(nameRegex);
  
  const summary = extractSummary(text);
  
  return {
    name: nameMatch ? nameMatch[1] : null,
    summary
  };
};

// Extract work experience from resume
const extractWorkExperience = (text: string): any[] => {
  const experiences: any[] = [];
  
  // Look for experience section
  const experienceSection = extractSection(text, ['experience', 'work experience', 'employment', 'professional experience', 'work history']);
  
  if (experienceSection) {
    console.log('Found experience section, extracting details...');
    
    // Multiple patterns to catch different resume formats
    const jobPatterns = [
      // Pattern 1: Job Title at Company Name (Duration)
      /([A-Za-z\s,\.]+(?:Engineer|Developer|Manager|Analyst|Consultant|Intern|Associate|Specialist|Lead|Senior|Junior|Coordinator|Director|Executive|Administrator|Designer|Architect))\s+at\s+([A-Z][A-Za-z\s&,\.\-]+)\s*(?:\(|\-|\|)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{4}|\d{4}).*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{4}|\d{4}|present|current|till date))/gi,
      
      // Pattern 2: Company Name | Job Title | Duration
      /([A-Z][A-Za-z\s&,\.\-]+)\s*[\|\-]\s*([A-Za-z\s,\.]+(?:Engineer|Developer|Manager|Analyst|Consultant|Intern|Associate|Specialist|Lead|Senior|Junior))\s*[\|\-]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{4}|\d{4}).*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{4}|\d{4}|present|current))/gi,
      
      // Pattern 3: Job Title\nCompany Name\nDuration
      /([A-Za-z\s,\.]+(?:Engineer|Developer|Manager|Analyst|Consultant|Intern|Associate|Specialist|Lead|Senior|Junior))\s*\n\s*([A-Z][A-Za-z\s&,\.\-]+)\s*\n\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{4}|\d{4}).*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{4}|\d{4}|present|current))/gi
    ];
    
    jobPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(experienceSection)) !== null) {
        const dates = parseDuration(match[3]);
        const experience = {
          title: (index === 0 ? match[1] : match[2])?.trim(),
          company: (index === 0 ? match[2] : match[1])?.trim(),
          duration: match[3]?.trim(),
          startDate: dates.startDate,
          endDate: dates.endDate,
          isCurrentJob: dates.isCurrent,
          description: extractJobDescription(experienceSection, match.index),
          location: extractLocation(experienceSection, match.index)
        };
        
        // Avoid duplicates
        if (!experiences.some(exp => exp.title === experience.title && exp.company === experience.company)) {
          experiences.push(experience);
          console.log(`Extracted experience: ${experience.title} at ${experience.company}`);
        }
      }
    });
  }
  
  return experiences;
};

// Extract education details from resume
const extractEducation = (text: string): any[] => {
  const education: any[] = [];
  
  const educationSection = extractSection(text, ['education', 'academic background', 'qualifications', 'academic qualifications', 'educational background']);
  
  if (educationSection) {
    console.log('Found education section, extracting details...');
    
    // Enhanced patterns for education extraction
    const educationPatterns = [
      // Pattern 1: Degree in Field from Institution (Year)
      /(Bachelor|Master|PhD|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc|B\.?Com|M\.?Com|BBA|MBA|B\.?A|M\.?A|Diploma)[^,\n]*(?:in|of)\s+([^,\n]+?)(?:from|at|,)\s+([^,\n]+?)(?:\(|\-|\s|,)(\d{4})/gi,
      
      // Pattern 2: Institution - Degree (Year-Year)
      /([A-Z][A-Za-z\s&,\.\-]+(?:University|College|Institute|School))\s*[\-\|]\s*(Bachelor|Master|PhD|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc|B\.?Com|M\.?Com|BBA|MBA|B\.?A|M\.?A|Diploma)[^,\n]*(?:\(|\-|\s)(\d{4})(?:\s*\-\s*(\d{4}))?/gi,
      
      // Pattern 3: Degree\nInstitution\nYear
      /(Bachelor|Master|PhD|B\.?Tech|M\.?Tech|B\.?E|M\.?E|B\.?Sc|M\.?Sc|B\.?Com|M\.?Com|BBA|MBA|B\.?A|M\.?A|Diploma)[^\n]*\n\s*([A-Z][A-Za-z\s&,\.\-]+)\n\s*(\d{4})/gi
    ];
    
    educationPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(educationSection)) !== null) {
        let degree, field, institution, startYear, endYear;
        
        if (index === 0) {
          degree = match[1];
          field = match[2];
          institution = match[3];
          endYear = parseInt(match[4]);
        } else if (index === 1) {
          institution = match[1];
          degree = match[2];
          endYear = parseInt(match[3]);
          startYear = match[4] ? parseInt(match[4]) : null;
        } else {
          degree = match[1];
          institution = match[2];
          endYear = parseInt(match[3]);
        }
        
        const educationEntry = {
          degree: degree?.trim(),
          field: field?.trim() || 'Not specified',
          institution: institution?.trim(),
          startDate: startYear ? new Date(startYear, 0) : null,
          endDate: endYear ? new Date(endYear, 0) : null,
          year: endYear,
          isCompleted: true
        };
        
        // Avoid duplicates
        if (!education.some(edu => edu.degree === educationEntry.degree && edu.institution === educationEntry.institution)) {
          education.push(educationEntry);
          console.log(`Extracted education: ${educationEntry.degree} from ${educationEntry.institution}`);
        }
      }
    });
  }
  
  return education;
};

// Extract contact information from resume
const extractContactInfo = (text: string): any => {
  console.log('Extracting contact information...');
  
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?(?:\(\d{3}\)\s?|\d{3}[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([a-zA-Z0-9-]+)/gi;
  const githubRegex = /(?:github\.com\/)([a-zA-Z0-9-]+)/gi;
  const addressRegex = /(?:Address|Location):\s*([^\n]+)/gi;
  
  const emails = text.match(emailRegex);
  const phones = text.match(phoneRegex);
  const linkedinMatches = [...text.matchAll(linkedinRegex)];
  const githubMatches = [...text.matchAll(githubRegex)];
  const addressMatches = [...text.matchAll(addressRegex)];
  
  const contactInfo = {
    email: emails ? emails[0] : null,
    phone: phones ? phones[0] : null,
    linkedin: linkedinMatches.length > 0 ? linkedinMatches[0][0] : null,
    github: githubMatches.length > 0 ? githubMatches[0][0] : null,
    address: addressMatches.length > 0 ? addressMatches[0][1] : null
  };
  
  console.log('Extracted contact info:', contactInfo);
  return contactInfo;
};

// Extract projects from resume
const extractProjects = (text: string): any[] => {
  const projects: any[] = [];
  const projectSection = extractSection(text, ['projects', 'personal projects', 'academic projects', 'work projects', 'key projects']);
  
  if (projectSection) {
    console.log('Found projects section, extracting details...');
    
    // Split by common project separators
    const projectEntries = projectSection.split(/\n(?=[A-Z])/);
    
    projectEntries.forEach(entry => {
      const lines = entry.trim().split('\n');
      if (lines.length > 0 && lines[0].length > 5) {
        const titleLine = lines[0];
        const description = lines.slice(1).join(' ').trim();
        
        // Extract technologies used
        const techMatch = description.match(/(?:Technologies|Tech Stack|Built with|Using):\s*([^\n\.]+)/i);
        
        projects.push({
          name: titleLine.trim(),
          description: description.substring(0, 300),
          technologies: techMatch ? techMatch[1].split(',').map(t => t.trim()) : []
        });
      }
    });
  }
  
  return projects;
};

// Extract certifications from resume
const extractCertifications = (text: string): any[] => {
  const certifications: any[] = [];
  const certSection = extractSection(text, ['certifications', 'certificates', 'credentials', 'licenses', 'achievements']);
  
  if (certSection) {
    console.log('Found certifications section, extracting details...');
    
    const certLines = certSection.split('\n').filter(line => line.trim().length > 10);
    certLines.forEach(line => {
      const yearMatch = line.match(/(\d{4})/);
      const organizationMatch = line.match(/(?:by|from|issued by)\s+([A-Za-z\s&,\.]+)/i);
      
      certifications.push({
        name: line.trim(),
        year: yearMatch ? parseInt(yearMatch[1]) : null,
        organization: organizationMatch ? organizationMatch[1].trim() : null
      });
    });
  }
  
  return certifications;
};

// Extract languages from resume
const extractLanguages = (text: string): any[] => {
  const languages: any[] = [];
  const langSection = extractSection(text, ['languages', 'language skills', 'linguistic skills']);
  
  const commonLanguages = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Portuguese', 'Russian', 'Dutch', 'Swedish', 'Norwegian'];
  
  if (langSection) {
    console.log('Found languages section, extracting details...');
    
    commonLanguages.forEach(lang => {
      if (langSection.toLowerCase().includes(lang.toLowerCase())) {
        languages.push({
          name: lang,
          proficiency: extractProficiencyLevel(langSection, lang)
        });
      }
    });
  } else {
    // Check in the entire resume for language mentions
    commonLanguages.forEach(lang => {
      if (text.toLowerCase().includes(lang.toLowerCase())) {
        languages.push({
          name: lang,
          proficiency: 'basic'
        });
      }
    });
  }
  
  return languages;
};

// Helper function to extract sections from resume
const extractSection = (text: string, sectionNames: string[]): string | null => {
  for (const sectionName of sectionNames) {
    const regex = new RegExp(`\\b(${sectionName})\\b[:\\s]*\\n([\\s\\S]*?)(?=\\n\\b[A-Z][A-Z\\s]+\\b:|\\n\\n|$)`, 'gi');
    const match = regex.exec(text);
    if (match && match[2]) {
      console.log(`Found section: ${sectionName}`);
      return match[2].trim();
    }
  }
  return null;
};

// Helper function to parse duration strings
const parseDuration = (durationStr: string): any => {
  const current = /present|current|ongoing|till date/i.test(durationStr);
  const dates = durationStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|\d{1,2}\/\d{4}|\d{4}/g);
  
  let startDate = null;
  let endDate = null;
  
  if (dates && dates.length > 0) {
    startDate = new Date(dates[0]);
    if (dates.length > 1 && !current) {
      endDate = new Date(dates[1]);
    }
  }
  
  return {
    startDate,
    endDate,
    isCurrent: current
  };
};

// Helper function to extract job description
const extractJobDescription = (text: string, startIndex: number): string => {
  const afterMatch = text.substring(startIndex);
  const lines = afterMatch.split('\n').slice(1, 6); // Get next few lines as description
  return lines.filter(line => line.trim().length > 10).join(' ').trim().substring(0, 300);
};

// Helper function to extract location
const extractLocation = (text: string, startIndex: number): string | null => {
  const afterMatch = text.substring(startIndex, startIndex + 200);
  const locationMatch = afterMatch.match(/([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)*)/);
  return locationMatch ? locationMatch[1] : null;
};

// Helper function to extract summary/objective
const extractSummary = (text: string): string | null => {
  const summarySection = extractSection(text, ['summary', 'objective', 'profile', 'about', 'overview', 'career objective']);
  return summarySection ? summarySection.trim().substring(0, 500) : null;
};

// Helper function to extract proficiency level
const extractProficiencyLevel = (text: string, language: string): string => {
  const langContext = text.toLowerCase();
  const langLower = language.toLowerCase();
  
  if (langContext.includes(`${langLower} - native`) || langContext.includes(`${langLower} (native)`) || langContext.includes(`native ${langLower}`)) {
    return 'native';
  }
  if (langContext.includes(`${langLower} - fluent`) || langContext.includes(`${langLower} (fluent)`) || langContext.includes(`fluent ${langLower}`)) {
    return 'fluent';
  }
  if (langContext.includes(`${langLower} - intermediate`) || langContext.includes(`${langLower} (intermediate)`) || langContext.includes(`intermediate ${langLower}`)) {
    return 'intermediate';
  }
  if (langContext.includes(`${langLower} - advanced`) || langContext.includes(`${langLower} (advanced)`) || langContext.includes(`advanced ${langLower}`)) {
    return 'advanced';
  }
  return 'basic';
};

// Enhanced AI-powered skill extraction and analysis
const analyzeResumeWithAI = (resumeText: string) => {
  console.log('Analyzing resume text with enhanced AI...');
  
  // Comprehensive skill keywords with more variations and better categorization
  const skillKeywords = {
    // Programming Languages
    'JavaScript': ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'es2020'],
    'TypeScript': ['typescript', 'ts'],
    'Python': ['python', 'py'],
    'Java': ['java', 'jdk', 'jvm'],
    'C++': ['c++', 'cpp', 'c plus plus'],
    'C#': ['c#', 'csharp', 'c sharp'],
    'PHP': ['php'],
    'Ruby': ['ruby'],
    'Go': ['golang', 'go lang'],
    'Rust': ['rust'],
    'Swift': ['swift'],
    'Kotlin': ['kotlin'],
    'Scala': ['scala'],
    'R': ['r programming', 'r language'],
    
    // Frontend Technologies
    'React': ['react', 'reactjs', 'react.js', 'jsx'],
    'Angular': ['angular', 'angularjs'],
    'Vue.js': ['vue', 'vue.js', 'vuejs'],
    'HTML5': ['html', 'html5'],
    'CSS3': ['css', 'css3'],
    'SASS': ['sass', 'scss'],
    'Bootstrap': ['bootstrap'],
    'Tailwind CSS': ['tailwind', 'tailwindcss'],
    'Material-UI': ['material ui', 'mui', 'material-ui'],
    'jQuery': ['jquery'],
    'Redux': ['redux', 'redux toolkit'],
    'Next.js': ['next.js', 'nextjs'],
    'Nuxt.js': ['nuxt', 'nuxt.js'],
    
    // Backend Technologies
    'Node.js': ['node.js', 'nodejs', 'node'],
    'Express.js': ['express', 'express.js', 'expressjs'],
    'Django': ['django'],
    'Flask': ['flask'],
    'Spring Boot': ['spring boot', 'spring', 'springboot'],
    'ASP.NET': ['asp.net', 'aspnet', 'asp net'],
    'Laravel': ['laravel'],
    'Ruby on Rails': ['rails', 'ruby on rails'],
    'FastAPI': ['fastapi'],
    'Nest.js': ['nestjs', 'nest.js'],
    
    // Databases
    'MongoDB': ['mongodb', 'mongo'],
    'MySQL': ['mysql'],
    'PostgreSQL': ['postgresql', 'postgres'],
    'SQLite': ['sqlite'],
    'Redis': ['redis'],
    'Elasticsearch': ['elasticsearch'],
    'Oracle': ['oracle database', 'oracle'],
    'SQL Server': ['sql server', 'mssql'],
    'Cassandra': ['cassandra'],
    'DynamoDB': ['dynamodb'],
    'Firebase': ['firebase', 'firestore'],
    
    // Cloud & DevOps
    'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
    'Azure': ['azure', 'microsoft azure'],
    'Google Cloud': ['gcp', 'google cloud platform', 'google cloud'],
    'Docker': ['docker', 'containerization'],
    'Kubernetes': ['kubernetes', 'k8s'],
    'Jenkins': ['jenkins'],
    'CI/CD': ['ci/cd', 'continuous integration', 'continuous deployment', 'github actions', 'gitlab ci'],
    'Terraform': ['terraform'],
    'Ansible': ['ansible'],
    'Nginx': ['nginx'],
    'Apache': ['apache'],
    
    // Data Science & AI
    'Machine Learning': ['machine learning', 'ml', 'artificial intelligence', 'ai'],
    'Deep Learning': ['deep learning', 'neural networks', 'nn'],
    'Data Science': ['data science', 'data analysis', 'data analytics'],
    'TensorFlow': ['tensorflow'],
    'PyTorch': ['pytorch'],
    'Scikit-learn': ['scikit-learn', 'sklearn'],
    'Pandas': ['pandas'],
    'NumPy': ['numpy'],
    'Matplotlib': ['matplotlib'],
    'Seaborn': ['seaborn'],
    'Jupyter': ['jupyter', 'jupyter notebook'],
    'Apache Spark': ['spark', 'apache spark'],
    'Tableau': ['tableau'],
    'Power BI': ['power bi', 'powerbi'],
    
    // Mobile Development
    'React Native': ['react native'],
    'Flutter': ['flutter', 'dart'],
    'iOS Development': ['ios', 'objective-c', 'xcode'],
    'Android Development': ['android', 'android studio'],
    'Xamarin': ['xamarin'],
    'Ionic': ['ionic'],
    
    // Tools & Technologies
    'Git': ['git', 'github', 'gitlab', 'bitbucket', 'version control'],
    'Jira': ['jira'],
    'REST API': ['rest', 'restful', 'api', 'rest api'],
    'GraphQL': ['graphql'],
    'Microservices': ['microservices', 'micro services'],
    'WebSockets': ['websocket', 'websockets'],
    'ElasticSearch': ['elasticsearch', 'elk stack'],
    'Apache Kafka': ['kafka', 'apache kafka'],
    'RabbitMQ': ['rabbitmq'],
    'Socket.io': ['socket.io', 'socketio'],
    
    // Testing
    'Jest': ['jest'],
    'Cypress': ['cypress'],
    'Selenium': ['selenium'],
    'JUnit': ['junit'],
    'Mocha': ['mocha'],
    'Chai': ['chai'],
    
    // Soft Skills
    'Leadership': ['leadership', 'team lead', 'project lead'],
    'Communication': ['communication', 'presentation', 'public speaking'],
    'Problem Solving': ['problem solving', 'analytical', 'troubleshooting'],
    'Team Work': ['teamwork', 'collaboration', 'team player'],
    'Project Management': ['project management', 'pmp', 'agile', 'scrum', 'kanban'],
    'Agile Methodology': ['agile', 'scrum', 'kanban', 'sprint'],
  };
  
  const text = resumeText.toLowerCase();
  console.log('Resume text preview:', text.substring(0, 300));
  
  const detectedSkills: string[] = [];
  
  // Enhanced skill detection with stricter matching and context validation
  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    let skillFound = false;
    for (const keyword of keywords) {
      // Create strict word boundary regex
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const strictRegex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      
      if (strictRegex.test(text)) {
        // Additional context validation for common words that might be false positives
        const contextWords = ['experience', 'knowledge', 'skills', 'proficient', 'familiar', 'worked', 'using', 'with'];
        const skillPosition = text.toLowerCase().indexOf(keyword.toLowerCase());
        
        if (skillPosition !== -1) {
          // Get context around the skill (50 chars before and after)
          const contextStart = Math.max(0, skillPosition - 50);
          const contextEnd = Math.min(text.length, skillPosition + keyword.length + 50);
          const context = text.substring(contextStart, contextEnd).toLowerCase();
          
          // Check if skill appears in a meaningful context
          const hasGoodContext = contextWords.some(word => context.includes(word)) || 
                                context.includes('project') || 
                                context.includes('develop') ||
                                context.includes('implement') ||
                                context.includes('build') ||
                                context.includes('create');
          
          // For technical skills, require good context or multiple occurrences
          const skillOccurrences = (text.toLowerCase().match(new RegExp(escapedKeyword, 'gi')) || []).length;
          
          if (hasGoodContext || skillOccurrences >= 2 || keyword.length >= 8) {
            if (!detectedSkills.includes(skill)) {
              detectedSkills.push(skill);
            }
            skillFound = true;
            break;
          }
        }
      }
    }
  }
  
  console.log('Enhanced skill detection with context validation found:', detectedSkills);
  
  // Filter out skills that might be too generic or false positives
  const filteredSkills = detectedSkills.filter(skill => {
    // Keep all skills that are technical and specific
    const technicalSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'MongoDB', 'SQL', 'Docker', 'AWS'];
    if (technicalSkills.some(tech => skill.includes(tech) || tech.includes(skill))) {
      return true;
    }
    
    // For other skills, ensure they appear with sufficient context
    const skillKeywordsList = (skillKeywords as any)[skill] || [];
    return skillKeywordsList.some((keyword: string) => {
      const skillRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const matches = [...text.matchAll(new RegExp(skillRegex, 'gi'))];
      return matches.length >= 2 || keyword.length >= 6;
    });
  });
  
  // Use filtered skills for better accuracy
  const finalSkills = filteredSkills.length > 0 ? filteredSkills : detectedSkills.slice(0, 10); // Fallback with limit
  console.log('Final skills after filtering:', finalSkills);
  
  // Enhanced category determination with more granular categorization
  let category = 'General';
  const frontendSkills = ['React', 'Angular', 'Vue.js', 'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'SASS', 'Bootstrap', 'Tailwind CSS'];
  const backendSkills = ['Node.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Express.js', 'Python', 'Java', 'C#', 'PHP', 'ASP.NET'];
  const fullStackSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB', 'Express.js', 'HTML5', 'CSS3'];
  const mobileSkills = ['React Native', 'Flutter', 'iOS Development', 'Android Development', 'Swift', 'Kotlin', 'Xamarin'];
  const dataSkills = ['Machine Learning', 'Deep Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'Python', 'R', 'Pandas', 'NumPy'];
  const devopsSkills = ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Jenkins', 'Terraform', 'Ansible'];
  const cloudSkills = ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes'];
  
  // Intelligent categorization based on skill combinations
  const frontendCount = finalSkills.filter(skill => frontendSkills.includes(skill)).length;
  const backendCount = finalSkills.filter(skill => backendSkills.includes(skill)).length;
  const fullStackCount = finalSkills.filter(skill => fullStackSkills.includes(skill)).length;
  const mobileCount = finalSkills.filter(skill => mobileSkills.includes(skill)).length;
  const dataCount = finalSkills.filter(skill => dataSkills.includes(skill)).length;
  const devopsCount = finalSkills.filter(skill => devopsSkills.includes(skill)).length;
  const cloudCount = finalSkills.filter(skill => cloudSkills.includes(skill)).length;
  
  if (fullStackCount >= 4 || (frontendCount >= 2 && backendCount >= 2)) {
    category = 'Full Stack Development';
  } else if (dataCount >= 3) {
    category = 'Data Science & Machine Learning';
  } else if (mobileCount >= 2) {
    category = 'Mobile Development';
  } else if (devopsCount >= 3 || cloudCount >= 2) {
    category = 'DevOps & Cloud Engineering';
  } else if (frontendCount >= 2) {
    category = 'Frontend Development';
  } else if (backendCount >= 2) {
    category = 'Backend Development';
  } else if (detectedSkills.some(skill => ['JavaScript', 'Python', 'Java', 'C++', 'C#'].includes(skill))) {
    category = 'Software Development';
  }
  
  // Enhanced experience level determination
  let experienceLevel = 'Entry Level';
  const seniorKeywords = ['senior', 'lead', 'principal', 'architect', 'manager', 'head', 'director', 'cto', 'tech lead', 'staff engineer'];
  const midKeywords = ['developer', 'engineer', 'analyst', 'consultant', 'specialist', 'programmer'];
  const juniorKeywords = ['intern', 'trainee', 'associate', 'junior', 'entry level', 'graduate', 'fresher'];
  
  // Enhanced year detection with multiple patterns
  const yearPatterns = [
    /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp|work)/gi,
    /(\d+)\+?\s*(?:years?|yrs?)/gi,
    /experience.*?(\d+)\s*(?:years?|yrs?)/gi,
    /(\d+)\s*(?:years?|yrs?)\s*in/gi
  ];
  
  let maxYears = 0;
  for (const pattern of yearPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const years = parseInt(match[1]);
      if (years > maxYears && years <= 50) { // Reasonable upper limit
        maxYears = years;
      }
    }
  }
  
  // Determine experience level with more nuance
  if (seniorKeywords.some(keyword => text.includes(keyword)) || maxYears >= 5) {
    experienceLevel = 'Senior Level';
  } else if (midKeywords.some(keyword => text.includes(keyword)) || maxYears >= 2) {
    experienceLevel = 'Mid Level';
  } else if (juniorKeywords.some(keyword => text.includes(keyword)) || maxYears <= 1) {
    experienceLevel = 'Entry Level';
  }
  
  // Generate intelligent summary
  const topSkills = finalSkills.slice(0, 8).join(', ');
  let summary = `${experienceLevel} professional`;
  
  if (category !== 'General') {
    summary += ` specializing in ${category}`;
  }
  
  if (topSkills) {
    summary += `, with expertise in ${topSkills}`;
  }
  
  if (maxYears > 0) {
    summary += `. ${maxYears} ${maxYears === 1 ? 'year' : 'years'} of experience`;
  }
  
  const result = {
    skills: finalSkills,
    category,
    experienceLevel,
    summary,
    extractedYears: maxYears,
    textLength: resumeText.length,
    skillsCount: finalSkills.length,
    analysisQuality: finalSkills.length >= 8 ? 'High' : finalSkills.length >= 5 ? 'Medium' : 'Basic',
    confidence: Math.min(100, Math.max(40, (finalSkills.length * 10) + (maxYears * 5))),
    originalSkillsDetected: detectedSkills.length,
    skillsFiltered: detectedSkills.length - finalSkills.length
  };
  
  console.log('Enhanced analysis result:', result);
  return result;
};

// Helper function to determine skill category
const determineSkillCategory = (skill: string): 'technical' | 'soft' | 'language' => {
  const softSkills = ['Leadership', 'Communication', 'Problem Solving', 'Team Work', 'Project Management', 'Agile Methodology'];
  const languageSkills = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'];
  
  if (softSkills.some(softSkill => skill.toLowerCase().includes(softSkill.toLowerCase()))) {
    return 'soft';
  }
  
  if (languageSkills.some(lang => skill.toLowerCase().includes(lang.toLowerCase()))) {
    return 'language';
  }
  
  return 'technical'; // Default to technical for most programming/tech skills
};

// Debug analyze resume endpoint (fast version for testing)
router.post('/analyze-resume-debug', authMiddleware, upload.single('resume'), async (req, res) => {
  console.log('🐛 Debug resume analysis endpoint called');
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No resume file uploaded' 
      });
    }
    
    console.log('📁 File received:', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    const user = (req as any).user;
    const filePath = req.file.path;
    
    // Just extract text, skip AI processing for debugging
    let resumeText = '';
    try {
      resumeText = await extractResumeText(filePath);
      console.log('✅ Text extracted:', resumeText.length, 'characters');
    } catch (extractError) {
      console.error('❌ Text extraction failed:', extractError);
      return res.status(400).json({
        success: false,
        error: 'Failed to extract text from PDF'
      });
    }
    
    // Simple analysis without AI
    const basicAnalysis = {
      skills: ['JavaScript', 'React', 'Node.js'], // Mock skills
      category: 'Software Development',
      experienceLevel: 'Entry Level',
      summary: 'Resume processed successfully',
      extractedYears: 1,
      extractionMethod: 'Debug-Basic'
    };
    
    console.log('✅ Debug analysis completed');
    
    res.json({
      success: true,
      message: 'Debug resume analysis completed',
      data: basicAnalysis,
      debug: {
        textLength: resumeText.length,
        fileName: req.file.filename,
        fileSize: req.file.size
      }
    });
    
  } catch (error) {
    console.error('❌ Debug analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug analysis failed'
    });
  }
});

// Analyze resume endpoint
router.post('/analyze-resume', authMiddleware, upload.single('resume'), async (req, res) => {
  console.log('Resume analysis endpoint called');
  
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ 
        success: false, 
        error: 'No resume file uploaded' 
      });
    }
    
    console.log('File received:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
    
    const user = (req as any).user;
    const filePath = req.file.path;
    
    let resumeText = '';
    let analysis: any = {};
    
    try {
      // Extract text from PDF
      console.log('Starting PDF text extraction...');
      resumeText = await extractResumeText(filePath);
      console.log('PDF text extraction successful, text length:', resumeText.length);
      
    } catch (extractError) {
      console.error('PDF extraction failed:', extractError);
      
      // Clean up file on extraction error
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.log('Could not clean up file after extraction error');
      }
      
      return res.status(400).json({
        success: false,
        error: `Failed to extract text from PDF: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`
      });
    }
    
    try {
      // Analyze with AI and extract comprehensive details
      console.log('Starting comprehensive resume analysis...');
      
      // Start with basic analysis (fast)
      analysis = analyzeResumeWithAI(resumeText);
      console.log('✅ Basic analysis completed');
      
      // Try AI structure extraction with timeout protection
      let structuredData = null;
      try {
        console.log('🤖 Starting AI structure extraction...');
        const extractionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI extraction timeout')), 30000) // 30 second timeout
        );
        
        const extractionPromise = AIResumeMatchingService.extractResumeStructure(resumeText);
        
        structuredData = await Promise.race([extractionPromise, extractionTimeout]);
        console.log('✅ AI structure extraction completed successfully');
      } catch (aiError) {
        console.warn('⚠️ AI structure extraction failed or timed out, using basic extraction:', aiError instanceof Error ? aiError.message : 'Unknown error');
        structuredData = null; // Will fall back to basic extraction
      }
      
      // Also keep the basic extraction for fallback
      const extractedDetails = await extractResumeDetails(resumeText);
      
      console.log('Analysis completed:', {
        skillsFound: analysis.skills.length,
        category: analysis.category,
        experienceLevel: analysis.experienceLevel,
        structuredEducation: (structuredData as any)?.education?.length || 0,
        structuredExperience: (structuredData as any)?.experience?.length || 0,
        structuredSkills: (structuredData as any)?.skills?.length || 0,
        aiExtractionSuccess: structuredData !== null
      });
      
      console.log('Detail extraction completed:', {
        experienceEntries: extractedDetails.experience.length,
        educationEntries: extractedDetails.education.length,
        projectsFound: extractedDetails.projects.length,
        certificationsFound: extractedDetails.certifications.length,
        contactInfoFound: !!extractedDetails.contactInfo.email
      });
      
      // Merge extracted details with analysis and structured data
      analysis.extractedDetails = extractedDetails;
      analysis.structuredData = structuredData;
      
    } catch (analysisError) {
      console.error('AI analysis failed:', analysisError);
      
      // Clean up file on analysis error
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.log('Could not clean up file after analysis error');
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze resume content'
      });
    }
    
    // Try to save analysis to student profile
    try {
      console.log('Saving analysis to student profile...');
      let student = await Student.findOne({ userId: user._id }) as any;
      
      if (!student) {
        console.log('Student profile not found, creating new one...');
        // Create a basic student profile if it doesn't exist
        student = new Student({
          userId: user._id,
          firstName: user.name?.split(' ')[0] || 'Student',
          lastName: user.name?.split(' ')[1] || '',
          email: user.email,
          collegeId: new mongoose.Types.ObjectId(), // Temporary placeholder
          studentId: `STU${Date.now()}`,
          enrollmentYear: new Date().getFullYear(),
          education: [],
          experience: [],
          skills: analysis.skills.map((skill: string) => ({
            name: skill,
            level: 'intermediate' as const,
            category: 'technical' as const
          })),
          jobPreferences: {
            jobTypes: [analysis.category],
            preferredLocations: ['Any'],
            workMode: 'any' as const
          },
          profileCompleteness: 50,
          isActive: true,
          isPlacementReady: false
        });
        
        await student.save();
        console.log('New student profile created');
      }
      
      // Enhanced: Update with resume analysis, file storage, and structured data
      student.resumeFile = req.file.path; // Store the file path
      student.resumeText = resumeText; // Store full resume text
      student.resumeAnalysis = {
        ...analysis,
        uploadDate: new Date(),
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        resumeText: resumeText.substring(0, 1000), // Store first 1000 chars for reference
        structuredData: analysis.structuredData, // Store AI-extracted structured data
        extractionMethod: analysis.structuredData?.skills?.length > 0 ? 'AI-Enhanced' : 'Basic'
      };
      
      console.log(`📁 Resume file stored at: ${req.file.path}`);
      console.log(`🗃️ Resume text length: ${resumeText.length} characters`);
      console.log(`🤖 Extraction method: ${student.resumeAnalysis.extractionMethod}`);
      
      // Update personal information if extracted
      if (analysis.extractedDetails?.personalInfo?.name) {
        const nameParts = analysis.extractedDetails.personalInfo.name.split(' ');
        if (nameParts.length >= 2) {
          student.firstName = nameParts[0];
          student.lastName = nameParts.slice(1).join(' ');
        }
      }
      
      // Enhanced: Update contact information using AI structured data first
      try {
        if (analysis.structuredData?.personalInfo) {
          const personalInfo = analysis.structuredData.personalInfo;
          if (personalInfo.email && !student.email) {
            student.email = personalInfo.email;
          }
          if (personalInfo.phone && !student.phoneNumber) {
            student.phoneNumber = personalInfo.phone;
          }
          if (personalInfo.name && (!student.firstName || !student.lastName)) {
            const nameParts = personalInfo.name.split(' ');
            if (nameParts.length >= 2) {
              student.firstName = nameParts[0];
              student.lastName = nameParts.slice(1).join(' ');
            }
          }
          console.log('✅ Updated contact info from AI data');
        }
        // Fallback to old extraction method
        else if (analysis.extractedDetails?.contactInfo) {
          const contact = analysis.extractedDetails.contactInfo;
          if (contact.email && !student.email) {
            student.email = contact.email;
          }
          if (contact.phone && !student.phoneNumber) {
            student.phoneNumber = contact.phone;
          }
          if (contact.linkedin) {
            student.linkedinUrl = contact.linkedin;
          }
          if (contact.github) {
            student.githubUrl = contact.github;
          }
          console.log('✅ Updated contact info from basic extraction');
        }
      } catch (contactError) {
        console.warn('⚠️ Error updating contact info:', contactError);
      }
      
      // Enhanced: Update experience information using AI structured data first
      if (analysis.structuredData?.experience && analysis.structuredData.experience.length > 0) {
        console.log(`🤖 Updating experience with ${analysis.structuredData.experience.length} AI-extracted entries`);
        student.experience = analysis.structuredData.experience
          .filter((exp: any) => exp.title && exp.company) // Filter out incomplete entries
          .map((exp: any) => ({
            title: exp.title,
            company: exp.company,
            location: exp.location || '',
            startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
            endDate: exp.endDate && !exp.isCurrentJob && exp.endDate !== 'Present' ? new Date(exp.endDate) : undefined,
            description: exp.description || '',
            isCurrentJob: exp.isCurrentJob || exp.endDate === 'Present'
          }));
        
        console.log(`✅ Successfully mapped ${student.experience.length} AI experience entries`);
        student.experience.forEach((exp: any, index: number) => {
          console.log(`Experience ${index + 1}: ${exp.title} at ${exp.company} (${exp.isCurrentJob ? 'Current' : 'Past'})`);
        });
      }
      // Fallback to old extraction method
      else if (analysis.extractedDetails?.experience && analysis.extractedDetails.experience.length > 0) {
        console.log(`📄 Updating experience with ${analysis.extractedDetails.experience.length} basic-extracted entries`);
        student.experience = analysis.extractedDetails.experience
          .filter((exp: any) => exp.title && exp.company) // Filter out incomplete entries
          .map((exp: any) => ({
            title: exp.title,
            company: exp.company,
            location: exp.location || '',
            startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
            endDate: exp.endDate && !exp.isCurrentJob ? new Date(exp.endDate) : undefined,
            description: exp.description || '',
            isCurrentJob: exp.isCurrentJob || false
          }));
        
        console.log(`Successfully mapped ${student.experience.length} basic experience entries`);
        student.experience.forEach((exp: any, index: number) => {
          console.log(`Experience ${index + 1}: ${exp.title} at ${exp.company} (${exp.isCurrentJob ? 'Current' : 'Past'})`);
        });
      }
      
      // Enhanced: Update education information using AI structured data first
      if (analysis.structuredData?.education && analysis.structuredData.education.length > 0) {
        console.log(`🤖 Updating education with ${analysis.structuredData.education.length} AI-extracted entries`);
        student.education = analysis.structuredData.education.map((edu: any) => ({
          degree: edu.degree,
          field: edu.field,
          institution: edu.institution,
          startDate: edu.startYear ? new Date(`${edu.startYear}-01-01`) : undefined,
          endDate: edu.endYear ? new Date(`${edu.endYear}-01-01`) : undefined,
          gpa: edu.gpa ? parseFloat(edu.gpa) : undefined,
          isCompleted: edu.isCompleted
        }));
        
        console.log(`✅ Successfully mapped ${student.education.length} AI education entries`);
        student.education.forEach((edu: any, index: number) => {
          console.log(`Education ${index + 1}: ${edu.degree} in ${edu.field} from ${edu.institution}`);
        });
      }
      // Fallback to old extraction method
      else if (analysis.extractedDetails?.education && analysis.extractedDetails.education.length > 0) {
        console.log(`📄 Updating education with ${analysis.extractedDetails.education.length} basic-extracted entries`);
        student.education = analysis.extractedDetails.education.map((edu: any) => ({
          degree: edu.degree,
          field: edu.field,
          institution: edu.institution,
          startDate: edu.startDate,
          endDate: edu.endDate,
          gpa: edu.gpa,
          isCompleted: edu.isCompleted
        }));
      }
      
      // Enhanced: Update skills using AI structured data first, then fallback to basic analysis
      console.log('Previous skills count:', student.skills?.length || 0);
      
      let updatedSkills: any[] = [];
      
      if (analysis.structuredData?.skills && analysis.structuredData.skills.length > 0) {
        console.log(`🤖 Using ${analysis.structuredData.skills.length} AI-extracted skills with levels`);
        updatedSkills = analysis.structuredData.skills.map((skill: any) => ({
          name: skill.name,
          level: skill.level || 'intermediate',
          category: skill.category || 'technical'
        }));
        
        console.log('AI Skills with levels:', updatedSkills.map(s => `${s.name} (${s.level}, ${s.category})`));
      } else {
        console.log(`📄 Using ${analysis.skills.length} basic-detected skills`);
        updatedSkills = analysis.skills.map((skill: string) => ({
          name: skill,
          level: 'intermediate' as const,
          category: determineSkillCategory(skill)
        }));
      }
      
      // Store the enhanced skills
      student.skills = updatedSkills;
      console.log(`✅ Updated skills count: ${student.skills.length}`);
      
      // Update job preferences category if detected
      if (analysis.category !== 'General' && !student.jobPreferences.jobTypes.includes(analysis.category)) {
        student.jobPreferences.jobTypes.push(analysis.category);
      }
      
      await student.save();
      console.log('Student profile updated successfully');
      
      // Trigger job matching process (NO NOTIFICATIONS - just analysis)
      console.log('Triggering job matching analysis (no notifications)...');
      await triggerJobMatching(user._id, analysis);
      
    } catch (updateError) {
      console.error('Could not save to student profile:', updateError);
      // Continue with response even if profile update fails
    }
    
    // Clean up uploaded file (keep for debugging for now)
    // try {
    //   fs.unlinkSync(filePath);
    // } catch (cleanupError) {
    //   console.log('Could not clean up uploaded file');
    // }
    
    console.log('Resume analysis completed successfully');
    res.json({
      success: true,
      message: 'Resume analyzed successfully and profile updated',
      data: analysis
    });
    
  } catch (error) {
    console.error('Resume analysis error:', error);
    
    // Clean up file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze resume'
    });
  }
});

// Enhanced helper function to trigger job matching using unified service
const triggerJobMatching = async (userId: any, analysis: any) => {
  try {
    console.log(`🎯 Triggering unified job matching for user ${userId} with enhanced data:`, {
      skills: analysis.skills,
      category: analysis.category,
      experienceLevel: analysis.experienceLevel,
      extractedYears: analysis.extractedYears
    });
    
    // Use unified matching service for consistent logic and 70% threshold
    const { matchingJobs } = require('../services/unified-matching');
    await matchingJobs.handleResumeUpload(userId.toString(), analysis);
    
    console.log(`✅ Unified job matching completed for user ${userId}`);
    
  } catch (error) {
    console.error('❌ Unified job matching failed:', error);
    throw error; // Re-throw to handle in calling function
  }
};

// Get student profile with resume analysis
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    console.log('Auth middleware user object:', JSON.stringify(user, null, 2));
    
    // Make sure we have a valid user object from authentication
    if (!user || !user._id) {
      console.log('No user or user._id found in request');
      return res.status(401).json({
        success: false,
        error: 'Authentication required - user not found in token'
      });
    }
    
    // Try different methods to find the student record
    let student = null;
    
    console.log('Trying to find student with user._id:', user._id);
    console.log('user._id type:', typeof user._id);
    
    // Method 1: Try by userId as ObjectId
    if (mongoose.Types.ObjectId.isValid(user._id)) {
      console.log('Attempting Method 1: Finding by userId as ObjectId');
      student = await Student.findOne({ userId: user._id }).select('-password');
      console.log('Method 1 result:', student ? 'Found' : 'Not found');
    }
    
    // Method 2: Try by userId as string if it's stored that way
    if (!student && typeof user._id === 'string') {
      console.log('Attempting Method 2: Finding by userId as string');
      student = await Student.findOne({ userId: user._id.toString() }).select('-password');
      console.log('Method 2 result:', student ? 'Found' : 'Not found');
    }
    
    // Method 3: Try by _id directly in case userId is stored as the student document _id
    if (!student && mongoose.Types.ObjectId.isValid(user._id)) {
      console.log('Attempting Method 3: Finding by _id directly');
      student = await Student.findById(user._id).select('-password');
      console.log('Method 3 result:', student ? 'Found' : 'Not found');
    }
    
    // Method 4: Try by email as fallback
    if (!student && user.email) {
      console.log('Attempting Method 4: Finding by email');
      student = await Student.findOne({ email: user.email }).select('-password');
      console.log('Method 4 result:', student ? 'Found' : 'Not found');
    }
    
    // If still not found, create a basic student profile automatically
    if (!student) {
      console.log('Student not found after all methods, creating basic profile');
      
      try {
        // Create a basic student profile
        const newStudent = new Student({
          userId: user._id,
          firstName: user.name?.split(' ')[0] || user.firstName || 'Student',
          lastName: user.name?.split(' ')[1] || user.lastName || '',
          email: user.email,
          collegeId: new mongoose.Types.ObjectId(), // Temporary placeholder
          studentId: `STU${Date.now()}`,
          enrollmentYear: new Date().getFullYear(),
          education: [],
          experience: [],
          skills: [],
          jobPreferences: {
            jobTypes: [],
            preferredLocations: ['Any'],
            workMode: 'any'
          },
          profileCompleteness: 30,
          isActive: true,
          isPlacementReady: false
        });
        
        await newStudent.save();
        console.log('Created new student profile');
        student = newStudent;
      } catch (createError) {
        console.error('Failed to create student profile:', createError);
        // Return basic profile if creation fails
        return res.json({
          success: true,
          data: {
            personalInfo: {
              firstName: user.name?.split(' ')[0] || user.firstName || 'Student',
              lastName: user.name?.split(' ')[1] || user.lastName || '',
              email: user.email
            },
            resumeAnalysis: null,
            profileExists: false
          }
        });
      }
    }
    
    // Convert to plain object if it's a Mongoose document
    const studentData = student.toObject ? student.toObject() : student;
    console.log('Returning student profile successfully');
    
    // Ensure all required fields are present with proper structure
    const responseData = {
      _id: studentData._id,
      userId: studentData.userId,
      
      // Personal Information
      firstName: studentData.firstName || user.name?.split(' ')[0] || 'Student',
      lastName: studentData.lastName || user.name?.split(' ')[1] || '',
      email: studentData.email || user.email,
      phoneNumber: studentData.phoneNumber || '',
      dateOfBirth: studentData.dateOfBirth || '',
      gender: studentData.gender || '',
      
      // Social URLs
      linkedinUrl: studentData.linkedinUrl || '',
      githubUrl: studentData.githubUrl || '',
      portfolioUrl: studentData.portfolioUrl || '',
      
      // Academic Info
      studentId: studentData.studentId || '',
      enrollmentYear: studentData.enrollmentYear || new Date().getFullYear(),
      graduationYear: studentData.graduationYear || new Date().getFullYear() + 4,
      currentSemester: studentData.currentSemester || 1,
      collegeId: studentData.collegeId,
      
      // Profile Arrays - ensure they exist and map to frontend format
      education: studentData.education || [],
      experience: (studentData.experience || []).map((exp: any) => ({
        company: exp.company,
        position: exp.title, // Map title to position for frontend compatibility
        description: exp.description || '',
        startDate: exp.startDate ? exp.startDate.toISOString().split('T')[0] : '',
        endDate: exp.endDate ? exp.endDate.toISOString().split('T')[0] : '',
        isCurrentJob: exp.isCurrentJob || false,
        location: exp.location || ''
      })),
      skills: studentData.skills || [],
      
      // Job Preferences
      jobPreferences: studentData.jobPreferences || {
        jobTypes: [],
        preferredLocations: [],
        workMode: 'any'
      },
      
      // Resume and analysis data
      resumeFile: studentData.resumeFile,
      resumeText: studentData.resumeText,
      resumeScore: studentData.resumeScore,
      resumeAnalysis: studentData.resumeAnalysis,
      
      // Job matching data
      jobMatches: studentData.jobMatches || [],
      lastJobMatchUpdate: studentData.lastJobMatchUpdate,
      
      // Status fields
      profileCompleteness: studentData.profileCompleteness || 30,
      isActive: studentData.isActive !== false,
      isPlacementReady: studentData.isPlacementReady || false,
      
      // Personal info for backward compatibility
      personalInfo: {
        firstName: studentData.firstName || user.name?.split(' ')[0] || 'Student',
        lastName: studentData.lastName || user.name?.split(' ')[1] || '',
        email: studentData.email || user.email
      },
      profileExists: true
    };
    
    res.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update student profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const updateData = req.body;
    
    if (!user || !user._id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    console.log('Updating profile for user:', user._id);
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    // Find the student using the same logic as the profile endpoint
    let student = null;
    
    // Try multiple methods to find the student
    if (mongoose.Types.ObjectId.isValid(user._id)) {
      student = await Student.findOne({ userId: user._id });
    }
    
    if (!student && typeof user._id === 'string') {
      student = await Student.findOne({ userId: user._id.toString() });
    }
    
    if (!student && mongoose.Types.ObjectId.isValid(user._id)) {
      student = await Student.findById(user._id);
    }
    
    if (!student && user.email) {
      student = await Student.findOne({ email: user.email });
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }
    
    // Transform experience data from frontend format to backend format
    const transformedExperience = updateData.experience ? updateData.experience.map((exp: any) => ({
      title: exp.position || exp.title, // Map position back to title for storage
      company: exp.company,
      location: exp.location || '',
      startDate: exp.startDate ? new Date(exp.startDate) : undefined,
      endDate: exp.endDate ? new Date(exp.endDate) : undefined,
      description: exp.description || '',
      isCurrentJob: exp.isCurrentJob || false
    })) : undefined;

    // Prepare update data - ensure we don't override important system fields
    const allowedUpdates = {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      email: updateData.email,
      phoneNumber: updateData.phoneNumber,
      dateOfBirth: updateData.dateOfBirth,
      gender: updateData.gender,
      linkedinUrl: updateData.linkedinUrl,
      githubUrl: updateData.githubUrl,
      portfolioUrl: updateData.portfolioUrl,
      studentId: updateData.studentId,
      enrollmentYear: updateData.enrollmentYear,
      graduationYear: updateData.graduationYear,
      currentSemester: updateData.currentSemester,
      education: updateData.education,
      experience: transformedExperience,
      skills: updateData.skills,
      jobPreferences: updateData.jobPreferences,
      lastModified: new Date()
    };
    
    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => {
      if ((allowedUpdates as any)[key] === undefined) {
        delete (allowedUpdates as any)[key];
      }
    });
    
    // Update the student document
    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );
    
    if (!updatedStudent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
    
    console.log('Profile updated successfully');
    
    // If skills were updated, trigger job matching in background using unified service
    if (updateData.skills && updateData.skills.length > 0) {
      setImmediate(async () => {
        try {
          console.log('Triggering background unified job matching after profile update');
          const skillNames = updateData.skills.map((skill: any) => skill.name || skill);
          const category = 'General'; // You might want to derive this from skills
          
          // Use unified matching service for consistent logic and 70% threshold
          const { matchingJobs } = require('../services/unified-matching');
          const mockAnalysis = {
            skills: skillNames,
            category: category,
            experienceLevel: 'Entry Level', // Default or derive from profile
            extractedYears: 0
          };
          
          await matchingJobs.handleResumeUpload(user._id.toString(), mockAnalysis);
          console.log(`Updated job matches using unified service`);
        } catch (error) {
          console.error('Background unified job matching failed:', error);
        }
      });
    }
    
    // Return the updated profile in the same format as the GET endpoint
    const responseData = {
      _id: updatedStudent._id,
      userId: updatedStudent.userId,
      firstName: updatedStudent.firstName,
      lastName: updatedStudent.lastName,
      email: updatedStudent.email,
      phoneNumber: updatedStudent.phoneNumber,
      dateOfBirth: updatedStudent.dateOfBirth,
      gender: updatedStudent.gender,
      linkedinUrl: updatedStudent.linkedinUrl,
      githubUrl: updatedStudent.githubUrl,
      portfolioUrl: updatedStudent.portfolioUrl,
      studentId: updatedStudent.studentId,
      enrollmentYear: updatedStudent.enrollmentYear,
      graduationYear: updatedStudent.graduationYear,
      currentSemester: updatedStudent.currentSemester,
      education: updatedStudent.education || [],
      experience: updatedStudent.experience || [],
      skills: updatedStudent.skills || [],
      jobPreferences: updatedStudent.jobPreferences || {
        jobTypes: [],
        preferredLocations: [],
        workMode: 'any'
      },
      profileExists: true
    };
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: responseData
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Get job matches for student
router.get('/job-matches', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Try different methods to find the student record like we did for profile
    let student = null;
    
    // Method 1: Try by userId as ObjectId
    if (mongoose.Types.ObjectId.isValid(user._id)) {
      student = await Student.findOne({ userId: user._id }).select('jobMatches lastJobMatchUpdate');
    }
    
    // Method 2: Try by userId as string if it's stored that way
    if (!student && typeof user._id === 'string') {
      student = await Student.findOne({ userId: user._id.toString() }).select('jobMatches lastJobMatchUpdate');
    }
    
    // Method 3: Try by _id directly in case userId is stored as the student document _id
    if (!student && mongoose.Types.ObjectId.isValid(user._id)) {
      student = await Student.findById(user._id).select('jobMatches lastJobMatchUpdate');
    }
    
    // Method 4: Try by email as fallback
    if (!student && user.email) {
      student = await Student.findOne({ email: user.email }).select('jobMatches lastJobMatchUpdate');
    }
    
    if (!student || !student.jobMatches || student.jobMatches.length === 0) {
      return res.json({
        success: true,
        data: {
          matches: [],
          lastUpdate: null,
          totalMatches: 0
        }
      });
    }
    
    // Process matches to ensure salary is a string
    const processedMatches = student.jobMatches.map((match: any) => {
      // Fix salary if it's an object
      if (match.salary && typeof match.salary === 'object') {
        const { min, max, currency } = match.salary;
        match.salary = `${min}-${max} ${currency || ''}`.trim();
      }
      
      return match;
    });
    
    res.json({
      success: true,
      data: {
        matches: processedMatches || [],
        lastUpdate: student.lastJobMatchUpdate,
        totalMatches: processedMatches?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Job matches fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job matches'
    });
  }
});

// Get comprehensive student profile data
router.get('/profile/comprehensive', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    
    const student = await Student.findOne({ userId: user._id })
      .select('firstName lastName email phoneNumber linkedinUrl githubUrl education experience skills resumeAnalysis jobPreferences profileCompleteness isPlacementReady')
      .lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }
    
    // Structure the comprehensive profile data
    const comprehensiveProfile = {
      basic: {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phoneNumber: student.phoneNumber,
        linkedinUrl: student.linkedinUrl,
        githubUrl: student.githubUrl
      },
      education: student.education || [],
      experience: (student.experience || []).map((exp: any) => ({
        company: exp.company,
        position: exp.title, // Map title to position for frontend compatibility
        description: exp.description || '',
        startDate: exp.startDate ? exp.startDate.toISOString().split('T')[0] : '',
        endDate: exp.endDate ? exp.endDate.toISOString().split('T')[0] : '',
        isCurrentJob: exp.isCurrentJob || false,
        location: exp.location || ''
      })),
      skills: student.skills || [],
      resumeAnalysis: student.resumeAnalysis,
      extractedFromResume: student.resumeAnalysis?.extractedDetails || null,
      jobPreferences: student.jobPreferences,
      profileMetrics: {
        completeness: student.profileCompleteness,
        isPlacementReady: student.isPlacementReady,
        lastResumeUpload: student.resumeAnalysis?.uploadDate
      }
    };
    
    res.json({
      success: true,
      data: comprehensiveProfile
    });
    
  } catch (error) {
    console.error('Error fetching comprehensive profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comprehensive profile'
    });
  }
});

// Update student profile with extracted resume data
router.put('/profile/update-from-resume', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { section, data } = req.body;
    
    const student = await Student.findOne({ userId: user._id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }
    
    // Update specific sections based on request
    switch (section) {
      case 'experience':
        if (data && Array.isArray(data)) {
          student.experience = data
            .filter((exp: any) => exp.title && exp.company && exp.startDate)
            .map((exp: any) => ({
              title: exp.title,
              company: exp.company,
              location: exp.location,
              startDate: new Date(exp.startDate),
              endDate: exp.endDate ? new Date(exp.endDate) : undefined,
              description: exp.description,
              isCurrentJob: exp.isCurrentJob || false
            }));
        }
        break;
        
      case 'education':
        if (data && Array.isArray(data)) {
          student.education = data
            .filter((edu: any) => edu.degree && edu.field && edu.institution && edu.startDate)
            .map((edu: any) => ({
              degree: edu.degree,
              field: edu.field,
              institution: edu.institution,
              startDate: new Date(edu.startDate),
              endDate: edu.endDate ? new Date(edu.endDate) : undefined,
              gpa: edu.gpa,
              isCompleted: edu.isCompleted !== false
            }));
        }
        break;
        
      case 'contact':
        if (data) {
          if (data.email) student.email = data.email;
          if (data.phoneNumber) student.phoneNumber = data.phoneNumber;
          if (data.linkedinUrl) student.linkedinUrl = data.linkedinUrl;
          if (data.githubUrl) student.githubUrl = data.githubUrl;
        }
        break;
        
      case 'skills':
        if (data && Array.isArray(data)) {
          student.skills = data.map((skill: any) => ({
            name: skill.name || skill,
            level: skill.level || 'intermediate',
            category: skill.category || 'technical'
          }));
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid section specified'
        });
    }
    
    await student.save();
    
    res.json({
      success: true,
      message: `${section} updated successfully`,
      data: student[section as keyof typeof student]
    });
    
  } catch (error) {
    console.error('Error updating profile from resume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Serve resume files
router.get('/resume/file/:studentId', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { studentId } = req.params;
    
    // Find the student
    const student = await Student.findOne({ 
      $or: [
        { _id: studentId },
        { userId: user._id } // Allow user to access their own resume
      ]
    });
    
    if (!student || !student.resumeFile) {
      return res.status(404).json({
        success: false,
        error: 'Resume file not found'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(student.resumeFile)) {
      return res.status(404).json({
        success: false,
        error: 'Resume file not found on disk'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${student.resumeAnalysis?.originalFileName || 'resume.pdf'}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(student.resumeFile);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving resume file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve resume file'
    });
  }
});

// Get resume upload status and metadata
router.get('/resume/status', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    
    const student = await Student.findOne({ userId: user._id })
      .select('resumeFile resumeAnalysis resumeScore')
      .lean();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }
    
    const hasResume = !!student.resumeFile;
    const resumeExists = hasResume && student.resumeFile && fs.existsSync(student.resumeFile);
    
    res.json({
      success: true,
      data: {
        hasResume,
        resumeExists,
        fileName: student.resumeAnalysis?.fileName,
        originalFileName: student.resumeAnalysis?.originalFileName,
        uploadDate: student.resumeAnalysis?.uploadDate,
        resumeScore: student.resumeScore,
        analysisQuality: student.resumeAnalysis?.analysisQuality,
        skillsDetected: student.resumeAnalysis?.skills?.length || 0,
        experienceLevel: student.resumeAnalysis?.experienceLevel,
        category: student.resumeAnalysis?.category
      }
    });
    
  } catch (error) {
    console.error('Error getting resume status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get resume status'
    });
  }
});

export default router;
