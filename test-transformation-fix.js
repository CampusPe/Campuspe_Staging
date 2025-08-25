const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

const TEST_USER = {
  email: 'premthakare@gmail.com',
  password: 'pppppp'
};

const TEST_JOB_DESCRIPTION = `
We are looking for a talented Software Engineer to join our team. 
The ideal candidate should have experience with:
- JavaScript and React
- Node.js backend development
- Database management
- Problem-solving skills
- Team collaboration
`;

async function testTransformationFix() {
  try {
    console.log('🔧 TESTING TRANSFORMATION FIX FOR MONGODB ATLAS STORAGE');
    console.log('=' + '='.repeat(60));

    // Step 1: Login to get auth token
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Step 2: Generate AI resume to test transformation
    console.log('\n2️⃣ Generating AI resume with enhanced logging...');
    const resumeResponse = await axios.post(`${API_BASE_URL}/api/ai-resume-builder/generate-ai`, {
      email: TEST_USER.email,
      phone: '9156621088',
      jobDescription: TEST_JOB_DESCRIPTION,
      includeProfileData: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resumeResponse.data.success) {
      throw new Error('Resume generation failed: ' + resumeResponse.data.message);
    }

    console.log('✅ Resume generation completed');
    console.log('📄 Resume ID:', resumeResponse.data.data.resumeId);
    console.log('💾 History saved:', resumeResponse.data.historySaved);
    
    if (resumeResponse.data.historyError) {
      console.log('⚠️ History error:', resumeResponse.data.historyError);
    }

    // Step 3: Check MongoDB Atlas directly
    console.log('\n3️⃣ Testing debug endpoint to check MongoDB...');
    try {
      const debugResponse = await axios.get(`${API_BASE_URL}/api/generated-resume/debug-db`);
      
      if (debugResponse.data.success) {
        console.log('✅ Debug endpoint working');
        console.log('📊 Total GeneratedResume documents:', debugResponse.data.data.totalCount);
        
        if (debugResponse.data.data.totalCount > 0) {
          console.log('🎉 SUCCESS! Resume saved to MongoDB Atlas GeneratedResume collection!');
          console.log('📋 Sample resumes:', debugResponse.data.data.sampleResumes);
        } else {
          console.log('❌ FAILURE: No resumes in GeneratedResume collection');
        }
      }
    } catch (debugError) {
      console.log('⚠️ Debug endpoint error:', debugError.message);
    }

    // Step 4: Test resume history endpoint
    console.log('\n4️⃣ Testing resume history endpoint...');
    const historyResponse = await axios.get(`${API_BASE_URL}/api/generated-resume/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (historyResponse.data.success) {
      console.log('✅ Resume history retrieved');
      console.log('📊 Resumes found:', historyResponse.data.data.resumes.length);
      console.log('📍 Source:', historyResponse.data.data.source);
      
      if (historyResponse.data.data.resumes.length > 0) {
        const latestResume = historyResponse.data.data.resumes[0];
        console.log('📄 Latest resume details:');
        console.log('  - ID:', latestResume.resumeId);
        console.log('  - Job Title:', latestResume.jobTitle);
        console.log('  - Status:', latestResume.status);
        
        // Step 5: Test download
        console.log('\n5️⃣ Testing resume download...');
        try {
          const downloadResponse = await axios.get(`${API_BASE_URL}/api/generated-resume/${latestResume.resumeId}/download`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
          });
          
          if (downloadResponse.status === 200) {
            const pdfSize = downloadResponse.data.byteLength;
            console.log('✅ Download successful!');
            console.log('📊 PDF size:', (pdfSize / 1024).toFixed(2), 'KB');
          } else {
            console.log('❌ Download failed with status:', downloadResponse.status);
          }
        } catch (downloadError) {
          console.log('❌ Download error:', downloadError.response?.status || downloadError.message);
        }
      }
    }

    console.log('\n' + '='.repeat(62));
    console.log('🎉 TRANSFORMATION TEST COMPLETED');
    console.log('=' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testTransformationFix();
