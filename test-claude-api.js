#!/usr/bin/env node

/**
 * Claude API Key Tester
 * 
 * This script tests if your Claude API key is working properly.
 * Usage: node test-claude-api.js YOUR_API_KEY_HERE
 */

const axios = require('axios');

async function testClaudeAPI(apiKey) {
    if (!apiKey) {
        console.log('❌ No API key provided');
        console.log('Usage: node test-claude-api.js YOUR_API_KEY_HERE');
        console.log('\n📖 How to get a Claude API key:');
        console.log('1. Go to https://console.anthropic.com/');
        console.log('2. Sign up or log in');
        console.log('3. Go to API Keys section');
        console.log('4. Create a new API key');
        console.log('5. Copy the key (starts with sk-ant-api03-)');
        return;
    }

    console.log('🧪 Testing Claude API key...');
    console.log(`🔑 Key format: ${apiKey.substring(0, 20)}...`);

    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-haiku-20240307',
            max_tokens: 100,
            messages: [
                { 
                    role: 'user', 
                    content: 'Hello! Just testing if this API key works. Please respond with "API key is working!"' 
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            }
        });

        console.log('✅ API Key is VALID!');
        console.log('📝 Claude Response:', response.data.content[0].text);
        console.log('\n🎉 Your AI Resume Match Analysis should work now!');
        console.log('\n📋 Next steps:');
        console.log('1. Update your .env file with this API key:');
        console.log('   CLAUDE_API_KEY=' + apiKey);
        console.log('   ANTHROPIC_API_KEY=' + apiKey);
        console.log('2. Restart your API server');
        console.log('3. Test the AI matching again');

    } catch (error) {
        if (error.response) {
            console.log('❌ API Key is INVALID');
            console.log('🔍 Error details:', error.response.data);
            
            if (error.response.status === 401) {
                console.log('\n📖 How to fix this:');
                console.log('1. Go to https://console.anthropic.com/');
                console.log('2. Check if your API key is still active');
                console.log('3. Generate a new API key if needed');
                console.log('4. Make sure you have credits/billing set up');
            }
        } else {
            console.log('❌ Network error:', error.message);
        }
    }
}

// Get API key from command line argument
const apiKey = process.argv[2];
testClaudeAPI(apiKey);
