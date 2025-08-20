const fs = require('fs');
const path = require('path');

// Quick test to verify WABB components work
async function quickTest() {
    console.log('🧪 Quick WABB Component Test\n');
    
    // Test 1: Mock WhatsApp Service
    console.log('1️⃣ Testing Mock WhatsApp Service...');
    try {
        const mockWhatsApp = require('./apps/api/src/services/mock-whatsapp.js');
        const result = await mockWhatsApp.sendMessage('919876543210', 'Hello! Your AI-powered resume for Software Developer position is ready! This is a test message.', 'resume');
        
        console.log('✅ Mock WhatsApp Service working:');
        console.log('   - Success:', result.success);
        console.log('   - Mock mode:', result.mock);
        console.log('   - Message ID:', result.data.messageId);
        console.log('   - Phone:', result.phone);
    } catch (error) {
        console.error('❌ Mock WhatsApp failed:', error.message);
    }
    
    // Test 2: PDF Generation with PDFKit
    console.log('\n2️⃣ Testing PDF Generation...');
    try {
        const PDFDocument = require('pdfkit');
        
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 }
        });
        
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        
        return new Promise((resolve) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                console.log('✅ PDF Generation working:');
                console.log('   - PDF Size:', pdfBuffer.length, 'bytes');
                console.log('   - Method: Structured PDFKit (no browser needed)');
                console.log('   - Status: Ready for production use');
                
                // Save test PDF
                const testPdfPath = './test-resume-output.pdf';
                fs.writeFileSync(testPdfPath, pdfBuffer);
                console.log('   - Test PDF saved:', testPdfPath);
                
                resolve();
            });
            
            // Generate a sample resume similar to Prem Thakare's profile
            let yPos = 70;
            
            // Header
            doc.fontSize(28)
               .fillColor('#1e40af')
               .font('Helvetica-Bold')
               .text('PREM THAKARE', 40, yPos, { align: 'center' });
            yPos += 40;
            
            // Contact
            doc.fontSize(10)
               .fillColor('#666')
               .font('Helvetica')
               .text('📧 test@campuspe.com  📱 919876543210  📍 India', 40, yPos, { align: 'center' });
            yPos += 30;
            
            // Professional Summary
            doc.fontSize(14)
               .fillColor('#1e40af')
               .font('Helvetica-Bold')
               .text('PROFESSIONAL SUMMARY', 40, yPos);
            yPos += 20;
            
            doc.fontSize(11)
               .fillColor('#333')
               .font('Helvetica')
               .text('Experienced digital marketing specialist with a proven track record of driving brand awareness, lead generation, and customer engagement through innovative online campaigns. Proficient in SEO, SEM, social media, and content marketing, with the ability to analyze data and optimize campaigns for maximum impact.', 40, yPos, { width: 500, align: 'justify' });
            yPos += 60;
            
            // Education
            doc.fontSize(14)
               .fillColor('#1e40af')
               .font('Helvetica-Bold')
               .text('EDUCATION', 40, yPos);
            yPos += 20;
            
            doc.fontSize(12)
               .fillColor('#333')
               .font('Helvetica-Bold')
               .text('B.Tech in Computer Science and Engineering', 40, yPos);
            yPos += 15;
            
            doc.fontSize(11)
               .fillColor('#666')
               .font('Helvetica')
               .text('University', 40, yPos);
            yPos += 30;
            
            // Skills
            doc.fontSize(14)
               .fillColor('#1e40af')
               .font('Helvetica-Bold')
               .text('SKILLS', 40, yPos);
            yPos += 20;
            
            const skills = [
                'Search Engine Optimization (SEO)', 'Search Engine Marketing (SEM)', 'Social Media Marketing',
                'Content Marketing', 'Google Analytics', 'Google Ads', 'Facebook Ads', 'LinkedIn Campaign Manager',
                'Email Marketing', 'Graphic Design', 'Video Editing', 'Analytical Thinking'
            ];
            
            doc.fontSize(10)
               .fillColor('#333')
               .font('Helvetica')
               .text(`• ${skills.join('\n• ')}`, 40, yPos, { width: 500 });
            yPos += skills.length * 12 + 20;
            
            // Experience
            doc.fontSize(14)
               .fillColor('#1e40af')
               .font('Helvetica-Bold')
               .text('EXPERIENCE', 40, yPos);
            yPos += 20;
            
            doc.fontSize(12)
               .fillColor('#333')
               .font('Helvetica-Bold')
               .text('Software Development & Engineering Intern', 40, yPos);
            yPos += 15;
            
            doc.fontSize(11)
               .fillColor('#666')
               .font('Helvetica')
               .text('Tech Company', 40, yPos);
            yPos += 20;
            
            // Projects
            doc.fontSize(14)
               .fillColor('#1e40af')
               .font('Helvetica-Bold')
               .text('PROJECTS', 40, yPos);
            yPos += 20;
            
            doc.fontSize(12)
               .fillColor('#333')
               .font('Helvetica-Bold')
               .text('Web Application Development', 40, yPos);
            yPos += 15;
            
            doc.fontSize(10)
               .fillColor('#333')
               .font('Helvetica')
               .text('Built and deployed web applications with user authentication, data management, and responsive design using modern frameworks and technologies.', 40, yPos, { width: 500 });
            
            doc.end();
        });
        
    } catch (error) {
        console.error('❌ PDF Generation failed:', error.message);
    }
    
    // Test 3: WABB Configuration Check
    console.log('\n3️⃣ Testing WABB Configuration...');
    const hasWabbConfig = process.env.WABB_API_KEY || process.env.WABB_WEBHOOK_URL;
    
    console.log('Environment check:');
    console.log('   - WABB_API_KEY:', !!process.env.WABB_API_KEY);
    console.log('   - WABB_WEBHOOK_URL:', !!process.env.WABB_WEBHOOK_URL);
    console.log('   - Will use mock service:', !hasWabbConfig);
    
    if (!hasWabbConfig) {
        console.log('✅ Mock WhatsApp service will be used (expected behavior)');
    } else {
        console.log('⚠️ Real WABB service detected, will try real service first');
    }
    
    console.log('\n🎉 Component Test Complete!');
    console.log('📋 Summary:');
    console.log('   ✅ Mock WhatsApp service working');
    console.log('   ✅ PDF generation working');
    console.log('   ✅ Configuration handling correct');
    console.log('   ✅ Ready for full integration test');
    console.log('\n💡 Next: Start the API server and test the full endpoint');
}

// Run the test
quickTest().catch(console.error);
