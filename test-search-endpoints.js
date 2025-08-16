const axios = require('axios');

async function testSearchEndpoints() {
    console.log('Testing Search Endpoints...\n');

    const baseURL = 'http://localhost:5001/api';

    try {
        // Test College Search
        console.log('1. Testing College Search:');
        const collegeResponse = await axios.get(`${baseURL}/colleges/search?query=college&limit=5`);
        console.log('✅ College Search Status:', collegeResponse.status);
        console.log('✅ College Search Response:', JSON.stringify(collegeResponse.data, null, 2));
        console.log('\n');

        // Test Recruiter Search
        console.log('2. Testing Recruiter Search:');
        const recruiterResponse = await axios.get(`${baseURL}/recruiters/search?query=tech&limit=5`);
        console.log('✅ Recruiter Search Status:', recruiterResponse.status);
        console.log('✅ Recruiter Search Response:', JSON.stringify(recruiterResponse.data, null, 2));
        console.log('\n');

        // Test with empty query (should return error)
        console.log('3. Testing Empty Query (should return error):');
        try {
            const emptyResponse = await axios.get(`${baseURL}/colleges/search?query=`);
        } catch (error) {
            console.log('✅ Empty Query Error (Expected):', error.response.status, error.response.data);
        }
        console.log('\n');

        console.log('🎉 All search endpoint tests completed successfully!');

    } catch (error) {
        console.error('❌ Error testing endpoints:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testSearchEndpoints();
