#!/usr/bin/env node
/**
 * Test script to verify PDF generation functionality
 */

const ResumeBuilderService = require('./dist/services/resume-builder').default;

async function testPDFGeneration() {
    console.log('🧪 Testing PDF generation functionality...');
    
    const testResumeData = {
        personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            location: 'New York, NY'
        },
        summary: 'Experienced software developer with 5+ years of experience in full-stack development.',
        skills: [
            { name: 'JavaScript', level: 'expert', category: 'technical' },
            { name: 'React', level: 'expert', category: 'technical' },
            { name: 'Node.js', level: 'intermediate', category: 'technical' }
        ],
        experience: [
            {
                title: 'Senior Software Developer',
                company: 'Tech Corp',
                location: 'New York, NY',
                startDate: new Date('2020-01-01'),
                endDate: undefined,
                isCurrentJob: true,
                description: 'Led development of web applications using React and Node.js'
            }
        ],
        education: [
            {
                degree: 'Bachelor of Science',
                field: 'Computer Science',
                institution: 'University of Technology',
                startDate: new Date('2015-09-01'),
                endDate: new Date('2019-05-01'),
                isCompleted: true
            }
        ],
        projects: [
            {
                name: 'E-commerce Platform',
                description: 'Built a full-stack e-commerce platform',
                technologies: ['React', 'Node.js', 'MongoDB']
            }
        ]
    };

    try {
        console.log('🔄 Generating HTML content...');
        const htmlContent = ResumeBuilderService.generateResumeHTML(testResumeData);
        console.log('✅ HTML content generated successfully');

        console.log('🔄 Generating PDF...');
        const pdfBuffer = await ResumeBuilderService.generatePDF(htmlContent);
        console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');

        // Save test PDF
        const fs = require('fs');
        const testPdfPath = './test-resume.pdf';
        fs.writeFileSync(testPdfPath, pdfBuffer);
        console.log('📄 Test PDF saved to:', testPdfPath);

        console.log('🎉 PDF generation test completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ PDF generation test failed:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

testPDFGeneration();
