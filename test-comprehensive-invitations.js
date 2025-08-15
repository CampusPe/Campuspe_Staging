#!/usr/bin/env node

/**
 * Comprehensive Invitation System Test
 * Tests all invitation functionality between colleges and recruiters
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';
const WEB_BASE = 'http://localhost:3000';

// Test configuration
const config = {
    testUsers: {
        college: {
            email: 'college@test.com',
            password: 'password123',
            role: 'college',
            userType: 'college',
            phoneNumber: '+91-9876543210',
            whatsappNumber: '+91-9876543210',
            profileData: {
                collegeName: 'Test College',
                shortName: 'TC',
                domainCode: 'TC2024',
                website: 'https://testcollege.edu',
                establishedYear: 2000,
                affiliation: 'Test University',
                street: '123 College Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400001',
                country: 'India',
                contactName: 'Dr. John Smith',
                contactDesignation: 'Principal',
                contactEmail: 'college@test.com',
                contactPhone: '+91-9876543210',
                accreditation: ['NAAC A+'],
                departments: ['Computer Science', 'Electronics'],
                allowDirectApplications: true,
                isPlacementActive: true,
                firstName: 'John',
                lastName: 'Smith'
            }
        },
        recruiter: {
            email: 'recruiter@test.com', 
            password: 'password123',
            role: 'recruiter',
            userType: 'recruiter',
            phoneNumber: '+91-9876543211',
            whatsappNumber: '+91-9876543211',
            profileData: {
                firstName: 'Jane',
                lastName: 'Doe',
                designation: 'HR Manager',
                department: 'Human Resources',
                companyName: 'Test Company',
                industry: 'Technology',
                website: 'https://testcompany.com',
                companyDescription: 'Leading tech company',
                companySize: 'medium',
                foundedYear: 2010,
                city: 'Bangalore',
                state: 'Karnataka',
                country: 'India',
                preferredColleges: [],
                preferredCourses: ['Computer Science'],
                hiringSeasons: ['continuous'],
                averageHires: 15,
                workLocations: ['Bangalore'],
                remoteWork: true
            }
        }
    },
    testJob: {
        title: 'Software Engineer',
        description: 'Full-stack developer position',
        requirements: ['JavaScript', 'React', 'Node.js'],
        salary: '8-12 LPA',
        location: 'Bangalore',
        type: 'Full-time',
        postingType: 'college-specific'
    }
};

class InvitationSystemTester {
    constructor() {
        this.tokens = {};
        this.userIds = {};
        this.createdData = {
            jobs: [],
            invitations: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '📋',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            test: '🧪'
        }[type] || '📋';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async makeRequest(method, endpoint, data = null, token = null) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const config = {
                method,
                url: `${API_BASE}${endpoint}`,
                headers,
                ...(data && { data })
            };

            const response = await axios(config);
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data || error.message,
                status: error.response?.status
            };
        }
    }

    async testUserRegistration() {
        this.log('Testing user registration...', 'test');
        
        for (const [userType, userData] of Object.entries(config.testUsers)) {
            // Try to register the user (might already exist)
            const registerResult = await this.makeRequest('POST', '/auth/register', userData);
            
            if (registerResult.success) {
                this.log(`✅ ${userType} user registered successfully`, 'success');
            } else if (registerResult.status === 400 && 
                       (registerResult.error.message?.includes('already exists') || 
                        registerResult.error.message?.includes('User already exists'))) {
                this.log(`⚠️ ${userType} user already exists, proceeding with login`, 'warning');
            } else {
                this.log(`❌ Failed to register ${userType}: ${JSON.stringify(registerResult.error)}`, 'error');
                // Continue anyway in case user exists
            }
        }
    }

    async testUserLogin() {
        this.log('Testing user authentication...', 'test');
        
        for (const [userType, userData] of Object.entries(config.testUsers)) {
            const loginResult = await this.makeRequest('POST', '/auth/login', {
                email: userData.email,
                password: userData.password
            });
            
            if (loginResult.success) {
                this.tokens[userType] = loginResult.data.token;
                this.userIds[userType] = loginResult.data.user._id;
                this.log(`✅ ${userType} login successful`, 'success');
            } else {
                this.log(`❌ ${userType} login failed: ${JSON.stringify(loginResult.error)}`, 'error');
                throw new Error(`Cannot proceed without ${userType} authentication`);
            }
        }
    }

    async testJobPosting() {
        this.log('Testing job posting...', 'test');
        
        const jobData = {
            ...config.testJob,
            targetColleges: [this.userIds.college]
        };
        
        const result = await this.makeRequest('POST', '/jobs', jobData, this.tokens.recruiter);
        
        if (result.success) {
            this.createdData.jobs.push(result.data._id);
            this.log(`✅ Job posted successfully: ${result.data.title}`, 'success');
            this.log(`📤 Automatic invitations should be sent to selected colleges`, 'info');
            return result.data._id;
        } else {
            this.log(`❌ Job posting failed: ${JSON.stringify(result.error)}`, 'error');
            return null;
        }
    }

    async testAutomaticInvitations() {
        this.log('Testing automatic invitation sending...', 'test');
        
        // Wait a moment for invitations to be created
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const result = await this.makeRequest('GET', '/invitations', null, this.tokens.college);
        
        if (result.success) {
            const automaticInvitations = result.data.filter(inv => 
                inv.type === 'job' && inv.status === 'pending'
            );
            
            if (automaticInvitations.length > 0) {
                this.log(`✅ Automatic invitations sent: ${automaticInvitations.length}`, 'success');
                return automaticInvitations[0]._id;
            } else {
                this.log(`❌ No automatic invitations found`, 'error');
                return null;
            }
        } else {
            this.log(`❌ Failed to fetch invitations: ${JSON.stringify(result.error)}`, 'error');
            return null;
        }
    }

    async testManualInvitations() {
        this.log('Testing manual invitation sending...', 'test');
        
        const invitationData = {
            type: 'placement',
            collegeId: this.userIds.college,
            targetId: this.userIds.recruiter,
            targetType: 'recruiter',
            message: 'We would like to invite your company for campus placements'
        };
        
        const result = await this.makeRequest('POST', '/invitations', invitationData, this.tokens.college);
        
        if (result.success) {
            this.createdData.invitations.push(result.data._id);
            this.log(`✅ Manual invitation sent successfully`, 'success');
            return result.data._id;
        } else {
            this.log(`❌ Manual invitation failed: ${JSON.stringify(result.error)}`, 'error');
            return null;
        }
    }

    async testInvitationResponses(invitationId) {
        this.log('Testing invitation responses...', 'test');
        
        if (!invitationId) {
            this.log('❌ No invitation ID provided for response testing', 'error');
            return;
        }

        // Test accepting invitation
        const acceptResult = await this.makeRequest('POST', `/invitations/${invitationId}/respond`, {
            response: 'accepted',
            message: 'We accept this invitation'
        }, this.tokens.recruiter);
        
        if (acceptResult.success) {
            this.log(`✅ Invitation accepted successfully`, 'success');
        } else {
            this.log(`❌ Failed to accept invitation: ${JSON.stringify(acceptResult.error)}`, 'error');
        }
    }

    async testInvitationDetails() {
        this.log('Testing invitation details retrieval...', 'test');
        
        const result = await this.makeRequest('GET', '/invitations', null, this.tokens.college);
        
        if (result.success && result.data.length > 0) {
            const invitation = result.data[0];
            const detailsResult = await this.makeRequest('GET', `/invitations/${invitation._id}`, null, this.tokens.college);
            
            if (detailsResult.success) {
                this.log(`✅ Invitation details retrieved successfully`, 'success');
                this.log(`📋 Invitation: ${detailsResult.data.type} - ${detailsResult.data.status}`, 'info');
            } else {
                this.log(`❌ Failed to get invitation details: ${JSON.stringify(detailsResult.error)}`, 'error');
            }
        }
    }

    async testAPIEndpoints() {
        this.log('Testing all API endpoints...', 'test');
        
        const endpoints = [
            { method: 'GET', path: '/invitations', token: 'college', description: 'Get college invitations' },
            { method: 'GET', path: '/invitations', token: 'recruiter', description: 'Get recruiter invitations' },
            { method: 'GET', path: '/jobs', token: 'recruiter', description: 'Get jobs' },
            { method: 'GET', path: '/recruiters/approved', token: 'college', description: 'Get approved recruiters' },
            { method: 'GET', path: '/connections', token: 'college', description: 'Get connections' }
        ];
        
        for (const endpoint of endpoints) {
            const result = await this.makeRequest(endpoint.method, endpoint.path, null, this.tokens[endpoint.token]);
            
            if (result.success) {
                this.log(`✅ ${endpoint.description}: Success`, 'success');
            } else {
                this.log(`❌ ${endpoint.description}: Failed - ${JSON.stringify(result.error)}`, 'error');
            }
        }
    }

    async cleanup() {
        this.log('Cleaning up test data...', 'info');
        
        // Clean up created jobs
        for (const jobId of this.createdData.jobs) {
            await this.makeRequest('DELETE', `/jobs/${jobId}`, null, this.tokens.recruiter);
        }
        
        // Clean up created invitations  
        for (const invitationId of this.createdData.invitations) {
            await this.makeRequest('DELETE', `/invitations/${invitationId}`, null, this.tokens.college);
        }
        
        this.log('✅ Cleanup completed', 'success');
    }

    async runAllTests() {
        this.log('🚀 Starting comprehensive invitation system test...', 'info');
        this.log(`📡 API Base: ${API_BASE}`, 'info');
        this.log(`🌐 Web Base: ${WEB_BASE}`, 'info');
        
        try {
            // Phase 1: User Authentication
            await this.testUserRegistration();
            await this.testUserLogin();
            
            // Phase 2: Job Posting and Automatic Invitations
            const jobId = await this.testJobPosting();
            const autoInvitationId = await this.testAutomaticInvitations();
            
            // Phase 3: Manual Invitations
            const manualInvitationId = await this.testManualInvitations();
            
            // Phase 4: Invitation Responses
            if (autoInvitationId) {
                await this.testInvitationResponses(autoInvitationId);
            }
            
            // Phase 5: Invitation Details
            await this.testInvitationDetails();
            
            // Phase 6: API Endpoints
            await this.testAPIEndpoints();
            
            this.log('🎉 All tests completed!', 'success');
            this.log('📋 Next steps: Test the frontend UI manually using the credentials above', 'info');
            this.log(`🔐 College Login: ${config.testUsers.college.email} / ${config.testUsers.college.password}`, 'info');
            this.log(`🔐 Recruiter Login: ${config.testUsers.recruiter.email} / ${config.testUsers.recruiter.password}`, 'info');
            
        } catch (error) {
            this.log(`💥 Test suite failed: ${error.message}`, 'error');
        } finally {
            // Don't cleanup in case user wants to test UI with this data
            // await this.cleanup();
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new InvitationSystemTester();
    tester.runAllTests().catch(console.error);
}

module.exports = InvitationSystemTester;
