#!/usr/bin/env node

/**
 * Test script to verify Resume History MongoDB storage fix
 * Tests the entire flow from generation to storage in both collections
 */

const axios = require('axios');
const mongoose = require('mongoose');

// Configuration
const API_BASE_URL = 'http://localhost:5001';
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://prem:Chem1234@cluster0.evfdg.mongodb.net/campuspe';

// Test credentials
const TEST_USER = {
  email: 'premthakare@gmail.com',
  password: 'pppppp'
};

const TEST_JOB_DESCRIPTION = `
Software Engineer Position
We are looking for a skilled software engineer with experience in:
- JavaScript, TypeScript, Node.js
- React, Next.js frontend development
- MongoDB, PostgreSQL databases
- AWS cloud services
- RESTful API development
- Git version control

Requirements:
- Bachelor's degree in Computer Science or related field
- 2+ years of software development experience
- Strong problem-solving skills
- Experience with agile development methodologies
`;

async function testResumeHistoryFix() {
  console.log('🔧 Testing Resume History MongoDB Storage Fix');
  console.log('=' + '='.repeat(50));

  try {
    // Step 1: Login and get token
    console.log('\n1️⃣ Authenticating user...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');

    // Step 2: Test database connection directly
    console.log('\n2️⃣ Testing database connection...');
    const dbTestResponse = await axios.get(`${API_BASE_URL}/api/ai-resume/debug/database`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📊 Database test results:', dbTestResponse.data);

    // Step 3: Generate a new AI resume
    console.log('\n3️⃣ Generating AI resume...');
    const resumeResponse = await axios.post(`${API_BASE_URL}/api/ai-resume/generate-ai`, {
      email: TEST_USER.email,
      phone: '9999999999',
      jobDescription: TEST_JOB_DESCRIPTION,
      includeProfileData: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resumeResponse.data.success) {
      throw new Error('Resume generation failed: ' + resumeResponse.data.message);
    }

    console.log('✅ Resume generated successfully');
    console.log('📄 Resume ID:', resumeResponse.data.data.resumeId);
    console.log('💾 History saved:', resumeResponse.data.historySaved);
    if (resumeResponse.data.historyError) {
      console.log('⚠️ History error:', resumeResponse.data.historyError);
    }

    // Step 4: Fetch resume history from enhanced endpoint
    console.log('\n4️⃣ Fetching resume history...');
    const historyResponse = await axios.get(`${API_BASE_URL}/api/ai-resume/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!historyResponse.data.success) {
      throw new Error('History fetch failed: ' + historyResponse.data.message);
    }

    console.log('📚 Resume history results:');
    console.log('  - Student collection count:', historyResponse.data.data.sources.studentCollection);
    console.log('  - GeneratedResume collection count:', historyResponse.data.data.sources.generatedResumeCollection);

    // Display some details
    if (historyResponse.data.data.resumeHistory.length > 0) {
      console.log('\n📋 Latest resumes in Student.aiResumeHistory:');
      historyResponse.data.data.resumeHistory.slice(0, 3).forEach((resume, index) => {
        console.log(`  ${index + 1}. ${resume.jobTitle} (${new Date(resume.generatedAt).toLocaleDateString()})`);
      });
    }

    if (historyResponse.data.data.generatedResumes.length > 0) {
      console.log('\n📄 Latest resumes in GeneratedResume collection:');
      historyResponse.data.data.generatedResumes.slice(0, 3).forEach((resume, index) => {
        console.log(`  ${index + 1}. ${resume.jobTitle} - Status: ${resume.status} (${new Date(resume.generatedAt).toLocaleDateString()})`);
      });
    }

    // Step 5: Test direct MongoDB connection to verify
    console.log('\n5️⃣ Direct MongoDB verification...');
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB directly');

    // Check Student collection
    const StudentModel = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
    const student = await StudentModel.findOne({ email: TEST_USER.email });
    
    if (student) {
      const aiResumeHistoryCount = student.aiResumeHistory ? student.aiResumeHistory.length : 0;
      console.log(`📚 Student.aiResumeHistory count: ${aiResumeHistoryCount}`);
    }

    // Check GeneratedResume collection
    const GeneratedResumeModel = mongoose.model('GeneratedResume', new mongoose.Schema({}, { strict: false }));
    const generatedResumesCount = await GeneratedResumeModel.countDocuments({ 
      studentId: student._id 
    });
    console.log(`📄 GeneratedResume collection count: ${generatedResumesCount}`);

    // Step 6: Test the generated-resume routes too
    console.log('\n6️⃣ Testing generated-resume routes...');
    try {
      const generatedHistoryResponse = await axios.get(`${API_BASE_URL}/api/generated-resume/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (generatedHistoryResponse.data.success) {
        console.log('✅ Generated-resume history endpoint working');
        console.log('📊 Resumes found:', generatedHistoryResponse.data.data.resumes.length);
      }
    } catch (error) {
      console.log('⚠️ Generated-resume endpoint had issues:', error.message);
    }

    await mongoose.disconnect();

    // Summary
    console.log('\n' + '='.repeat(52));
    console.log('🎉 RESUME HISTORY FIX TEST COMPLETED');
    console.log('=' + '='.repeat(50));
    
    const studentHistoryCount = historyResponse.data.data.sources.studentCollection;
    const generatedResumeCount = historyResponse.data.data.sources.generatedResumeCollection;
    
    if (studentHistoryCount > 0 && generatedResumeCount > 0) {
      console.log('✅ SUCCESS: Both storage methods are working!');
      console.log(`   - Student.aiResumeHistory: ${studentHistoryCount} resumes`);
      console.log(`   - GeneratedResume collection: ${generatedResumeCount} resumes`);
      console.log('✅ Resume history is being saved and retrieved correctly');
    } else if (studentHistoryCount > 0) {
      console.log('⚠️ PARTIAL: Only Student.aiResumeHistory is working');
      console.log('❌ GeneratedResume collection needs investigation');
    } else if (generatedResumeCount > 0) {
      console.log('⚠️ PARTIAL: Only GeneratedResume collection is working');
      console.log('❌ Student.aiResumeHistory needs investigation');
    } else {
      console.log('❌ FAILED: Neither storage method is working');
      console.log('❌ Resume history is not being saved');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('📋 Response data:', error.response.data);
      console.error('📋 Response status:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testResumeHistoryFix()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testResumeHistoryFix };
