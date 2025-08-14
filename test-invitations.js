#!/usr/bin/env node

// This is a quick test script to create sample job invitations for testing
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function createSampleInvitations() {
  console.log('🧪 Creating sample job invitations for testing...');
  
  try {
    // First, let's see if we have any sample data
    const response = await axios.get(`${API_BASE_URL}/jobs`);
    console.log('📋 Existing jobs:', response.data?.data?.jobs?.length || 0);
    
    if (response.data?.data?.jobs?.length > 0) {
      console.log('✅ Sample jobs already exist');
      console.log('🎯 Jobs available:', response.data.data.jobs.map(j => `${j.title} (${j._id})`));
    } else {
      console.log('ℹ️  No jobs found. You may need to create jobs first through the recruiter dashboard.');
    }
    
    // Check for colleges
    const collegesResponse = await axios.get(`${API_BASE_URL}/colleges`);
    console.log('🏫 Existing colleges:', collegesResponse.data?.data?.colleges?.length || 0);
    
    if (collegesResponse.data?.data?.colleges?.length > 0) {
      console.log('✅ Sample colleges available');
      console.log('🎓 Colleges:', collegesResponse.data.data.colleges.map(c => `${c.name} (${c._id})`));
    } else {
      console.log('ℹ️  No colleges found. You may need to register colleges first.');
    }
    
  } catch (error) {
    console.error('❌ Error checking sample data:', error.message);
  }
}

// Run the test
createSampleInvitations();
