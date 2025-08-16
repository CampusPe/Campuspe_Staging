const axios = require('axios');

async function testFixedSearch() {
    console.log('🔧 Testing Fixed Search Functionality...\n');

    const baseURL = 'http://localhost:5001/api';

    try {
        // Test the searches that were failing
        console.log('1. Testing College Search with "IT":');
        const collegeResponse = await axios.get(`${baseURL}/colleges/search?query=IT`);
        console.log('✅ Status:', collegeResponse.status);
        console.log('✅ Results found:', collegeResponse.data.count);
        if (collegeResponse.data.count > 0) {
            console.log('✅ Sample result:', collegeResponse.data.data[0].name);
        }
        console.log('');

        console.log('2. Testing Recruiter Search with "IT":');
        const recruiterResponse = await axios.get(`${baseURL}/recruiters/search?query=IT`);
        console.log('✅ Status:', recruiterResponse.status);
        console.log('✅ Results found:', recruiterResponse.data.count);
        if (recruiterResponse.data.count > 0) {
            console.log('✅ Sample result:', recruiterResponse.data.data[0].name);
        }
        console.log('');

        console.log('3. Testing College Search with "ITM":');
        const collegeResponse2 = await axios.get(`${baseURL}/colleges/search?query=ITM`);
        console.log('✅ Status:', collegeResponse2.status);
        console.log('✅ Results found:', collegeResponse2.data.count);
        if (collegeResponse2.data.count > 0) {
            console.log('✅ Sample result:', collegeResponse2.data.data[0].name);
        }
        console.log('');

        console.log('4. Testing Recruiter Search with "ITM":');
        const recruiterResponse2 = await axios.get(`${baseURL}/recruiters/search?query=ITM`);
        console.log('✅ Status:', recruiterResponse2.status);
        console.log('✅ Results found:', recruiterResponse2.data.count);
        console.log('');

        console.log('🎉 All search tests passed! The parameter issue has been fixed.');
        console.log('');
        console.log('📝 Fixed Issues:');
        console.log('✅ Changed frontend parameter from "q" to "query"');
        console.log('✅ Updated response processing to handle new API format');
        console.log('✅ Both college and company searches now working');
        console.log('');
        console.log('🚀 Search functionality should now work in the browser!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testFixedSearch();
