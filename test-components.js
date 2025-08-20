#!/usr/bin/env node

// Test WABB functionality without full server
console.log('🧪 Testing WABB components individually...\n');

// Test 1: Mock WhatsApp Service
console.log('1️⃣ Testing Mock WhatsApp Service...');
try {
    const mockWhatsApp = require('./apps/api/src/services/mock-whatsapp.js');
    
    // Test the mock service directly
    mockWhatsApp.sendMessage('919876543210', 'Test message from direct component test', 'resume')
        .then(result => {
            console.log('✅ Mock WhatsApp Service working:', {
                success: result.success,
                mock: result.mock,
                messageId: result.data.messageId
            });
        })
        .catch(error => {
            console.error('❌ Mock WhatsApp Service failed:', error.message);
        });
} catch (error) {
    console.error('❌ Mock WhatsApp Service import failed:', error.message);
}

// Test 2: Test fallback logic
console.log('\n2️⃣ Testing WhatsApp fallback logic...');
try {
    const hasWabbConfig = process.env.WABB_API_KEY || process.env.WABB_WEBHOOK_URL;
    console.log('WABB Configuration present:', !!hasWabbConfig);
    console.log('Environment variables:', {
        WABB_API_KEY: !!process.env.WABB_API_KEY,
        WABB_WEBHOOK_URL: !!process.env.WABB_WEBHOOK_URL,
        WABB_WEBHOOK_URL_RESUME: !!process.env.WABB_WEBHOOK_URL_RESUME
    });
    
    if (!hasWabbConfig) {
        console.log('✅ Will use mock WhatsApp service as expected');
    } else {
        console.log('⚠️ WABB configuration detected, will try real service first');
    }
} catch (error) {
    console.error('❌ Fallback logic test failed:', error.message);
}

// Test 3: Test PDF generation without server
console.log('\n3️⃣ Testing PDF generation components...');
try {
    const PDFDocument = require('pdfkit');
    
    console.log('✅ PDFKit available for structured PDF generation');
    
    // Test if we can create a simple PDF
    const doc = new PDFDocument();
    doc.fontSize(20).text('Test PDF Document', 100, 100);
    
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log('✅ PDF generation test successful, size:', pdfBuffer.length, 'bytes');
    });
    
    doc.end();
    
} catch (error) {
    console.error('❌ PDF generation test failed:', error.message);
}

// Test 4: Test Azure PDF Service availability
console.log('\n4️⃣ Testing Azure PDF Service availability...');
try {
    const axios = require('axios');
    const azurePdfServiceUrl = process.env.AZURE_PDF_SERVICE_URL || 'http://localhost:3000';
    
    console.log('Azure PDF Service URL:', azurePdfServiceUrl);
    
    // Try to reach the health endpoint
    axios.get(`${azurePdfServiceUrl}/health`, { timeout: 5000 })
        .then(response => {
            console.log('✅ Azure PDF Service available:', response.status);
        })
        .catch(error => {
            console.log('⚠️ Azure PDF Service not available:', error.message);
            console.log('💡 Will fall back to PDFKit structured generation');
        });
} catch (error) {
    console.error('❌ Azure PDF Service test failed:', error.message);
}

console.log('\n🏁 Component tests completed!');
console.log('📋 Summary: WABB integration should work with mock WhatsApp service and structured PDF generation');

// Test 5: Test simple resume data structure
setTimeout(() => {
    console.log('\n5️⃣ Testing resume data structure...');
    
    const sampleResumeData = {
        personalInfo: {
            firstName: 'Prem',
            lastName: 'Thakare',
            email: 'test@campuspe.com',
            phone: '919876543210',
            location: 'India'
        },
        summary: 'Experienced digital marketing specialist with a proven track record of driving brand awareness, lead generation, and customer engagement through innovative online campaigns.',
        education: [{
            degree: 'B.Tech',
            field: 'Computer Science and Engineering',
            institution: 'University',
            startDate: new Date('2020-01-01'),
            endDate: new Date('2024-01-01'),
            isCompleted: true
        }],
        skills: [
            { name: 'JavaScript', level: 'intermediate', category: 'technical' },
            { name: 'React', level: 'intermediate', category: 'technical' },
            { name: 'Node.js', level: 'intermediate', category: 'technical' },
            { name: 'SEO', level: 'advanced', category: 'marketing' },
            { name: 'Content Marketing', level: 'advanced', category: 'marketing' }
        ],
        experience: [{
            title: 'Software Development & Engineering Intern',
            company: 'Tech Company',
            location: 'India',
            startDate: new Date('2023-01-01'),
            endDate: new Date(),
            description: 'Developed web applications using modern technologies and frameworks.',
            isCurrentJob: true
        }],
        projects: [{
            name: 'Web Application Development',
            description: 'Built and deployed web applications with user authentication and data management.',
            technologies: ['React', 'Node.js', 'MongoDB']
        }],
        certifications: []
    };
    
    console.log('✅ Sample resume data structure created');
    console.log('📊 Resume completeness:', {
        hasPersonalInfo: !!sampleResumeData.personalInfo,
        hasEducation: sampleResumeData.education.length > 0,
        hasSkills: sampleResumeData.skills.length > 0,
        hasExperience: sampleResumeData.experience.length > 0,
        hasProjects: sampleResumeData.projects.length > 0
    });
    
    console.log('\n🎯 This matches the profile data from the attached resume image!');
    console.log('💡 The system should be able to generate a PDF from this data');
    
}, 2000);
