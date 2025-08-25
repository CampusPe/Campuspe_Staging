/**
 * Test script to verify the BunnyCDN integration with the AI resume builder
 * This test will generate a PDF and upload it to BunnyCDN, then verify the download URL
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configure environment variables
require('dotenv').config({ path: path.join(process.cwd(), 'apps/api/.env') });

// Log the test run
console.log('🧪 Testing BunnyCDN integration with AI resume builder');
console.log('----------------------------------------------------');

// BunnyCDN configuration
const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
const hostname = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';
const cdnUrl = process.env.BUNNY_CDN_URL;

// Log BunnyCDN configuration (with masked key)
console.log('BunnyCDN Configuration:');
console.log(`- Storage Zone: ${storageZone}`);
console.log(`- Access Key: ${accessKey ? accessKey.substring(0, 8) + '...' : 'Not set'}`);
console.log(`- Hostname: ${hostname}`);
console.log(`- CDN URL: ${cdnUrl}`);
console.log('----------------------------------------------------');

// Mock resume data (simplified)
const resumeData = {
  personalInfo: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '123-456-7890',
    title: 'Software Developer',
    website: 'https://example.com'
  },
  educations: [{
    institution: 'Test University',
    degree: 'Bachelor of Science',
    field: 'Computer Science',
    startDate: '2018-09',
    endDate: '2022-05'
  }],
  experiences: [{
    company: 'Test Company',
    position: 'Software Developer',
    startDate: '2022-06',
    endDate: 'Present',
    description: 'Developing awesome software'
  }]
};

// API endpoints
const API_URL = process.env.API_URL || 'http://localhost:4000';
const RESUME_API_ENDPOINT = `${API_URL}/api/v1/ai-resume-builder`;

// Function to test generating and uploading a resume
async function testResumeGeneration() {
  try {
    console.log('Sending resume generation request...');
    
    const response = await axios.post(RESUME_API_ENDPOINT, {
      data: resumeData,
      userId: 'test-user-001',
      studentProfileId: 'test-profile-001'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      // Set a longer timeout for PDF generation
      timeout: 30000
    });
    
    console.log('✅ Resume generation successful!');
    console.log('----------------------------------------------------');
    console.log('Response:');
    
    // Log the response structure
    const { cloudUrl, localUrl, status } = response.data;
    console.log(`- Status: ${status}`);
    console.log(`- Cloud URL: ${cloudUrl}`);
    console.log(`- Local URL: ${localUrl}`);
    
    // Verify cloudUrl format
    if (cloudUrl && cloudUrl.includes(cdnUrl)) {
      console.log('✅ cloudUrl is correctly formatted with BunnyCDN URL');
    } else {
      console.log('❌ cloudUrl is not using BunnyCDN URL format');
    }
    
    // Test downloading from cloudUrl
    if (cloudUrl) {
      console.log('----------------------------------------------------');
      console.log(`Testing download from cloudUrl: ${cloudUrl}`);
      
      try {
        // Just check headers to see if the file exists
        const downloadResponse = await axios.head(cloudUrl);
        console.log(`✅ Download successful! Status: ${downloadResponse.status}`);
        
        // Check content type
        const contentType = downloadResponse.headers['content-type'];
        if (contentType && contentType.includes('pdf')) {
          console.log(`✅ Content-Type is correct: ${contentType}`);
        } else {
          console.log(`⚠️ Unexpected Content-Type: ${contentType}`);
        }
        
        // Check file size
        const contentLength = downloadResponse.headers['content-length'];
        console.log(`📊 File size: ${formatBytes(contentLength)}`);
        
      } catch (dlErr) {
        console.log(`❌ Download failed: ${dlErr.message}`);
        if (dlErr.response) {
          console.log(`Status: ${dlErr.response.status}`);
        }
      }
    }
    
    return response.data;
    
  } catch (error) {
    console.log('❌ Resume generation failed');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Run the test
testResumeGeneration().then(() => {
  console.log('----------------------------------------------------');
  console.log('Test completed!');
});
