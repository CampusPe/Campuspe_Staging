const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://dev.campuspe.com'],
    credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'CampusPe API (Test Mode)',
        mongodb: 'DISABLED for testing'
    });
});

// Mock user route for testing
app.get('/api/user/:identifier', (req, res) => {
    const { identifier } = req.params;
    
    // Return mock user data similar to Prem's profile
    if (identifier === '919876543210' || identifier === 'prem@campuspe.com') {
        res.json({
            success: true,
            data: {
                _id: 'mock_user_id_123',
                name: 'Prem Thakare',
                email: 'prem@campuspe.com',
                phone: '919876543210',
                profile: {
                    skills: [
                        { name: 'Search Engine Optimization (SEO)', level: 'advanced', category: 'technical' },
                        { name: 'Search Engine Marketing (SEM)', level: 'advanced', category: 'technical' },
                        { name: 'Social Media Marketing', level: 'intermediate', category: 'technical' },
                        { name: 'Content Marketing', level: 'intermediate', category: 'technical' },
                        { name: 'Google Analytics', level: 'intermediate', category: 'technical' },
                        { name: 'Google Ads', level: 'intermediate', category: 'technical' }
                    ],
                    education: [{
                        degree: 'B.Tech',
                        field: 'Computer Science and Engineering',
                        institution: 'University',
                        year: '2024'
                    }],
                    experience: [{
                        title: 'Software Development & Engineering Intern',
                        company: 'Tech Company',
                        duration: '2023-2024',
                        description: 'Worked on web application development and engineering projects.'
                    }],
                    projects: [{
                        title: 'Web Application Development',
                        description: 'Built and deployed web applications with user authentication, data management, and responsive design using modern frameworks and technologies.',
                        technologies: ['React', 'Node.js', 'MongoDB', 'Express']
                    }]
                }
            }
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'User not found',
            message: `No user found with identifier: ${identifier}`
        });
    }
});

// Mock WABB endpoint for testing
app.post('/api/wabb/send-resume', async (req, res) => {
    const { phone, jobTitle = 'Software Developer' } = req.body;
    
    console.log('📱 WABB Resume Request received:', { phone, jobTitle });
    
    try {
        // Step 1: Mock user lookup
        console.log('🔍 Looking up user for phone:', phone);
        
        if (phone !== '919876543210') {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: `No user found with phone: ${phone}`
            });
        }
        
        // Step 2: Mock resume generation
        console.log('📄 Generating AI-tailored resume for:', jobTitle);
        
        // Import mock WhatsApp service
        const mockWhatsApp = require('./src/services/mock-whatsapp.js');
        
        // Step 3: Send WhatsApp message
        console.log('📤 Sending resume via WhatsApp...');
        const message = `Hello Prem! 🎉\n\nYour AI-powered resume for "${jobTitle}" position is ready!\n\n✨ Key highlights matched to this role:\n• Search Engine Optimization (SEO) - Advanced\n• Search Engine Marketing (SEM) - Advanced\n• Social Media Marketing - Intermediate\n• Content Marketing - Intermediate\n\n📋 Your experience as Software Development & Engineering Intern has been highlighted to match this opportunity.\n\n🚀 Best of luck with your application!\n\n- CampusPe Team`;
        
        const whatsappResult = await mockWhatsApp.sendMessage(phone, message, 'resume');
        
        console.log('✅ WhatsApp result:', whatsappResult);
        
        // Mock response
        const response = {
            success: true,
            message: 'Resume generated and sent successfully via WhatsApp',
            data: {
                phone,
                jobTitle,
                resumeGenerated: true,
                whatsappSent: whatsappResult.success,
                messageId: whatsappResult.data.messageId,
                mock: true,
                timestamp: new Date().toISOString()
            }
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ WABB Resume Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process resume request',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 CampusPe API Test Server running on port ${PORT}`);
    console.log(`📋 Test Mode: MongoDB disabled for WABB testing`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
    console.log(`📱 WABB Test: POST http://localhost:${PORT}/api/wabb/send-resume`);
    console.log(`👤 User Test: http://localhost:${PORT}/api/user/919876543210`);
    console.log('✅ Ready for WABB integration testing!');
});

module.exports = app;
