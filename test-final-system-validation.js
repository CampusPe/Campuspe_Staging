#!/usr/bin/env node

/**
 * FINAL SYSTEM VALIDATION TEST
 * 
 * This test validates the complete separation and functionality of:
 * 1. Connection System (User networking)
 * 2. Invitation System (Job recruitment)
 * 
 * Ensures no cross-contamination and proper request/response handling
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test user credentials (you'll need to update these)
const TEST_USERS = {
  college1: {
    email: 'college1@test.com',
    password: 'testpass123',
    role: 'college'
  },
  college2: {
    email: 'college2@test.com', 
    password: 'testpass123',
    role: 'college'
  },
  recruiter1: {
    email: 'recruiter1@test.com',
    password: 'testpass123',
    role: 'recruiter'
  }
};

let authTokens = {};

// Helper function to authenticate users
async function authenticateUser(userKey) {
  try {
    const user = TEST_USERS[userKey];
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    });
    
    if (response.data.success) {
      authTokens[userKey] = response.data.token;
      console.log(`✅ ${userKey} authenticated successfully`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ${userKey} authentication failed:`, error.response?.data?.message || error.message);
    return false;
  }
}

// Helper function to make authenticated requests
function makeAuthRequest(userKey) {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${authTokens[userKey]}`,
      'Content-Type': 'application/json'
    }
  });
}

async function testConnectionSystem() {
  console.log('\n🔗 TESTING CONNECTION SYSTEM (User Networking)');
  console.log('================================================');
  
  try {
    const college1Api = makeAuthRequest('college1');
    const college2Api = makeAuthRequest('college2');
    
    // Test 1: College1 sends connection request to College2
    console.log('\n1. Testing connection request creation...');
    try {
      const connectionResponse = await college1Api.post('/connections', {
        targetUserId: 'COLLEGE2_USER_ID', // You'll need to replace with actual College2 user ID
        connectionType: 'educational_partnership',
        message: 'Would like to establish a partnership for student exchange'
      });
      
      if (connectionResponse.data.success) {
        console.log('✅ Connection request created successfully');
      } else {
        console.log('❌ Connection request failed:', connectionResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Connection request error:', error.response?.data?.message || error.message);
    }
    
    // Test 2: Check College1's sent connections (should see outgoing request)
    console.log('\n2. Testing College1 sent connections...');
    try {
      const sentResponse = await college1Api.get('/connections/sent');
      if (sentResponse.data.success) {
        console.log(`✅ College1 sent connections: ${sentResponse.data.data.connections.length} found`);
        sentResponse.data.data.connections.forEach(conn => {
          console.log(`   - To: ${conn.receiver.profile?.name || 'Unknown'}, Status: ${conn.status}`);
        });
      }
    } catch (error) {
      console.log('❌ Sent connections error:', error.response?.data?.message || error.message);
    }
    
    // Test 3: Check College2's received connections (should see incoming request)
    console.log('\n3. Testing College2 received connections...');
    try {
      const receivedResponse = await college2Api.get('/connections/received');
      if (receivedResponse.data.success) {
        console.log(`✅ College2 received connections: ${receivedResponse.data.data.connections.length} found`);
        receivedResponse.data.data.connections.forEach(conn => {
          console.log(`   - From: ${conn.requester.profile?.name || 'Unknown'}, Status: ${conn.status}`);
        });
      }
    } catch (error) {
      console.log('❌ Received connections error:', error.response?.data?.message || error.message);
    }
    
    // Test 4: Verify no self-connections appear
    console.log('\n4. Testing self-connection prevention...');
    try {
      const allConnectionsResponse = await college1Api.get('/connections');
      if (allConnectionsResponse.data.success) {
        const selfConnections = allConnectionsResponse.data.data.connections.filter(conn => 
          conn.isRequester && conn.receiver.userId.toString() === conn.requester.userId.toString()
        );
        if (selfConnections.length === 0) {
          console.log('✅ No self-connections found - prevention working correctly');
        } else {
          console.log(`❌ Found ${selfConnections.length} self-connections - prevention failed`);
        }
      }
    } catch (error) {
      console.log('❌ Self-connection check error:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.log('❌ Connection system test failed:', error.message);
  }
}

async function testInvitationSystem() {
  console.log('\n📧 TESTING INVITATION SYSTEM (Job Recruitment)');
  console.log('===============================================');
  
  try {
    const recruiterApi = makeAuthRequest('recruiter1');
    const collegeApi = makeAuthRequest('college1');
    
    // Test 1: Recruiter creates job invitation
    console.log('\n1. Testing job invitation creation...');
    try {
      // First, we need to create a job or use existing job ID
      // This is a simplified test - you'd need actual job and college IDs
      const invitationResponse = await recruiterApi.post('/invitations', {
        jobId: 'JOB_ID_HERE', // Replace with actual job ID
        collegeId: 'COLLEGE_ID_HERE', // Replace with actual college ID
        proposedDates: ['2024-02-15', '2024-02-16'],
        invitationMessage: 'We would like to conduct campus recruitment for Software Developer positions'
      });
      
      if (invitationResponse.data.success) {
        console.log('✅ Job invitation created successfully');
      } else {
        console.log('❌ Job invitation failed:', invitationResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Job invitation error:', error.response?.data?.message || error.message);
    }
    
    // Test 2: College checks received invitations
    console.log('\n2. Testing college invitation retrieval...');
    try {
      const invitationsResponse = await collegeApi.get('/colleges/invitations');
      if (invitationsResponse.data.success) {
        console.log(`✅ College invitations: ${invitationsResponse.data.data.invitations.length} found`);
        invitationsResponse.data.data.invitations.forEach(inv => {
          console.log(`   - Job: ${inv.job.title}, Company: ${inv.job.companyName}, Status: ${inv.status}`);
        });
      }
    } catch (error) {
      console.log('❌ College invitations error:', error.response?.data?.message || error.message);
    }
    
    // Test 3: Test invitation status filtering
    console.log('\n3. Testing invitation status filtering...');
    try {
      const pendingResponse = await collegeApi.get('/colleges/invitations?status=pending');
      if (pendingResponse.data.success) {
        console.log(`✅ Pending invitations: ${pendingResponse.data.data.invitations.length} found`);
      }
    } catch (error) {
      console.log('❌ Invitation filtering error:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.log('❌ Invitation system test failed:', error.message);
  }
}

async function testSystemSeparation() {
  console.log('\n🚧 TESTING SYSTEM SEPARATION');
  console.log('=============================');
  
  try {
    const collegeApi = makeAuthRequest('college1');
    
    // Test 1: Verify connections don't appear in invitations
    console.log('\n1. Testing connections/invitations separation...');
    
    const connectionsResponse = await collegeApi.get('/connections');
    const invitationsResponse = await collegeApi.get('/colleges/invitations');
    
    if (connectionsResponse.data.success && invitationsResponse.data.success) {
      const connections = connectionsResponse.data.data.connections;
      const invitations = invitationsResponse.data.data.invitations;
      
      console.log(`✅ Connections found: ${connections.length}`);
      console.log(`✅ Invitations found: ${invitations.length}`);
      
      // Verify no overlap in IDs
      const connectionIds = connections.map(c => c.id);
      const invitationIds = invitations.map(i => i.id);
      const overlap = connectionIds.filter(id => invitationIds.includes(id));
      
      if (overlap.length === 0) {
        console.log('✅ No ID overlap between connections and invitations - proper separation');
      } else {
        console.log(`❌ Found ${overlap.length} overlapping IDs - separation failed`);
      }
    }
    
  } catch (error) {
    console.log('❌ System separation test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE SYSTEM VALIDATION');
  console.log('===========================================');
  
  // Authenticate all test users
  console.log('\n🔐 AUTHENTICATING TEST USERS');
  const authResults = await Promise.all([
    authenticateUser('college1'),
    authenticateUser('college2'),
    authenticateUser('recruiter1')
  ]);
  
  if (!authResults.every(result => result)) {
    console.log('❌ Not all users authenticated. Please check user credentials and try again.');
    return;
  }
  
  // Run all tests
  await testConnectionSystem();
  await testInvitationSystem();
  await testSystemSeparation();
  
  console.log('\n🎉 VALIDATION COMPLETE');
  console.log('=====================');
  console.log('Review the results above to ensure:');
  console.log('1. ✅ Connection system handles user networking properly');
  console.log('2. ✅ Invitation system handles job recruitment properly');
  console.log('3. ✅ No self-requests appear in dashboards');
  console.log('4. ✅ Systems are completely separated');
  console.log('5. ✅ Status displays work correctly');
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testConnectionSystem,
  testInvitationSystem,
  testSystemSeparation
};
