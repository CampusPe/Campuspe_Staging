const axios = require('axios');

// Test the AI Resume Match Analysis functionality
async function testAIResumeMatching() {
  console.log('🧪 Testing AI Resume Match Analysis functionality...\n');

  const baseURL = 'http://localhost:5001';
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing API health...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ API Health:', healthResponse.data.message);
    
    // Test 2: Check if we have students in the database
    console.log('\n2️⃣ Checking available students...');
    try {
      const studentsResponse = await axios.get(`${baseURL}/api/students`);
      const students = studentsResponse.data.data || studentsResponse.data;
      console.log(`✅ Found ${students.length} students in database`);
      
      if (students.length > 0) {
        const testStudent = students[0];
        console.log(`📄 Test student: ${testStudent.firstName} ${testStudent.lastName} (ID: ${testStudent._id})`);
        
        // Test 3: Student profile analysis
        console.log('\n3️⃣ Testing student profile analysis...');
        try {
          const analysisResponse = await axios.get(`${baseURL}/api/student-career/${testStudent._id}/analyze`);
          console.log('✅ Student Profile Analysis successful');
          console.log('📊 AI Analysis:', JSON.stringify(analysisResponse.data.data.aiAnalysis, null, 2));
          console.log('📈 Profile Completeness:', analysisResponse.data.data.recommendations.profileCompleteness + '%');
        } catch (error) {
          console.log('❌ Student Profile Analysis failed:', error.response?.data?.message || error.message);
        }
        
        // Test 4: Get job matches
        console.log('\n4️⃣ Testing job matching...');
        try {
          const matchesResponse = await axios.get(`${baseURL}/api/student-career/${testStudent._id}/job-matches?threshold=0.3&limit=5`);
          console.log('✅ Job Matching successful');
          console.log(`📊 Found ${matchesResponse.data.data.totalMatches} total matches`);
          console.log(`📋 Returning top ${matchesResponse.data.data.returnedMatches} matches:`);
          
          if (matchesResponse.data.data.matches.length > 0) {
            matchesResponse.data.data.matches.forEach((match, index) => {
              console.log(`  ${index + 1}. ${match.jobTitle} at ${match.companyName} - ${match.matchScore}% match`);
              console.log(`     Skills: ${match.matchedSkills?.join(', ') || 'N/A'}`);
            });
          } else {
            console.log('   No matches found above threshold');
          }
        } catch (error) {
          console.log('❌ Job Matching failed:', error.response?.data?.message || error.message);
          if (error.response?.data?.error) {
            console.log('   Error details:', error.response.data.error);
          }
        }
        
        // Test 5: Check jobs availability
        console.log('\n5️⃣ Checking available jobs...');
        try {
          const jobsResponse = await axios.get(`${baseURL}/api/jobs`);
          const jobs = jobsResponse.data.data || jobsResponse.data;
          console.log(`✅ Found ${jobs.length} jobs in database`);
          
          if (jobs.length > 0) {
            const activeJobs = jobs.filter(job => job.status === 'active');
            console.log(`📊 Active jobs: ${activeJobs.length}`);
            if (activeJobs.length > 0) {
              console.log(`📋 Sample active job: ${activeJobs[0].title} at ${activeJobs[0].companyName}`);
            }
          }
        } catch (error) {
          console.log('❌ Jobs check failed:', error.response?.data?.message || error.message);
        }
        
      } else {
        console.log('⚠️ No students found in database to test matching');
      }
      
    } catch (error) {
      console.log('❌ Students check failed:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAIResumeMatching();
