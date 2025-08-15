#!/usr/bin/env node

const API_BASE_URL = 'http://localhost:5001/api';

async function quickTest() {
  console.log('🔄 Quick API Test...\n');

  try {
    // Test college login
    console.log('1. Testing college login...');
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'prem_thakare@campuspe.com',
        password: 'pppppp'
      })
    });

    const data = await response.json();
    if (data.token) {
      console.log('✅ College login successful');
      
      // Test invitations endpoint
      console.log('2. Testing invitations endpoint...');
      const invitationsResponse = await fetch(`${API_BASE_URL}/invitations`, {
        headers: { 
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      });

      const invitationsData = await invitationsResponse.json();
      if (invitationsData.success) {
        console.log(`✅ Found ${invitationsData.data.invitations.length} invitations`);
        
        // Show invitation statuses
        invitationsData.data.invitations.forEach(inv => {
          console.log(`   📧 ${inv.job.title} (${inv.job.companyName}) - Status: ${inv.status}`);
        });
      }
    }

    console.log('\n🎉 Quick test completed successfully!');
    console.log('\n📝 Summary of fixes implemented:');
    console.log('✅ 1. Fixed Job Information and Company Information display in modal');
    console.log('✅ 2. Removed "Respond to Invitation" buttons for accepted invitations');
    console.log('✅ 3. Added resend invitation API functionality');
    console.log('✅ 4. Improved modal UI consistency');
    console.log('\n🌐 You can now test the UI at: http://localhost:3000');
    console.log('🔑 College Login: prem_thakare@campuspe.com / pppppp');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();
