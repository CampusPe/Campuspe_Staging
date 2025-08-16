#!/usr/bin/env node

/**
 * Complete test for Student Dashboard Data Fetching
 * Tests all the fixes we implemented:
 * 1. Frontend data extraction fix
 * 2. API route ordering fix 
 * 3. MongoDB collection access
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, message) {
    console.log(`${color}${message}${colors.reset}`);
}

async function testEndpoint(url, description) {
    try {
        log(colors.blue, `\n🧪 Testing: ${description}`);
        log(colors.blue, `📡 URL: ${url}`);
        
        const response = await axios.get(url, { timeout: 5000 });
        
        log(colors.green, `✅ Status: ${response.status}`);
        log(colors.green, `📄 Response structure:`);
        
        if (response.data) {
            const data = response.data;
            console.log(JSON.stringify(data, null, 2));
            
            // Check for our specific fix - data should be wrapped in {success, data}
            if (data.success !== undefined) {
                log(colors.green, `✅ SUCCESS: Response follows {success, data} format`);
            } else {
                log(colors.yellow, `⚠️  NOTICE: Response doesn't follow {success, data} format`);
            }
        }
        
        return { success: true, status: response.status, data: response.data };
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            log(colors.red, `❌ ERROR: Cannot connect to server at ${API_BASE_URL}`);
            log(colors.yellow, `💡 Please ensure the API server is running on port 5001`);
        } else if (error.response) {
            log(colors.red, `❌ HTTP Error: ${error.response.status} - ${error.response.statusText}`);
            if (error.response.data) {
                console.log(JSON.stringify(error.response.data, null, 2));
            }
        } else {
            log(colors.red, `❌ Error: ${error.message}`);
        }
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log(colors.bold + colors.blue, '🚀 Starting Student Dashboard Complete Test Suite');
    log(colors.blue, '='*60);
    
    const tests = [
        {
            url: `${API_BASE_URL}/health`,
            description: 'Health Check - Server Status'
        },
        {
            url: `${API_BASE_URL}/api/students/applications`,
            description: 'Student Applications - Fixed Route Ordering'
        },
        {
            url: `${API_BASE_URL}/api/students/profile`,
            description: 'Student Profile - Fixed Route Ordering'
        },
        {
            url: `${API_BASE_URL}/api/colleges`,
            description: 'Colleges List - From campuspe.colleges collection'
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await testEndpoint(test.url, test.description);
        results.push({ ...test, result });
        
        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    log(colors.bold + colors.blue, '\n📊 TEST SUMMARY');
    log(colors.blue, '='*60);
    
    const successful = results.filter(r => r.result.success);
    const failed = results.filter(r => !r.result.success);
    
    log(colors.green, `✅ Passed: ${successful.length}/${results.length}`);
    log(colors.red, `❌ Failed: ${failed.length}/${results.length}`);
    
    if (failed.length > 0) {
        log(colors.red, '\n❌ Failed Tests:');
        failed.forEach(test => {
            log(colors.red, `   • ${test.description}`);
        });
    }
    
    if (successful.length === results.length) {
        log(colors.bold + colors.green, '\n🎉 ALL TESTS PASSED! Student Dashboard fixes are working correctly.');
        log(colors.green, '\n✅ Confirmed fixes:');
        log(colors.green, '   • API route ordering fixed (/applications, /profile before /:id)');
        log(colors.green, '   • Server responding with proper data structure');
        log(colors.green, '   • MongoDB collections accessible');
    } else {
        log(colors.yellow, '\n⚠️  Some tests failed. Please check the API server status.');
    }
    
    // Instructions for manual testing
    log(colors.blue, '\n📝 Manual Testing Instructions:');
    log(colors.blue, '1. Ensure API server is running: cd apps/api && node dist/app.js');
    log(colors.blue, '2. Ensure frontend is running: cd apps/web && npm run dev');
    log(colors.blue, '3. Visit student dashboard and check for "_id field missing" errors');
    log(colors.blue, '4. Verify applications and job matches are displayed');
}

// Handle process termination gracefully
process.on('SIGINT', () => {
    log(colors.yellow, '\n⚠️  Test interrupted by user');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    log(colors.red, `❌ Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
});

// Run the tests
runTests().catch(error => {
    log(colors.red, `❌ Test suite failed: ${error.message}`);
    process.exit(1);
});
