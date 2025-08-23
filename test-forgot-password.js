const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

// Test data for different user types
const testData = {
  student: {
    phone: '7678085840',
    userType: 'student',
    preferredMethod: 'whatsapp'
  },
  college: {
    email: 'college@test.com',
    userType: 'college_admin',
    preferredMethod: 'email'
  },
  recruiter: {
    email: 'recruiter@test.com',
    userType: 'recruiter',
    preferredMethod: 'email'
  }
};

async function testForgotPassword(type) {
  console.log(`\n🧪 Testing Forgot Password for ${type}...`);
  
  try {
    const data = testData[type];
    const payload = type === 'student' ? 
      { phone: data.phone, preferredMethod: data.preferredMethod, userType: data.userType } :
      { email: data.email, preferredMethod: data.preferredMethod, userType: data.userType };
    
    console.log('📤 Sending OTP request:', payload);
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, payload);
    
    console.log('✅ OTP Response:', response.status, response.data);
    
    if (response.data.otpId) {
      console.log(`✨ Success! OTP sent via ${data.preferredMethod} for ${type}`);
      return response.data.otpId;
    } else {
      console.log('❌ No OTP ID returned');
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testOTPVerification(type, otpId) {
  if (!otpId) {
    console.log(`⏭️  Skipping OTP verification for ${type} - no OTP ID`);
    return;
  }
  
  console.log(`\n🔐 Testing OTP Verification for ${type}...`);
  
  try {
    const data = testData[type];
    const payload = {
      otpId: otpId,
      otp: '123456', // Test OTP
      userType: data.userType
    };
    
    console.log('📤 Verifying OTP:', { ...payload, otp: '***' });
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, payload);
    
    console.log('✅ Verification Response:', response.status, response.data);
  } catch (error) {
    console.log('❌ Verification Error:', error.response?.data?.message || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Forgot Password API Tests...\n');
  
  // Test all three user types
  for (const type of ['student', 'college', 'recruiter']) {
    const otpId = await testForgotPassword(type);
    await testOTPVerification(type, otpId);
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
runTests().catch(console.error);
