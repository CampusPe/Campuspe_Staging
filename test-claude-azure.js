// Comprehensive Claude API test to run on Azure
const axios = require('axios');

async function testClaudeAPIOnAzure() {
    console.log('\n=== AZURE CLAUDE API COMPREHENSIVE TEST ===');
    
    // Test 1: Check environment variables
    console.log('\n--- ENVIRONMENT CHECK ---');
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    console.log('CLAUDE_API_KEY exists:', !!claudeApiKey);
    console.log('ANTHROPIC_API_KEY exists:', !!anthropicApiKey);
    console.log('CLAUDE_API_KEY length:', claudeApiKey ? claudeApiKey.length : 0);
    console.log('ANTHROPIC_API_KEY length:', anthropicApiKey ? anthropicApiKey.length : 0);
    
    const apiKey = claudeApiKey || anthropicApiKey;
    console.log('Using API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NONE');
    
    if (!apiKey) {
        console.log('❌ NO API KEY FOUND - This explains the failure!');
        return;
    }

    // Test 2: Simple Claude API call
    console.log('\n--- CLAUDE API TEST ---');
    try {
        console.log('Making test API call to Claude...');
        
        const testPrompt = `Hello Claude! Please respond with exactly this JSON: {"test": "success", "message": "Claude API is working"}`;
        
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-3-haiku-20240307',
                max_tokens: 100,
                messages: [{
                    role: 'user',
                    content: testPrompt
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 30000
            }
        );

        console.log('✅ Claude API call successful!');
        console.log('Response status:', response.status);
        console.log('Response data structure:', {
            hasContent: !!response.data?.content,
            contentArray: Array.isArray(response.data?.content),
            contentLength: response.data?.content?.length || 0
        });
        
        if (response.data?.content?.[0]?.text) {
            console.log('Response text:', response.data.content[0].text);
            
            // Test JSON parsing
            try {
                const parsed = JSON.parse(response.data.content[0].text);
                console.log('✅ JSON parsing successful:', parsed);
            } catch (parseError) {
                console.log('⚠️ JSON parsing failed:', parseError.message);
                console.log('Raw text:', response.data.content[0].text);
            }
        } else {
            console.log('❌ Unexpected response structure:', response.data);
        }

    } catch (error) {
        console.log('❌ Claude API call failed:');
        console.log('Error message:', error.message);
        console.log('Error code:', error.code);
        
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response headers:', error.response.headers);
            console.log('Response data:', error.response.data);
        }
        
        if (error.request) {
            console.log('Request config:', {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            });
        }
    }

    // Test 3: Resume generation simulation
    console.log('\n--- RESUME GENERATION SIMULATION ---');
    try {
        const resumePrompt = `Create a simple resume JSON for a software developer with 2 years experience. Return ONLY valid JSON with this structure:
{
  "summary": "Professional summary",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": [
    {
      "title": "Software Developer",
      "company": "Tech Corp",
      "duration": "2022 - Present",
      "description": ["Developed web applications"]
    }
  ]
}`;

        const resumeResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: resumePrompt
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                timeout: 30000
            }
        );

        console.log('✅ Resume generation test successful!');
        if (resumeResponse.data?.content?.[0]?.text) {
            const resumeText = resumeResponse.data.content[0].text;
            console.log('Resume response length:', resumeText.length);
            console.log('Resume response preview:', resumeText.substring(0, 200));
            
            try {
                const resumeJson = JSON.parse(resumeText);
                console.log('✅ Resume JSON parsing successful');
                console.log('Generated skills count:', resumeJson.skills?.length || 0);
                console.log('Generated experience count:', resumeJson.experience?.length || 0);
            } catch (resumeParseError) {
                console.log('⚠️ Resume JSON parsing failed:', resumeParseError.message);
            }
        }

    } catch (resumeError) {
        console.log('❌ Resume generation test failed:', resumeError.message);
    }

    console.log('\n=== TEST COMPLETE ===');
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testClaudeAPIOnAzure };
} else {
    // Run directly if called as script
    testClaudeAPIOnAzure().catch(console.error);
}
