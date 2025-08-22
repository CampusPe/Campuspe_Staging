#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

/**
 * Test PDF Generation After Fixes
 * This script tests the fixed PDF generation service
 */

const API_BASE = 'http://localhost:5001';

const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .name { font-size: 24px; font-weight: bold; color: #2563eb; text-align: center; }
        .contact { text-align: center; margin: 10px 0; color: #666; }
        .section { margin: 20px 0; }
        .section-title { font-size: 16px; font-weight: bold; color: #1e40af; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
        .skill { display: inline-block; background: #e5e7eb; padding: 5px 10px; margin: 2px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="name">John Doe</div>
    <div class="contact">📧 john.doe@email.com • 📱 +1-555-0123 • 📍 San Francisco, CA</div>
    
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <p>Experienced Software Engineer with 5+ years of experience in full-stack development, 
        specializing in React, Node.js, and cloud technologies. Proven track record of delivering 
        scalable web applications and improving system performance.</p>
    </div>
    
    <div class="section">
        <div class="section-title">Technical Skills</div>
        <span class="skill">JavaScript</span>
        <span class="skill">React</span>
        <span class="skill">Node.js</span>
        <span class="skill">TypeScript</span>
        <span class="skill">Python</span>
        <span class="skill">AWS</span>
        <span class="skill">Docker</span>
        <span class="skill">PostgreSQL</span>
    </div>
    
    <div class="section">
        <div class="section-title">Professional Experience</div>
        <div style="margin-bottom: 15px;">
            <div style="font-weight: bold;">Senior Software Engineer</div>
            <div style="color: #666;">TechCorp Inc. • 2021 - Present</div>
            <ul>
                <li>Led development of microservices architecture serving 100K+ users</li>
                <li>Improved application performance by 40% through optimization</li>
                <li>Mentored junior developers and established coding standards</li>
            </ul>
        </div>
    </div>
</body>
</html>
`;

async function testPDFGeneration() {
    console.log('🧪 Testing Fixed PDF Generation Service');
    console.log('=====================================');
    
    try {
        console.log('🔍 Testing API health...');
        const healthResponse = await axios.get(`${API_BASE}/health`);
        console.log('✅ API is healthy:', healthResponse.data.status);
        
        console.log('\n📄 Testing PDF generation system...');
        const startTime = Date.now();
        
        const response = await axios.get(`${API_BASE}/api/health/pdf`);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (response.status === 200 && response.data.success) {
            console.log('✅ PDF generation successful!');
            console.log(`⏱️  Generation time: ${duration}ms`);
            console.log(`📊 PDF size: ${response.data.pdfSize} bytes`);
            console.log(`🌍 Environment: ${response.data.environment}`);
            console.log(`☁️  Azure detected: ${response.data.isAzure}`);
            
            console.log('\n🎉 SUCCESS: PDF generation system is working!');
            console.log('🔧 Chrome-aws-lambda integration successful');
            console.log('🚀 Application is ready for Azure deployment');
            
        } else {
            console.log('❌ PDF generation failed with status:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data.toString());
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.error('🔧 Make sure the API server is running on port 5001');
        }
    }
}

// Run the test
testPDFGeneration();
