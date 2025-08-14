const mongoose = require('mongoose');
const { Recruiter } = require('./apps/api/src/models/Recruiter');
const { User } = require('./apps/api/src/models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuspe';

async function listRecruiters() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all recruiters with their user data
        const recruiters = await Recruiter.find({})
            .populate('userId', 'email firstName lastName')
            .sort({ createdAt: -1 });

        if (recruiters.length === 0) {
            console.log('No recruiters found in the database.');
            return;
        }

        console.log('\n📋 All Recruiters:');
        console.log('==================');
        
        recruiters.forEach((recruiter, index) => {
            const user = recruiter.userId;
            console.log(`\n${index + 1}. ${recruiter.companyInfo.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Approval Status: ${recruiter.approvalStatus}`);
            console.log(`   Verification Status: ${recruiter.verificationStatus}`);
            console.log(`   Active: ${recruiter.isActive}`);
            console.log(`   Industry: ${recruiter.companyInfo.industry}`);
            console.log(`   Created: ${recruiter.createdAt.toLocaleDateString()}`);
        });

        console.log(`\n📊 Summary:`);
        console.log(`Total Recruiters: ${recruiters.length}`);
        console.log(`Approved: ${recruiters.filter(r => r.approvalStatus === 'approved').length}`);
        console.log(`Pending: ${recruiters.filter(r => r.approvalStatus === 'pending').length}`);
        console.log(`Rejected: ${recruiters.filter(r => r.approvalStatus === 'rejected').length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

listRecruiters();
